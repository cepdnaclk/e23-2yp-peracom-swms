import { supabaseAdmin } from '../config/supabaseClient.js'

export const getPendingUsers = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role, status, created_at, extra_info')
    .in('role', ['student', 'donor'])
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: true })

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch pending users.' })
  }

  return res.status(200).json({ count: data.length, users: data })
}

export const getAllUsers = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role, status, created_at, extra_info')
    .in('role', ['student', 'donor'])
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch users.' })
  }

  return res.status(200).json({ count: data.length, users: data })
}

export const updateUserApprovalStatus = async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!id) {
    return res.status(400).json({ error: 'User ID is required.' })
  }

  if (!['approved', 'rejected', 'pending_approval'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' })
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ status })
    .eq('id', id)
    .in('role', ['student', 'donor'])
    .select('id, full_name, email, role, status')
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'User not found or update failed.' })
  }

  return res.status(200).json({
    message: `User status updated to ${status}.`,
    user: data
  })
}

export const getPendingScholarships = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('scholarships')
    .select('id, title, description, requirements, slots, donor_name, amount, funding_type, deadline, status, created_at')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true })

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch pending scholarships.' })
  }

  return res.status(200).json({ count: data.length, scholarships: data })
}

export const updateScholarshipStatus = async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!id) {
    return res.status(400).json({ error: 'Scholarship ID is required.' })
  }

  if (!['published', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' })
  }

  const { data, error } = await supabaseAdmin
    .from('scholarships')
    .update({ status })
    .eq('id', id)
    .select('id, title, status')
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Scholarship not found or update failed.' })
  }

  return res.status(200).json({
    message: `Scholarship status updated to ${status}.`,
    scholarship: data
  })
}

// FR3 - Admin Applications & Announcements Management
export const getPendingApplications = async (req, res) => {
  // Ensure we return a consistent flat `id` field from the applications table
  const { data, error } = await supabaseAdmin
    .from('applications')
    .select('*')
    .in('status', ['pending', 'under_review'])
    .order('id', { ascending: true })
    

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch pending applications.' })
  }

  let applications = data || []
  
  // Manual join for profiles and scholarships to avoid Supabase relational errors
  const studentIds = [...new Set(applications.map(a => a.student_id).filter(Boolean))]
  const schIds = [...new Set(applications.map(a => a.scholarship_id).filter(Boolean))]

  let profilesMap = {}
  let scholarshipsMap = {}

  if (studentIds.length > 0) {
    const { data: profs } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', studentIds)
    profilesMap = Object.fromEntries((profs || []).map(p => [p.id, p]))
  }

  if (schIds.length > 0) {
    const { data: schs } = await supabaseAdmin
      .from('scholarships')
      .select('id, title, donor_name')
      .in('id', schIds)
    scholarshipsMap = Object.fromEntries((schs || []).map(s => [s.id, s]))
  }

  applications = applications.map(app => {
    // Robust normalization for JSONB column types that might be stored as string, array of strings, or objects
    const parseField = (val) => {
      if (!val) return {};
      let parsed = Array.isArray(val) ? val[0] : val;
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (e) { return {}; }
      }
      return parsed || {};
    };

    const personalInfo = parseField(app.personal_info);
    const academicInfo = parseField(app.academic_info);
    const financialInfo = parseField(academicInfo.financial_info);
    const normalizedAcademicInfo = {
      ...academicInfo,
      full_name: personalInfo.full_name || academicInfo.full_name || null,
      student_id: personalInfo.student_id || academicInfo.student_id || null,
      monthly_household_income: financialInfo.monthly_household_income || academicInfo.monthly_household_income || null,
      parent_occupation: financialInfo.parent_occupation || academicInfo.parent_occupation || null,
      dependents: financialInfo.dependents || academicInfo.dependents || null,
      financial_info: financialInfo
    };
    
    // Safely structure document URLs flatly into a key-URL dictionary for the UI
    let docArr = Array.isArray(app.document_urls) ? app.document_urls : [];
    if (typeof docArr === 'string') {
        try { docArr = JSON.parse(docArr); } catch(e) {}
    }
    // Handle nested stringified arrays if any
    if (Array.isArray(docArr)) {
        docArr = docArr.map(d => {
            if (typeof d === 'string') {
                try { return JSON.parse(d); } catch(e) { return null; }
            }
            return d;
        }).filter(Boolean);
    }
    if (!Array.isArray(docArr)) docArr = [docArr];
    
    const docs = {};
    docArr.flat(Infinity).forEach(d => {
       if (d && d.type && d.url) {
          docs[`${d.type}_url`] = d.url;
       }
    });

    return {
      ...app,
      profiles: profilesMap[app.student_id] || null,
      scholarships: scholarshipsMap[app.scholarship_id] || null,
      personal_info: personalInfo,
      student_info: personalInfo,
      academic_info: normalizedAcademicInfo,
      financial_info: financialInfo,
      document_urls: Object.keys(docs).length > 0 ? docs : docArr
    }
  })

  return res.status(200).json({ count: applications.length, applications })
}

