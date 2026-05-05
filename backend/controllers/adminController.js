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

    const academicInfo = parseField(app.academic_info);
    
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
      academic_info: academicInfo,
      document_urls: Object.keys(docs).length > 0 ? docs : docArr
    }
  })

  return res.status(200).json({ count: applications.length, applications })
}

export const updateApplicationStatus = async (req, res) => {
  const { id } = req.params
  const { status, admin_feedback } = req.body

  if (!['under_review', 'rejected', 'admin_approved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' })
  }

  const { data: application, error } = await supabaseAdmin
    .from('applications')
    .update({ status })
    .eq('id', id)
    .select('id, student_id, scholarship_id')
    .single()

  if (error || !application) {
    return res.status(404).json({ error: 'Application not found or update failed.' })
  }

  // Fetch scholarship manually
  const { data: sch } = await supabaseAdmin
    .from('scholarships')
    .select('title')
    .eq('id', application.scholarship_id)
    .single()

  const scholarshipTitle = sch?.title || 'Scholarship'

  // Create an automated notification for the student
  let notifyMessage = `Your application for "${scholarshipTitle}" has been updated to: ${status.replace('_', ' ').toUpperCase()}.`
  if (status === 'admin_approved') notifyMessage = `🎉 Your application for "${scholarshipTitle}" passed Admin Review and is now forwarded to the Donor!`
  if (status === 'rejected') notifyMessage = `Update: Your application for "${scholarshipTitle}" was politely REJECTED by the Administrator. Please check feedback if provided.`
  if (status === 'under_review') notifyMessage = `Your application for "${scholarshipTitle}" is now UNDER REVIEW by the Administrator.`

  await supabaseAdmin.from('notifications').insert({
    user_id: application.student_id,
    message: notifyMessage
  })

  return res.status(200).json({
    message: `Application updated to ${status} and student notified.`,
    application
  })
}

export const createAnnouncement = async (req, res) => {
  const { title, content } = req.body

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' })
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .insert({ title, content })
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
