import { supabaseAdmin } from '../config/supabaseClient.js'

function safeJsonParse(value, fallback = {}) {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export const submitApplication = async (req, res) => {
  try {
    const studentId = req.user.id
    const scholarshipId = req.body.scholarship_id
    const personalInfo = safeJsonParse(req.body.personal_info, {})
    const academicInfo = safeJsonParse(req.body.academic_info, {})
    const personalInfoDb = Array.isArray(personalInfo) ? personalInfo : [personalInfo]
    const academicInfoDb = Array.isArray(academicInfo) ? academicInfo : [academicInfo]

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
        personal_info: personalInfoDb,
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

  const parseField = (val) => {
    if (!val) return {};
    let parsed = Array.isArray(val) ? val[0] : val;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch (e) { return {}; }
    }
    return parsed || {};
  };

  const applications = rows.map((app) => {
    let docArr = Array.isArray(app.document_urls) ? app.document_urls : [];
    if (typeof docArr === 'string') { try { docArr = JSON.parse(docArr); } catch(e) {} }
    if (Array.isArray(docArr)) {
        docArr = docArr.map(d => {
            if (typeof d === 'string') { try { return JSON.parse(d); } catch(e) { return null; } }
            return d;
        }).filter(Boolean);
    }
    if (!Array.isArray(docArr)) docArr = [docArr];

    return {
      ...app,
      scholarships: scholarshipById[app.scholarship_id] || null,
      created_at: app.created_at || null,
      updated_at: app.updated_at || null,
      personal_info: parseField(app.personal_info),
      academic_info: parseField(app.academic_info),
      document_urls: docArr
    }
  });

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

  const parseField = (val) => {
    if (!val) return {};
    let parsed = Array.isArray(val) ? val[0] : val;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch (e) { return {}; }
    }
    return parsed || {};
  };

  let docArr = Array.isArray(data.document_urls) ? data.document_urls : [];
  if (typeof docArr === 'string') { try { docArr = JSON.parse(docArr); } catch(e) {} }
  if (Array.isArray(docArr)) {
      docArr = docArr.map(d => {
          if (typeof d === 'string') { try { return JSON.parse(d); } catch(e) { return null; } }
          return d;
      }).filter(Boolean);
  }
  if (!Array.isArray(docArr)) docArr = [docArr];

  const application = {
    ...data,
    scholarships: scholarship,
    created_at: data.created_at || null,
    updated_at: data.updated_at || null,
    personal_info: parseField(data.personal_info),
    academic_info: parseField(data.academic_info),
    document_urls: docArr
  }

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