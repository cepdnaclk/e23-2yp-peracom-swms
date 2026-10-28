import { query } from '../config/db.js'
import { sendEmail } from './emailService.js'

const REMINDER_INTERVAL_MS = 21 * 24 * 60 * 60 * 1000
const REMINDER_TYPE = 'progress_report_reminder'

export async function sendProgressReportReminders() {
  const result = await query(
    `SELECT
       a.id AS application_id,
       a.student_id,
       u.name AS student_name,
       u.email AS student_email,
       s.title AS scholarship_title,
       COALESCE(MAX(pr.created_at), a.updated_at, a.created_at) AS activity_at,
       MAX(n.created_at) AS last_reminder_at
     FROM applications a
     JOIN users u ON u.id = a.student_id
     JOIN scholarships s ON s.id = a.scholarship_id
     LEFT JOIN progress_reports pr
       ON pr.application_id = a.id
     LEFT JOIN notifications n
       ON n.user_id = a.student_id
      AND n.type = $1
      AND n.link = '/student/progress?application_id=' || a.id
     WHERE a.status = 'Approved'
       AND u.role = 'student'
       AND u.status = 'approved'
     GROUP BY a.id, a.student_id, u.name, u.email, s.title
     ORDER BY activity_at ASC`,
    [REMINDER_TYPE]
  )

  const now = Date.now()

  for (const application of result.rows) {
    const activityAt = new Date(application.activity_at).getTime()
    const lastReminderAt = application.last_reminder_at
      ? new Date(application.last_reminder_at).getTime()
      : null

    if (!activityAt || now - activityAt < REMINDER_INTERVAL_MS) continue

    if (
      lastReminderAt &&
      lastReminderAt >= activityAt &&
      now - lastReminderAt < REMINDER_INTERVAL_MS
    ) {
      continue
    }

    const link = `/student/progress?application_id=${application.application_id}`
    const title = 'Progress report reminder'
    const message = `Please submit your progress report for "${application.scholarship_title}".`

    await query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [application.student_id, REMINDER_TYPE, title, message, link]
    )

    const emailResult = await sendEmail({
      recipientEmail: application.student_email,
      emailType: 'Progress_Report_Reminder',
      subject: `${title}: ${application.scholarship_title}`,
      body: `Dear ${application.student_name || 'Student'},\n\n${message}\n\nPlease log in to the Student Welfare Management System and submit your report.\n\nRegards,\nUniversity of Peradeniya\nStudent Welfare Management System`
    })

    console.log(
      `Progress reminder created for ${application.student_email} ` +
      `(${application.scholarship_title}); email: ${emailResult.success ? 'sent' : 'failed'}`
    )
  }
}
