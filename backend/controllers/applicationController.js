import { supabaseAdmin } from '../config/supabaseClient.js'

function safeJsonParse(value, fallback = {}) {
  if (!value) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeDocumentUrls(value) {
  let docArr = Array.isArray(value) ? value : []
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    docArr = [value]
  } else if (typeof value === 'string') {
    try { docArr = JSON.parse(value) } catch { docArr = [] }
  }

  if (Array.isArray(docArr)) {
    docArr = docArr.map((doc) => {
      if (typeof doc === 'string') {
        try { return JSON.parse(doc) } catch { return null }
      }
      return doc
    }).filter(Boolean)
  }

  if (!Array.isArray(docArr)) docArr = [docArr]

  const docs = {}
  docArr.flat(Infinity).forEach((doc) => {
    if (doc && doc.type && doc.url) {
      docs[`${doc.type}_url`] = doc.url
    }
  })

  return Object.keys(docs).length > 0 ? docs : docArr
}

function normalizeApplicationRecord(application, scholarship) {
  const personalInfo = safeJsonParse(application.personal_info, {})
  const academicInfo = safeJsonParse(application.academic_info, {})
  const financialInfo = safeJsonParse(academicInfo.financial_info, {})
  const docs = normalizeDocumentUrls(application.document_urls)

  const combinedAcademic = {
    ...academicInfo,
    full_name: personalInfo.full_name || academicInfo.full_name || null,
    student_id: personalInfo.student_id || academicInfo.student_id || null,
    department: academicInfo.department || null,
    current_year: academicInfo.current_year || null,
    university: academicInfo.university || null,
    gpa: academicInfo.gpa || null,
    monthly_household_income: financialInfo.monthly_household_income || academicInfo.monthly_household_income || null,
    parent_occupation: financialInfo.parent_occupation || academicInfo.parent_occupation || null,
    dependents: financialInfo.dependents || academicInfo.dependents || null,
    financial_info: financialInfo
  }

  return {
    ...application,
    scholarships: scholarship || null,
    personal_info: personalInfo,
    student_info: personalInfo,
    academic_info: combinedAcademic,
    financial_info: financialInfo,
    document_urls: docs
  }
}

export const submitApplication = async (req, res) => {
  try {
    const studentId = req.user.id
    const scholarshipId = req.body.scholarship_id
    const studentInfo = safeJsonParse(req.body.student_info, {})
    const academicInfo = safeJsonParse(req.body.academic_info, {})
    const financialInfo = safeJsonParse(req.body.financial_info, {})
    const academicInfoDb = {
      ...academicInfo,
      financial_info: financialInfo
    }

    if (!scholarshipId) {
      return res.status(400).json({ error: 'Scholarship ID is required.' })
    }

    const { data: scholarship, error: schError } = await supabaseAdmin
      .from('scholarships')
      .select('id, title, status')
      .eq('id', scholarshipId)
      .eq('status', 'published')
      .single()

    if (schError || !scholarship) {
      return res.status(404).json({ error: 'Scholarship not found or no longer available.' })
    }

    const { data: existing } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('student_id', studentId)
      .eq('scholarship_id', scholarshipId)
      .single()

    if (existing) {
      return res.status(409).json({ error: 'You have already applied for this scholarship.' })
    }

    const files = req.files || {}
    const documentUrls = []

    for (const [key, fileList] of Object.entries(files)) {
      const file = fileList?.[0]
      if (!file) continue

      const fileExt = file.originalname.split('.').pop()
      const fileName = `${Date.now()}_${key}.${fileExt}`
      const filePath = `applications/${studentId}/${scholarshipId}/${fileName}`

      const { error: uploadError } = await supabaseAdmin
        .storage
        .from('documents')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        })

      if (uploadError) {
        return res.status(500).json({ error: 'File upload failed: ' + uploadError.message })
      }

      const { data: urlData } = supabaseAdmin
        .storage
        .from('documents')
        .getPublicUrl(filePath)

      documentUrls.push({
        type: key,
        url: urlData.publicUrl
      })
    }

    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .insert({
        student_id: studentId,
        scholarship_id: scholarshipId,
        status: 'pending',
        personal_info: studentInfo,
        academic_info: academicInfoDb,
        document_urls: documentUrls
      })
      .select()
      .single()

    if (appError) {
      return res.status(500).json({ error: 'Failed to submit application: ' + appError.message })
    }

    return res.status(201).json({ message: 'Application submitted successfully!', application })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to submit application: ' + (err?.message || 'Unexpected server error') })
  }
}

export const getMyApplications = async (req, res) => {
  const studentId = req.user.id

  const { data, error } = await supabaseAdmin
    .from('applications')
    .select('*')
    .eq('student_id', studentId)
    .order('id', { ascending: false })

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch applications: ' + error.message })
  }
  
  let rows = data || []
  
  const scholarshipIds = [...new Set(rows.map((r) => r.scholarship_id).filter(Boolean))]
  let scholarshipById = {}

  if (scholarshipIds.length > 0) {
    const { data: scholarships } = await supabaseAdmin
      .from('scholarships')
      .select('id, title, donor_name, amount, deadline')
      .in('id', scholarshipIds)

    scholarshipById = Object.fromEntries((scholarships || []).map((s) => [s.id, s]))
  }

  const applications = rows.map((app) => normalizeApplicationRecord(app, scholarshipById[app.scholarship_id] || null))

  return res.status(200).json({ count: applications.length, applications })
}

export const getApplicationById = async (req, res) => {
  const { id } = req.params
  const studentId = req.user.id

  const { data, error } = await supabaseAdmin
    .from('applications')
    .select('*')
    .eq('id', id)
    .eq('student_id', studentId)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Application not found.' })
  }

  let scholarship = null
  if (data.scholarship_id) {
    const { data: s } = await supabaseAdmin
      .from('scholarships')
      .select('id, title, donor_name, amount, deadline, description')
      .eq('id', data.scholarship_id)
      .maybeSingle()
    scholarship = s || null
  }

  const application = normalizeApplicationRecord(data, scholarship)

  return res.status(200).json({ application })
}

export const hasAppliedForScholarship = async (req, res) => {
  const studentId = req.user.id
  const { scholarshipId } = req.params

  const { data, error } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('student_id', studentId)
    .eq('scholarship_id', scholarshipId)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: 'Failed to check application status.' })
  }

  return res.status(200).json({ hasApplied: !!data })
}