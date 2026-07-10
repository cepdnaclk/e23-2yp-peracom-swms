import express from 'express'
import { query } from '../config/db.js'
import { authenticate, requireAdmin, requireDonor } from '../middleware/auth.js'
import { sendEmail } from '../services/emailService.js'

const router = express.Router()

// GET /api/scholarships/public  — unauthenticated homepage preview
router.get('/public', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6
    const result = await query(
      `SELECT s.*, u.name AS donor_name, u.organization
       FROM scholarships s
       LEFT JOIN users u ON s.donor_id = u.id
       WHERE s.status = 'Active'
       ORDER BY s.created_at DESC LIMIT $1`, [limit])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/scholarships/requests  — admin: list donor requests
router.get('/requests', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query
    let q = `SELECT r.*, u.name AS donor_name FROM donor_scholarship_requests r
             JOIN users u ON r.donor_id = u.id`
    const params = []
    if (status) { q += ' WHERE r.status = $1'; params.push(status) }
    q += ' ORDER BY r.created_at DESC'
    const result = await query(q, params)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/scholarships/requests/:id  — admin: single request
router.get('/requests/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, u.name AS donor_name FROM donor_scholarship_requests r
       JOIN users u ON r.donor_id = u.id WHERE r.id = $1`, [req.params.id])
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/scholarships/requests/:id/approve
router.post('/requests/:id/approve', authenticate, requireAdmin, async (req, res) => {
  const client = await (await import('../config/db.js')).getClient()
  let r, donor, allStudents
  try {
    await client.query('BEGIN')
    const reqResult = await client.query('SELECT * FROM donor_scholarship_requests WHERE id = $1', [req.params.id])
    if (!reqResult.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Not found' }) }
    r = reqResult.rows[0]
    await client.query(
      `INSERT INTO scholarships (title, description, eligibility_criteria, eligible_batch, funding_amount,
       required_documents, application_deadline, status, donor_id,
       category, num_students, opening_date, terms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Active',$8,$9,$10,$11,$12)`,
      [r.scholarship_title, r.description, r.eligibility_criteria, r.eligible_batch,
      r.funding_amount, r.required_documents, r.application_deadline, r.donor_id,
      r.category, r.num_students, r.opening_date, r.terms])
    await client.query(`UPDATE donor_scholarship_requests SET status = 'Approved', updated_at = NOW() WHERE id = $1`, [req.params.id])

    // Get donor details
    const donorResult = await client.query('SELECT name, email FROM users WHERE id = $1', [r.donor_id])
    donor = donorResult.rows[0] || { name: 'Donor', email: '' }

    // Donor in-system notification
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'scholarship_approved', 'Scholarship Request Approved', $2, '/donor/scholarships')`,
      [r.donor_id, `Your scholarship request "${r.scholarship_title}" has been approved and published successfully.`]
    )

    // Fetch all registered students to notify
    const studentsResult = await client.query("SELECT id, email, name FROM users WHERE role = 'student' AND status = 'approved'")
    allStudents = studentsResult.rows

    // Insert in-system notifications for all students
    for (const student of allStudents) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, 'new_scholarship', 'New Scholarship Published', 'A new scholarship is available. Check the Scholarships page to apply.', '/student/scholarships')`,
        [student.id]
      )
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    return res.status(500).json({ message: err.message })
  } finally {
    client.release()
  }

  // ── Send emails and collect results ──────────────────────────────────────
  const emailResults = { donor: null, students: { sent: 0, failed: 0, errors: [] } }

  try {
    const donorEmailBody = `Dear ${donor.name},

Congratulations!

Your scholarship request "${r.scholarship_title}" has been reviewed and approved by the Pera Com Administration.

The scholarship has now been published and is available for eligible students to apply.

Scholarship Details:

* Scholarship Title: ${r.scholarship_title}
* Scholarship Amount: LKR ${Number(r.funding_amount).toLocaleString()}
* Number of Students: ${r.num_students || '—'}
* Application Opening Date: ${r.opening_date ? new Date(r.opening_date).toLocaleDateString() : '—'}
* Application Deadline: ${r.application_deadline ? new Date(r.application_deadline).toLocaleDateString() : '—'}

Thank you for supporting our students.

Regards,
Pera Com
Student Welfare Management System`

    emailResults.donor = await sendEmail({
      recipientEmail: donor.email,
      scholarshipRequestId: r.id,
      emailType: 'Approval_Donor',
      subject: 'Scholarship Request Approved',
      body: donorEmailBody
    })

    for (const student of allStudents) {
      if (!student.email) { emailResults.students.failed++; continue }
      const studentEmailBody = `Dear ${student.name || 'Student'},

A new scholarship is now available for applications.

Scholarship Details:

* Scholarship Title: ${r.scholarship_title}
* Scholarship Amount: LKR ${Number(r.funding_amount).toLocaleString()}
* Eligible Batch: ${r.eligible_batch || 'All'}
* Application Opening Date: ${r.opening_date ? new Date(r.opening_date).toLocaleDateString() : '—'}
* Application Deadline: ${r.application_deadline ? new Date(r.application_deadline).toLocaleDateString() : '—'}

Please log in to the Student Welfare Management System to view the scholarship details and submit your application before the deadline.

Regards,
University of Peradeniya
Student Welfare Management System`

      const result = await sendEmail({
        recipientEmail: student.email,
        scholarshipRequestId: r.id,
        emailType: 'Approval_Student',
        subject: 'New Scholarship Published',
        body: studentEmailBody
      })
      if (result.success) emailResults.students.sent++
      else {
        emailResults.students.failed++
        emailResults.students.errors.push({ email: student.email, error: result.error })
      }
    }
    console.log(`✅ Approval emails done for "${r.scholarship_title}" | Donor: ${emailResults.donor?.success ? 'OK' : 'FAILED'} | Students: ${emailResults.students.sent} sent, ${emailResults.students.failed} failed`)
  } catch (emailErr) {
    console.error('⚠️ Unexpected error during approval email sending:', emailErr.message)
    emailResults.unexpectedError = emailErr.message
  }

  // Return after emails so the frontend gets email status
  return res.json({ message: 'Approved and published', emailResults })
})

