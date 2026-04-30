import { supabaseAdmin } from '../config/supabaseClient.js'

export const getStudentDashboard = async (req, res) => {
  const studentId = req.user.id

  const nowIso = new Date().toISOString()
  const [applicationsResult, latestAppsResult, announcementsResult, notificationsResult, openCountResult, openScholarshipsResult] = await Promise.all([
    supabaseAdmin.from('applications').select('status, scholarship_id').eq('student_id', studentId),
    supabaseAdmin
      .from('applications')
      .select('id, status, created_at, updated_at, scholarship_id, personal_info, academic_info, document_urls')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(4),
    supabaseAdmin.from('announcements').select('id, title, content, created_at').order('created_at', { ascending: false }).limit(3),
    supabaseAdmin.from('notifications').select('id, message, is_read, created_at').eq('user_id', studentId).order('created_at', { ascending: false }).limit(4),
    supabaseAdmin
      .from('scholarships')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .or(`deadline.is.null,deadline.gte.${nowIso}`),
    supabaseAdmin
      .from('scholarships')
      .select('id, title, donor_name, amount, deadline, funding_type')
      .eq('status', 'published')
      .or(`deadline.is.null,deadline.gte.${nowIso}`)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const applications = applicationsResult.data || []
  const latestApplications = latestAppsResult.data || []
  const latestScholarshipIds = [...new Set(latestApplications.map((application) => application.scholarship_id).filter(Boolean))]
  let latestScholarshipById = {}

  if (latestScholarshipIds.length > 0) {
    const { data: scholarships } = await supabaseAdmin
      .from('scholarships')
      .select('id, title, donor_name, amount, deadline')
      .in('id', latestScholarshipIds)

    latestScholarshipById = Object.fromEntries((scholarships || []).map((scholarship) => [scholarship.id, scholarship]))
  }

  const parseField = (value) => {
    if (!value) return {}
    let parsed = Array.isArray(value) ? value[0] : value
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed)
      } catch {
        return {}
      }
    }
    return parsed || {}
  }

  const normalizedLatestApplications = latestApplications.map((application) => ({
    ...application,
    scholarships: latestScholarshipById[application.scholarship_id] || null,
    personal_info: parseField(application.personal_info),
    academic_info: parseField(application.academic_info),
    document_urls: Array.isArray(application.document_urls) ? application.document_urls : []
  }))

  const summary = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    under_review: applications.filter(a => a.status === 'under_review').length,
    admin_approved: applications.filter(a => a.status === 'admin_approved').length,
    awarded: applications.filter(a => a.status === 'awarded').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    draft: applications.filter(a => a.status === 'draft').length
  }

  // Get all applied scholarship IDs (not just latest 4) for "Already Applied" check
  const allAppliedScholarshipIds = [...new Set((applicationsResult.data || []).map(a => a.scholarship_id).filter(Boolean))]

  return res.status(200).json({
    application_summary: summary,
    latest_applications: normalizedLatestApplications,
    all_applied_scholarship_ids: allAppliedScholarshipIds,
    announcements: announcementsResult.data || [],
    notifications: notificationsResult.data || [],
    unread_count: (notificationsResult.data || []).length,
    open_scholarships_count: openCountResult.count || 0,
    open_scholarships: openScholarshipsResult?.data || []
  })
}

export const getMyProfile = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role, status, extra_info')
    .eq('id', req.user.id)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Profile not found.' })
  }

  return res.status(200).json({ profile: data })
}

export const markNotificationRead = async (req, res) => {
  const { id } = req.params

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', req.user.id)

  if (error) {
    return res.status(500).json({ error: 'Failed to mark notification as read.' })
  }

  return res.status(200).json({ message: 'Notification marked as read.' })
}