import express from 'express'
import { query } from '../config/db.js'
import { authenticate, requireStudent } from '../middleware/auth.js'

const router = express.Router()


// GET /api/student/stats
router.get('/stats', authenticate, requireStudent, async (req, res) => {
  try {
    const sid = req.user.id
    const [avail, active, approved, progress] = await Promise.all([
      query(`SELECT COUNT(*) FROM scholarships WHERE status = 'Active'`),
      query(`SELECT COUNT(*) FROM applications WHERE student_id = $1 AND status IN ('Pending','Resubmission Requested')`, [sid]),
      query(`SELECT COUNT(*) FROM applications WHERE student_id = $1 AND status = 'Approved'`, [sid]),
      query(`SELECT COUNT(*) FROM progress_reports WHERE student_id = $1`, [sid]),
    ])
    res.json({
      available_scholarships: parseInt(avail.rows[0].count),
      active_applications: parseInt(active.rows[0].count),
      approved_scholarships: parseInt(approved.rows[0].count),
      progress_reports: parseInt(progress.rows[0].count),
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/student/profile
router.get('/profile', authenticate, requireStudent, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, phone, department, batch, registration_number, gpa, current_year,
              monthly_income, num_dependents
       FROM users WHERE id = $1`, [req.user.id])
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/student/profile
router.put('/profile', authenticate, requireStudent, async (req, res) => {
  try {
    const name = req.body.name?.trim()
    const phone = req.body.phone?.trim()

    if (!name) {
      return res.status(400).json({
        message: 'Full name is required',
      })
    }

    if (!/^07\d{8}$/.test(phone)) {
      return res.status(400).json({
        message:
          'Phone number must start with 07 and contain exactly 10 digits',
      })
    }

    const result = await query(
      `UPDATE users
       SET
         name = $1,
         phone = $2,
         updated_at = NOW()
       WHERE id = $3
         AND role = 'student'
       RETURNING
         id,
         name,
         email,
         phone,
         department,
         batch,
         registration_number,
         gpa`,
      [name, phone, req.user.id]
    )

    if (!result.rows.length) {
      return res.status(404).json({
        message: 'Student profile not found',
      })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('Update student profile error:', err)

    res.status(500).json({
      message: 'Failed to update student profile',
    })
  }
})

// GET /api/student/applications
router.get('/applications', authenticate, requireStudent, async (req, res) => {
  try {
    const { status, limit } = req.query
    let q = `SELECT a.*, s.title AS scholarship_title, s.funding_amount
             FROM applications a
             JOIN scholarships s ON a.scholarship_id = s.id
             WHERE a.student_id = $1`
    const params = [req.user.id]
    if (status) { q += ` AND a.status = $${params.length + 1}`; params.push(status) }
    q += ' ORDER BY a.created_at DESC'
    if (limit) { q += ` LIMIT $${params.length + 1}`; params.push(parseInt(limit)) }
    const result = await query(q, params)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/student/applications
router.post('/applications', authenticate, requireStudent, async (req, res) => {
  try {
    const {
      scholarship_id, student_name, registration_number, batch, email, phone, department,
      current_year, gpa, monthly_income, num_dependents, extra_data, status_override
    } = req.body

    if (!scholarship_id) return res.status(400).json({ message: 'scholarship_id required' })

    const isDraft = status_override === 'Draft'
    const finalStatus = isDraft ? 'Pending' : 'Pending'

    // Check for existing non-draft application
    const exists = await query(
      `SELECT id FROM applications WHERE student_id = $1 AND scholarship_id = $2`,
      [req.user.id, scholarship_id])
    if (exists.rows.length) {
      // If draft exists, update it instead
      const result = await query(
        `UPDATE applications SET
           student_name=$1, registration_number=$2, batch=$3, email=$4, phone=$5,
           department=$6, current_year=$7, gpa=$8, monthly_income=$9, num_dependents=$10,
           extra_data=$11, updated_at=NOW()
         WHERE id=$12 RETURNING *`,
        [student_name, registration_number, batch, email, phone, department,
         current_year, gpa || null, monthly_income || null, num_dependents || null,
         extra_data || null, exists.rows[0].id])
      return res.json(result.rows[0])
    }

    // Check scholarship is active
    const sch = await query(`SELECT id FROM scholarships WHERE id = $1 AND status = 'Active'`, [scholarship_id])
    if (!sch.rows.length) return res.status(400).json({ message: 'Scholarship not available' })

    const result = await query(
      `INSERT INTO applications
       (student_id, scholarship_id, student_name, registration_number, batch, email, phone, department,
        current_year, gpa, monthly_income, num_dependents, extra_data, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [req.user.id, scholarship_id, student_name, registration_number, batch, email, phone, department,
       current_year, gpa || null, monthly_income || null, num_dependents || null,
       extra_data || null, finalStatus])

    // Update user profile with latest info
    await query(
      `UPDATE users SET registration_number = COALESCE($1, registration_number),
       batch = COALESCE($2, batch), department = COALESCE($3, department),
       gpa = COALESCE($4, gpa), current_year = COALESCE($5, current_year),
       monthly_income = COALESCE($6, monthly_income), num_dependents = COALESCE($7, num_dependents)
       WHERE id = $8`,
      [registration_number, batch, department, gpa || null, current_year, monthly_income || null, num_dependents || null, req.user.id])

    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})
// ─────────────────────────────────────────────────────────────
// GET /api/student/applications/:id/payment-progress
//
// Returns the actual scholarship-payment progress for one
// application owned by the logged-in student.
// ─────────────────────────────────────────────────────────────
router.get(
  '/applications/:id/payment-progress',
  authenticate,
  requireStudent,
  async (req, res) => {
    try {
      const result = await query(
        `SELECT
           a.id AS application_id,
           a.status AS application_status,
           a.assigned_donor_id,
           a.assigned_at,

           sp.id AS scholarship_payment_id,
           COALESCE(
             sp.payment_status,
             CASE
               WHEN a.status = 'Completed'
                 THEN 'Paid'
               WHEN a.status = 'Payment Processing'
                 THEN 'Processing'
               WHEN a.status = 'Assigned to Donor'
                 THEN 'Pending'
               ELSE 'Not Started'
             END
           ) AS payment_status,

           sp.amount,
           sp.transaction_reference,
           sp.payment_date,
           sp.receipt_url,
           sp.receipt_file_name,
           sp.donor_comments,
           sp.failure_reason,
           sp.created_at,
           sp.updated_at,

           donor_user.name AS donor_name,
           donor_user.organization AS donor_organization

         FROM applications a

         LEFT JOIN scholarship_payments sp
           ON sp.application_id = a.id

         LEFT JOIN users donor_user
           ON donor_user.id = COALESCE(
             sp.donor_id,
             a.assigned_donor_id
           )

         WHERE a.id = $1
           AND a.student_id = $2`,
        [
          req.params.id,
          req.user.id,
        ]
      )

      if (!result.rows.length) {
        return res.status(404).json({
          message:
            'Application not found',
        })
      }

      return res.json(result.rows[0])
    } catch (err) {
      console.error(
        'Student payment-progress error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to load payment progress',
      })
    }
  }
)
// GET /api/student/progress-reports
router.get('/progress-reports', authenticate, requireStudent, async (req, res) => {
  try {
    const result = await query(
      `SELECT pr.*, s.title AS scholarship_title
       FROM progress_reports pr
       JOIN applications a ON pr.application_id = a.id
       JOIN scholarships s ON a.scholarship_id = s.id
       WHERE pr.student_id = $1
       ORDER BY pr.created_at DESC`, [req.user.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/student/progress-reports
router.post('/progress-reports', authenticate, requireStudent, async (req, res) => {
  try {
    const { application_id, semester, gpa, achievements, activities, comments } = req.body
    if (!application_id) return res.status(400).json({ message: 'application_id required' })

    // Verify the application belongs to this student and is approved
    const appCheck = await query(
      `SELECT id FROM applications WHERE id = $1 AND student_id = $2 AND status = 'Approved'`,
      [application_id, req.user.id])
    if (!appCheck.rows.length) return res.status(403).json({ message: 'No approved application found' })

    const result = await query(
      `INSERT INTO progress_reports (student_id, application_id, semester, gpa, achievements, activities, comments, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Submitted') RETURNING *`,
      [req.user.id, application_id, semester, gpa || null, achievements, activities, comments])
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/student/issues
router.get('/issues', authenticate, requireStudent, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM issues WHERE reported_by = $1 ORDER BY created_at DESC`, 
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/student/issues
router.post('/issues', authenticate, requireStudent, async (req, res) => {
  try {
    const { title, category, description, attachment_url } = req.body
    
    if (!title || !description) return res.status(400).json({ message: 'Title and description required' })

  
    const result = await query(
      `INSERT INTO issues (title, category, description, attachment_url, status, reported_by)
       VALUES ($1, $2, $3, $4, 'Open', $5) RETURNING *`,
      [title, category || 'System Issue', description, attachment_url || null, req.user.id]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

export default router