// POST /api/scholarships/requests/:id/reject
router.post('/requests/:id/reject', authenticate, requireAdmin, async (req, res) => {
  const client = await (await import('../config/db.js')).getClient()
  let r, donor, rejection_reason
  try {
    const body = req.body
    rejection_reason = body.rejection_reason
    if (!rejection_reason || !rejection_reason.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required' })
    }

    await client.query('BEGIN')
    const reqResult = await client.query('SELECT * FROM donor_scholarship_requests WHERE id = $1', [req.params.id])
    if (!reqResult.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Not found' }) }
    r = reqResult.rows[0]

    // Update DB
    await client.query(
      `UPDATE donor_scholarship_requests SET status = 'Rejected', rejection_reason = $1, updated_at = NOW() WHERE id = $2`,
      [rejection_reason, req.params.id])

    // Get donor details
    const donorResult = await client.query('SELECT name, email FROM users WHERE id = $1', [r.donor_id])
    donor = donorResult.rows[0] || { name: 'Donor', email: '' }

    // In-system notification
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'scholarship_rejected', 'Scholarship Request Rejected', $2, '/donor/scholarships')`,
      [r.donor_id, `Your scholarship request "${r.scholarship_title}" has been rejected by the Administrator. Reason: ${rejection_reason}`]
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    return res.status(500).json({ message: err.message })
  } finally {
    client.release()
  }

  // ── Send rejection email and collect result ───────────────────────────────
  let emailResult = null
  try {
    const rejectionEmailBody = `Dear ${donor.name},

Thank you for your interest in supporting students through the Pera Com Student Welfare Management System.

After reviewing your scholarship request titled:

"${r.scholarship_title}"

we regret to inform you that it has not been approved.

Reason for Rejection:

${rejection_reason}

If appropriate, you may revise your scholarship request and submit a new request in the future.

If you have any questions, please contact the system administrator.

Thank you for your continued support.

Regards,
University of Peradeniya
Student Welfare Management System`

    emailResult = await sendEmail({
      recipientEmail: donor.email,
      scholarshipRequestId: r.id,
      emailType: 'Rejection_Donor',
      subject: 'Scholarship Request Rejected',
      body: rejectionEmailBody
    })
    console.log(`${emailResult.success ? '✅' : '❌'} Rejection email for "${r.scholarship_title}" → ${emailResult.success ? 'sent' : emailResult.error}`)
  } catch (emailErr) {
    console.error('⚠️ Unexpected error during rejection email:', emailErr.message)
    emailResult = { success: false, error: emailErr.message }
  }

  return res.json({ message: 'Rejected', emailResult })
})

// GET /api/scholarships  — authenticated list (admin/student/donor)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query
    let q = `SELECT s.*, u.name AS donor_name, u.organization
             FROM scholarships s LEFT JOIN users u ON s.donor_id = u.id`
    const params = []
    if (status) { q += ' WHERE s.status = $1'; params.push(status) }
    q += ' ORDER BY s.created_at DESC'
    const result = await query(q, params)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/scholarships/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, u.name AS donor_name, u.organization
       FROM scholarships s LEFT JOIN users u ON s.donor_id = u.id WHERE s.id = $1`, [req.params.id])
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/scholarships  — admin only
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, eligibility_criteria, eligible_batch, funding_amount, required_documents, application_deadline, status } = req.body
    if (!title) return res.status(400).json({ message: 'Title is required' })
    const result = await query(
      `INSERT INTO scholarships (title, description, eligibility_criteria, eligible_batch, funding_amount, required_documents, application_deadline, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description, eligibility_criteria, eligible_batch, funding_amount || null, required_documents, application_deadline || null, status || 'Active'])
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/scholarships/:id  — admin only
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, eligibility_criteria, eligible_batch, funding_amount, required_documents, application_deadline, status } = req.body
    const result = await query(
      `UPDATE scholarships SET title=$1, description=$2, eligibility_criteria=$3, eligible_batch=$4,
       funding_amount=$5, required_documents=$6, application_deadline=$7, status=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title, description, eligibility_criteria, eligible_batch, funding_amount || null, required_documents, application_deadline || null, status, req.params.id])
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/scholarships/:id  — admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM scholarships WHERE id = $1', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/scholarships/:id/approved-students
router.get('/:id/approved-students', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT a.id AS application_id, u.id AS student_id, u.name AS student_name,
              u.registration_number, u.batch, u.department,
              a.gpa, ds.id AS assignment_id,
              CASE WHEN ds.id IS NOT NULL THEN 'Assigned' ELSE 'Not Assigned' END AS assignment_status,
              COALESCE(ds.donor_decision, 'Not Reviewed') AS donor_decision
       FROM applications a
       JOIN users u ON a.student_id = u.id
       LEFT JOIN donor_students ds ON ds.application_id = a.id AND ds.scholarship_id = $1
       WHERE a.scholarship_id = $1 AND a.status = 'Approved'
       ORDER BY u.name`, [req.params.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/scholarships/:id/final-students
router.get('/:id/final-students', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT ds.*, u.name AS student_name, u.registration_number,
              du.name AS donor_name, ds.updated_at AS approved_at
       FROM donor_students ds
       JOIN applications a ON ds.application_id = a.id
       JOIN users u ON a.student_id = u.id
       LEFT JOIN users du ON ds.donor_id = du.id
       WHERE ds.scholarship_id = $1 AND ds.donor_decision = 'Approved'
       ORDER BY ds.updated_at DESC`, [req.params.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/scholarships/:id/assign
router.post('/:id/assign', authenticate, requireAdmin, async (req, res) => {
  const client = await (await import('../config/db.js')).getClient()
  try {
    const { student_ids } = req.body
    if (!Array.isArray(student_ids) || !student_ids.length) return res.status(400).json({ message: 'student_ids required' })
    await client.query('BEGIN')
    const scholarship = await client.query('SELECT donor_id FROM scholarships WHERE id = $1', [req.params.id])
    const donorId = scholarship.rows[0]?.donor_id
    for (const sid of student_ids) {
      const appResult = await client.query(
        'SELECT id FROM applications WHERE student_id = $1 AND scholarship_id = $2 AND status = $3',
        [sid, req.params.id, 'Approved'])
      if (!appResult.rows.length) continue
      const appId = appResult.rows[0].id
      await client.query(
        `INSERT INTO donor_students (scholarship_id, application_id, donor_id, donor_decision)
         VALUES ($1, $2, $3, 'Pending')
         ON CONFLICT (scholarship_id, application_id) DO NOTHING`,
        [req.params.id, appId, donorId])
    }
    await client.query('COMMIT')
    res.json({ message: 'Students assigned' })
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ message: err.message }) }
  finally { client.release() }
})

export default router
