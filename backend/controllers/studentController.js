import { supabaseAdmin } from '../config/supabaseClient.js'

export const getStudentDashboard = async (req, res) => {
  const studentId = req.user.id

  const nowIso = new Date().toISOString()
  const [applicationsResult, latestAppsResult, announcementsResult, announcementReadsResult, announcementsCountResult, notificationsResult, openCountResult, openScholarshipsResult] = await Promise.all([
    supabaseAdmin.from('applications').select('status, scholarship_id').eq('student_id', studentId),
    supabaseAdmin
      .from('applications')
      .select('id, status, created_at, updated_at, scholarship_id, personal_info, academic_info, document_urls')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(4),
    supabaseAdmin
      .from('announcements')
      .select('id, title, content, created_at')
      .order('created_at', { ascending: false })
      .limit(3),
    supabaseAdmin
      .from('announcement_reads')
      .select('announcement_id')
      .eq('user_id', studentId),
    supabaseAdmin
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      .or(`expires_at.is.null,expires_at.gte.${nowIso}`),
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
  const announcementReads = announcementReadsResult.data || []
  const announcementReadIds = new Set(announcementReads.map((row) => String(row.announcement_id)))
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

  const normalizeApplication = (application) => {
    const personalInfo = parseField(application.personal_info)
    const academicInfo = parseField(application.academic_info)
    const financialInfo = parseField(academicInfo.financial_info)

    return {
      ...application,
      personal_info: personalInfo,
      student_info: personalInfo,
      academic_info: {
        ...academicInfo,
        full_name: personalInfo.full_name || academicInfo.full_name || null,
        student_id: personalInfo.student_id || academicInfo.student_id || null,
        monthly_household_income: financialInfo.monthly_household_income || academicInfo.monthly_household_income || null,
        parent_occupation: financialInfo.parent_occupation || academicInfo.parent_occupation || null,
        dependents: financialInfo.dependents || academicInfo.dependents || null,
        financial_info: financialInfo
      },
      financial_info: financialInfo,
      document_urls: Array.isArray(application.document_urls) ? application.document_urls : []
    }
  }

  const normalizedLatestApplications = latestApplications.map((application) => ({
    ...normalizeApplication(application),
    scholarships: latestScholarshipById[application.scholarship_id] || null,
  }))

  const announcements = (announcementsResult.data || []).map((announcement) => ({
    ...announcement,
    is_read: announcementReadIds.has(String(announcement.id))
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
    announcements,
    announcements_unread_count: Math.max((announcementsCountResult.count || 0) - announcementReadIds.size, 0),
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

export const getStudentAnnouncements = async (req, res) => {
  const all = String(req.query.all || '').toLowerCase() === 'true'
  const studentId = req.user.id

  const query = supabaseAdmin
    .from('announcements')
    .select('id, title, content, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  const { data: readRows } = await supabaseAdmin
    .from('announcement_reads')
    .select('announcement_id')
    .eq('user_id', studentId)

  const readIds = new Set((readRows || []).map((row) => String(row.announcement_id)))

  if (!all) {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50)
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query.range(from, to)

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch announcements.' })
    }

    return res.status(200).json({
      page,
      limit,
      total: count || 0,
      total_pages: Math.max(Math.ceil((count || 0) / limit), 1),
      announcements: (data || []).map((announcement) => ({
        ...announcement,
        is_read: readIds.has(String(announcement.id))
      }))
    })
  }

  const { data, error, count } = await query

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch announcements.' })
  }

  return res.status(200).json({
    total: count || 0,
    total_pages: 1,
    announcements: (data || []).map((announcement) => ({
      ...announcement,
      is_read: readIds.has(String(announcement.id))
    }))
  })
}

export const markAnnouncementRead = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  if (!id) {
    return res.status(400).json({ error: 'Announcement ID is required.' })
  }

  const { error } = await supabaseAdmin
    .from('announcement_reads')
    .upsert(
      {
        announcement_id: id,
        user_id: userId,
        read_at: new Date().toISOString()
      },
      { onConflict: 'announcement_id,user_id' }
    )

  if (error) {
    return res.status(500).json({ error: 'Failed to record announcement read.' })
  }

  return res.status(200).json({ message: 'Announcement marked as read.' })
}
