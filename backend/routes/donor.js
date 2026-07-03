import express from 'express'
import { query } from '../config/db.js'
import { authenticate, requireDonor } from '../middleware/auth.js'

const router = express.Router()

// GET /api/donor/stats
router.get('/stats', authenticate, requireDonor, async (req, res) => {
  try {
    const did = req.user.id
    const [scholarships, students, progress] = await Promise.all([
      query(`SELECT COUNT(*) FROM scholarships WHERE donor_id = $1`, [did]),
      query(`SELECT COUNT(DISTINCT ds.application_id) FROM donor_students ds WHERE ds.donor_id = $1 AND ds.donor_decision = 'Approved'`, [did]),
      query(`SELECT COUNT(*) FROM progress_reports pr JOIN applications a ON pr.application_id = a.id JOIN scholarships s ON a.scholarship_id = s.id WHERE s.donor_id = $1`, [did]),
    ])
    res.json({
      scholarships_count: parseInt(scholarships.rows[0].count),
      students_count: parseInt(students.rows[0].count),
      progress_updates: parseInt(progress.rows[0].count),
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/donor/profile
router.get('/profile', authenticate, requireDonor, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, phone, organization, address, status, available_fund, total_contribution
       FROM users WHERE id = $1`, [req.user.id])
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/donor/scholarships
router.get('/scholarships', authenticate, requireDonor, async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*,
              (SELECT COUNT(*) FROM donor_students ds WHERE ds.scholarship_id = s.id) AS students_count
       FROM scholarships s
       WHERE s.donor_id = $1
       ORDER BY s.created_at DESC`, [req.user.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/donor/scholarship-requests
router.get('/scholarship-requests', authenticate, requireDonor, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM donor_scholarship_requests WHERE donor_id = $1 ORDER BY created_at DESC`,
      [req.user.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/donor/scholarship-requests
router.post('/scholarship-requests', authenticate, requireDonor, async (req, res) => {
  try {
    const {
      scholarship_title, funding_amount, eligible_batch, application_deadline,
      description, eligibility_criteria, required_documents, notes
    } = req.body
    if (!scholarship_title || !funding_amount) return res.status(400).json({ message: 'Title and funding amount required' })

    const result = await query(
      `INSERT INTO donor_scholarship_requests
       (donor_id, scholarship_title, funding_amount, eligible_batch, application_deadline,
        description, eligibility_criteria, required_documents, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Pending') RETURNING *`,
      [req.user.id, scholarship_title, funding_amount, eligible_batch, application_deadline || null,
       description, eligibility_criteria, required_documents, notes])
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/donor/students  — students assigned to this donor's scholarships
router.get('/students', authenticate, requireDonor, async (req, res) => {
  try {
    const result = await query(
      `SELECT ds.id, ds.donor_decision, ds.comment,
              u.name AS student_name, u.registration_number, u.batch, u.department, u.gpa,
              s.id AS scholarship_id, s.title AS scholarship_title,
              a.id AS application_id
       FROM donor_students ds
       JOIN applications a ON ds.application_id = a.id
       JOIN users u ON a.student_id = u.id
       JOIN scholarships s ON ds.scholarship_id = s.id
       WHERE ds.donor_id = $1
       ORDER BY ds.created_at DESC`, [req.user.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/donor/students/:id/decision
router.post('/students/:id/decision', authenticate, requireDonor, async (req, res) => {
  try {
    const { decision, comment } = req.body
    if (!['Approved', 'Rejected'].includes(decision)) return res.status(400).json({ message: 'Invalid decision' })

    // Verify this assignment belongs to this donor
    const check = await query('SELECT id FROM donor_students WHERE id = $1 AND donor_id = $2', [req.params.id, req.user.id])
    if (!check.rows.length) return res.status(403).json({ message: 'Forbidden' })

    await query(
      `UPDATE donor_students SET donor_decision = $1, comment = $2, updated_at = NOW() WHERE id = $3`,
      [decision, comment, req.params.id])

    // If approved, mark application as final
    if (decision === 'Approved') {
      const ds = await query('SELECT application_id FROM donor_students WHERE id = $1', [req.params.id])
      await query(
        `UPDATE applications SET donor_assigned = TRUE, updated_at = NOW() WHERE id = $1`,
        [ds.rows[0].application_id])
    }

    res.json({ message: `Student ${decision.toLowerCase()}` })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/donor/announcements
router.get('/announcements', authenticate, requireDonor, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM announcements
       WHERE status = 'Published' AND (audience = 'All Users' OR audience = 'Donors')
       ORDER BY publish_date DESC`)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/donor/progress-updates  — progress reports for this donor's students
router.get('/progress-updates', authenticate, requireDonor, async (req, res) => {
  try {
    const result = await query(
      `SELECT pr.*, u.name AS student_name, s.title AS scholarship_title
       FROM progress_reports pr
       JOIN applications a ON pr.application_id = a.id
       JOIN users u ON a.student_id = u.id
       JOIN scholarships s ON a.scholarship_id = s.id
       WHERE s.donor_id = $1
       ORDER BY pr.created_at DESC
       LIMIT 20`, [req.user.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

export default router