export const updateApplicationStatus = async (req, res) => {
  const { id } = req.params
  const { status, admin_feedback, feedback_template } = req.body

  // Supported statuses
  const validStatuses = ['under_review', 'rejected', 'admin_approved', 'resubmitted']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' })
  }

  // Fetch current application
  const { data: app, error: fetchError } = await supabaseAdmin
    .from('applications')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchError || !app) {
    return res.status(404).json({ error: 'Application not found.' })
  }

  // Prepare update fields
  const updateFields = { status }
  let newHistory = Array.isArray(app.history) ? [...app.history] : []

  // If rejected, require a reason (template or custom)
  if (status === 'rejected') {
    const reason = admin_feedback || feedback_template
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: 'Rejection reason is required.' })
    }
    updateFields.rejection_reason = reason
    // Add to history
    newHistory.push({ action: 'rejected', by: req.user?.id || 'admin', at: new Date().toISOString(), reason })
    updateFields.resubmission_count = app.resubmission_count || 0
  }

  // If resubmitted, increment resubmission_count and clear rejection_reason
  if (status === 'resubmitted') {
    const maxResub = 3
    const count = (app.resubmission_count || 0) + 1
    if (count > maxResub) {
      return res.status(400).json({ error: `Maximum resubmissions (${maxResub}) reached.` })
    }
    updateFields.resubmission_count = count
    updateFields.rejection_reason = null
    newHistory.push({ action: 'resubmitted', by: req.user?.id || 'student', at: new Date().toISOString() })
  }

  // If approved, add to history
  if (status === 'admin_approved') {
    newHistory.push({ action: 'admin_approved', by: req.user?.id || 'admin', at: new Date().toISOString() })
  }

  updateFields.history = newHistory

  const { data: application, error } = await supabaseAdmin
    .from('applications')
    .update(updateFields)
    .eq('id', id)
    .select('id, student_id, scholarship_id, status, rejection_reason, resubmission_count, history')
    .single()

  if (error || !application) {
    return res.status(404).json({ error: 'Application not found or update failed.' })
  }

  // Feedback templates for admin UI
  const feedbackTemplates = [
    'Document is not clear/legible',
    'Missing required page(s)',
    'Incorrect document type',
    'Information does not match records',
    'Other (see comments)'
  ]

  return res.status(200).json({
    message: `Application updated to ${status}.`,
    application,
    feedbackTemplates
  })
}

export const createAnnouncement = async (req, res) => {
  const { title, content } = req.body

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' })
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .insert({
      title,
      content,
      created_by: req.user?.id || null
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: 'Failed to publish announcement.' })
  }

  return res.status(201).json({
    message: 'Announcement published successfully.',
    announcement: data
  })
}

export const getAnnouncements = async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1)
  const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50)
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabaseAdmin
    .from('announcements')
    .select('id, title, content, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch announcements.' })
  }

  return res.status(200).json({
    page,
    limit,
    total: count || 0,
    total_pages: Math.max(Math.ceil((count || 0) / limit), 1),
    announcements: data || []
  })
}

export const updateAnnouncement = async (req, res) => {
  const { id } = req.params
  const { title, content } = req.body

  if (!id) {
    return res.status(400).json({ error: 'Announcement ID is required.' })
  }

  const updates = {}
  if (typeof title === 'string' && title.trim()) updates.title = title.trim()
  if (typeof content === 'string' && content.trim()) updates.content = content.trim()

  if (!updates.title && !updates.content) {
    return res.status(400).json({ error: 'At least one valid field (title or content) is required.' })
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select('id, title, content, created_at')
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Announcement not found or update failed.' })
  }

  return res.status(200).json({
    message: 'Announcement updated successfully.',
    announcement: data
  })
}

export const deleteAnnouncement = async (req, res) => {
  const { id } = req.params

  if (!id) {
    return res.status(400).json({ error: 'Announcement ID is required.' })
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .delete()
    .eq('id', id)
    .select('id')
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Announcement not found or delete failed.' })
  }

  return res.status(200).json({ message: 'Announcement deleted successfully.' })
}
