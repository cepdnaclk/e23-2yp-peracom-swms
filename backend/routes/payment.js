import express from 'express'
import { query } from '../config/db.js'
import { authenticate, requireStudent, requireDonor, requireAdmin } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { uploadFile } from '../config/supabase.js'

const router = express.Router()

// ─────────────────────────────────────────────────────────────
// GET /api/payment/:application_id  — get payment details row
// ─────────────────────────────────────────────────────────────
router.get('/:application_id', authenticate, async (req, res) => {
  try {
    const { application_id } = req.params
    const result = await query(
      `SELECT pd.*, u.name AS verified_by_name
       FROM payment_details pd
       LEFT JOIN users u ON pd.payment_verified_by = u.id
       WHERE pd.application_id = $1`,
      [application_id]
    )
    if (!result.rows.length) {
      // Return a locked stub so frontend knows it exists but is locked
      return res.json({ application_id, payment_details_status: 'Locked' })
    }
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─────────────────────────────────────────────────────────────
// POST /api/payment/:application_id  — student submits payment details
// ─────────────────────────────────────────────────────────────
router.post('/:application_id', authenticate, requireStudent, upload.single('passbook'), async (req, res) => {
  try {
    const { application_id } = req.params
    const {
      account_holder_name, bank_name, branch_name,
      account_number, account_type, contact_number
    } = req.body

    // Verify application belongs to student and is Fully Approved or Resubmission Required
    const appCheck = await query(
      `SELECT a.id, pd.payment_details_status
       FROM applications a
       LEFT JOIN payment_details pd ON pd.application_id = a.id
       WHERE a.id = $1 AND a.student_id = $2`,
      [application_id, req.user.id]
    )
    if (!appCheck.rows.length) return res.status(403).json({ message: 'Forbidden' })

    const pdStatus = appCheck.rows[0].payment_details_status
    if (!['Unlocked', 'Resubmission Required'].includes(pdStatus)) {
      return res.status(403).json({ message: 'Payment details are currently locked' })
    }

    // Handle passbook upload
    let passbookUrl = null
    let passbookFileName = null
    if (req.file) {
      try {
        const ext = req.file.originalname.split('.').pop()
        const filePath = `payment/${application_id}/passbook_${Date.now()}.${ext}`
        passbookUrl = await uploadFile('welfare-docs', filePath, req.file.buffer, req.file.mimetype)
        passbookFileName = req.file.originalname
      } catch (e) {
        console.warn('Passbook upload failed:', e.message)
      }
    }

    // Determine new status
    const isResubmission = pdStatus === 'Resubmission Required'
    const newStatus = isResubmission ? 'Re-Submitted' : 'Submitted'

    // Upsert payment details
    const result = await query(
      `INSERT INTO payment_details
         (application_id, student_id, account_holder_name, bank_name, branch_name,
          account_number, account_type, contact_number, passbook_url, passbook_file_name,
          payment_details_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (application_id) DO UPDATE SET
         account_holder_name    = EXCLUDED.account_holder_name,
         bank_name              = EXCLUDED.bank_name,
         branch_name            = EXCLUDED.branch_name,
         account_number         = EXCLUDED.account_number,
         account_type           = EXCLUDED.account_type,
         contact_number         = EXCLUDED.contact_number,
         passbook_url           = COALESCE(EXCLUDED.passbook_url, payment_details.passbook_url),
         passbook_file_name     = COALESCE(EXCLUDED.passbook_file_name, payment_details.passbook_file_name),
         payment_details_status = $11,
         payment_resubmission_count = CASE WHEN $12 THEN payment_details.payment_resubmission_count + 1 ELSE payment_details.payment_resubmission_count END,
         resubmission_reason    = NULL,
         donor_payment_comments = NULL,
         updated_at             = NOW()
       RETURNING *`,
      [application_id, req.user.id, account_holder_name, bank_name, branch_name,
       account_number, account_type, contact_number, passbookUrl, passbookFileName,
       newStatus, isResubmission]
    )

    // Update application status
    await query(
      `UPDATE applications SET status = 'Payment Details Submitted', updated_at = NOW()
       WHERE id = $1`, [application_id]
    )

    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─────────────────────────────────────────────────────────────
// POST /api/payment/:application_id/verify  — donor verifies
// ─────────────────────────────────────────────────────────────
router.post('/:application_id/verify', authenticate, requireDonor, async (req, res) => {
  try {
    const { application_id } = req.params

    // Verify donor is assigned to this application
    const check = await query(
      `SELECT ds.id FROM donor_students ds
       WHERE ds.application_id = $1 AND ds.donor_id = $2 AND ds.donor_decision = 'Approved'`,
      [application_id, req.user.id]
    )
    if (!check.rows.length) return res.status(403).json({ message: 'Forbidden' })

    await query(
      `UPDATE payment_details SET
         payment_details_status = 'Verified',
         payment_verified_by    = $1,
         payment_verified_date  = NOW(),
         updated_at             = NOW()
       WHERE application_id = $2`,
      [req.user.id, application_id]
    )

    await query(
      `UPDATE applications SET status = 'Payment Verified', updated_at = NOW()
       WHERE id = $1`, [application_id]
    )

    // Notify student
    const app = await query('SELECT student_id FROM applications WHERE id = $1', [application_id])
    if (app.rows.length) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, 'payment_verified', 'Payment Details Verified!',
           'Your payment details have been verified. Scholarship funds will be disbursed shortly.',
           '/student/applications')`,
        [app.rows[0].student_id]
      )
    }

    res.json({ message: 'Payment details verified' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─────────────────────────────────────────────────────────────
// POST /api/payment/:application_id/resubmit  — donor requests resubmission
// ─────────────────────────────────────────────────────────────
router.post('/:application_id/resubmit', authenticate, requireDonor, async (req, res) => {
  try {
    const { application_id } = req.params
    const { resubmission_reason, donor_payment_comments } = req.body

    if (!resubmission_reason) return res.status(400).json({ message: 'Resubmission reason is required' })

    // Verify donor is assigned to this application
    const check = await query(
      `SELECT ds.id FROM donor_students ds
       WHERE ds.application_id = $1 AND ds.donor_id = $2 AND ds.donor_decision = 'Approved'`,
      [application_id, req.user.id]
    )
    if (!check.rows.length) return res.status(403).json({ message: 'Forbidden' })

    await query(
      `UPDATE payment_details SET
         payment_details_status = 'Resubmission Required',
         resubmission_reason    = $1,
         donor_payment_comments = $2,
         updated_at             = NOW()
       WHERE application_id = $3`,
      [resubmission_reason, donor_payment_comments, application_id]
    )

    await query(
      `UPDATE applications SET status = 'Fully Approved', updated_at = NOW()
       WHERE id = $1`, [application_id]
    )

    // Notify student
    const app = await query('SELECT student_id FROM applications WHERE id = $1', [application_id])
    if (app.rows.length) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, 'payment_resubmission', 'Payment Details Require Correction',
           'Your payment details require correction. Please review the donor comments and submit updated information.',
           '/student/applications')`,
        [app.rows[0].student_id]
      )
    }

    res.json({ message: 'Resubmission requested' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─────────────────────────────────────────────────────────────
// GET /api/payment/donor/pending  — donor: list apps needing payment review
// ─────────────────────────────────────────────────────────────
router.get('/donor/pending', authenticate, requireDonor, async (req, res) => {
  try {
    const result = await query(
      `SELECT pd.*, a.student_id, u.name AS student_name, u.registration_number,
              s.title AS scholarship_title, u.batch, u.department
       FROM payment_details pd
       JOIN applications a ON pd.application_id = a.id
       JOIN users u ON a.student_id = u.id
       JOIN scholarships s ON a.scholarship_id = s.id
       JOIN donor_students ds ON ds.application_id = a.id AND ds.donor_id = $1
       WHERE pd.payment_details_status IN ('Submitted','Re-Submitted','Pending Verification')
       ORDER BY pd.updated_at DESC`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─────────────────────────────────────────────────────────────
// GET /api/payment/admin/all  — admin: view all payment details
// ─────────────────────────────────────────────────────────────
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT pd.*, u.name AS student_name, s.title AS scholarship_title,
              vb.name AS verified_by_name
       FROM payment_details pd
       JOIN applications a ON pd.application_id = a.id
       JOIN users u ON a.student_id = u.id
       JOIN scholarships s ON a.scholarship_id = s.id
       LEFT JOIN users vb ON pd.payment_verified_by = vb.id
       WHERE pd.payment_details_status != 'Locked'
       ORDER BY pd.updated_at DESC`
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/payment/notifications/:user_id  — student notifications
router.get('/notifications/:user_id', authenticate, async (req, res) => {
  try {
    if (req.user.id !== req.params.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' })
    }
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.params.user_id]
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/payment/notifications/:id/read
router.post('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await query(`UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id])
    res.json({ message: 'Marked read' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

export default router