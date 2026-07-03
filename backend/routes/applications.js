import express from 'express'
import { query } from '../config/db.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { uploadFile } from '../config/supabase.js'

const router = express.Router()

// ─────────────────────────────────────────────────────────────
// GET /api/applications  — admin: all applications
// ─────────────────────────────────────────────────────────────
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { scholarship_id, status, search } = req.query
    let q = `SELECT a.*, u.name AS student_name, s.title AS scholarship_title
             FROM applications a
             JOIN users u ON a.student_id = u.id
             JOIN scholarships s ON a.scholarship_id = s.id
             WHERE 1=1`
    const params = []
    if (scholarship_id) { q += ` AND a.scholarship_id = $${params.length+1}`; params.push(scholarship_id) }
    if (status)         { q += ` AND a.status = $${params.length+1}`;          params.push(status) }
    if (search)         { q += ` AND u.name ILIKE $${params.length+1}`;        params.push(`%${search}%`) }
    q += ' ORDER BY a.created_at DESC'
    const result = await query(q, params)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─────────────────────────────────────────────────────────────
// GET /api/applications/:id  — admin OR donor: single detail
// ─────────────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, u.name AS student_name, u.email, u.phone, u.department,
              u.registration_number, u.batch, u.id AS student_user_id,
              s.title AS scholarship_title, s.donor_id
       FROM applications a
       JOIN users u ON a.student_id = u.id
       JOIN scholarships s ON a.scholarship_id = s.id
       WHERE a.id = $1`, [req.params.id])
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' })

    const app = result.rows[0]

    // Access control: admin sees all; donor sees only assigned; student sees own
    if (req.user.role === 'student' && app.student_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    if (req.user.role === 'donor') {
      // Check if this app is assigned to this donor
      const check = await query(
        'SELECT id FROM donor_students WHERE application_id = $1 AND donor_id = $2',
        [req.params.id, req.user.id])
      if (!check.rows.length) return res.status(403).json({ message: 'Forbidden' })
    }

    res.json(app)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─────────────────────────────────────────────────────────────
// GET /api/applications/:id/documents
// ─────────────────────────────────────────────────────────────
router.get('/:id/documents', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT ON (document_name) *
       FROM application_documents
       WHERE application_id = $1
       ORDER BY document_name, created_at DESC`,
      [req.params.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─────────────────────────────────────────────────────────────
// POST /api/applications/:id/documents  — student uploads doc
// ─────────────────────────────────────────────────────────────
router.post('/:id/documents', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { document_name } = req.body
    if (!req.file)       return res.status(400).json({ message: 'File required' })
    if (!document_name)  return res.status(400).json({ message: 'document_name required' })

    // Must be the application owner
    const appCheck = await query(
      'SELECT id FROM applications WHERE id = $1 AND student_id = $2',
      [req.params.id, req.user.id])
    if (!appCheck.rows.length) return res.status(403).json({ message: 'Forbidden' })

    let fileUrl = null
    try {
      const ext = req.file.originalname.split('.').pop()
      const filePath = `documents/${req.params.id}/${document_name.replace(/\s+/g,'_')}_${Date.now()}.${ext}`
      fileUrl = await uploadFile('welfare-docs', filePath, req.file.buffer, req.file.mimetype)
    } catch (storageErr) {
      console.warn('Storage upload failed, storing filename only:', storageErr.message)
    }

    const result = await query(
      `INSERT INTO application_documents (application_id, document_name, file_name, file_url, status)
       VALUES ($1, $2, $3, $4, 'Submitted') RETURNING *`,
      [req.params.id, document_name, req.file.originalname, fileUrl])
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─────────────────────────────────────────────────────────────
// PATCH /api/applications/:id/documents/:docId/verify  — admin
// ─────────────────────────────────────────────────────────────
router.patch('/:id/documents/:docId/verify', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `UPDATE application_documents
       SET status = 'Verified', updated_at = NOW()
       WHERE id = $1 AND application_id = $2
       RETURNING *`,
      [req.params.docId, req.params.id])
    if (!result.rows.length) return res.status(404).json({ message: 'Document not found' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─────────────────────────────────────────────────────────────
// DELETE /api/applications/:id/documents/:docId  — student
// ─────────────────────────────────────────────────────────────
router.delete('/:id/documents/:docId', authenticate, async (req, res) => {
  try {
    // Must be the application owner
    const appCheck = await query(
      'SELECT id FROM applications WHERE id = $1 AND student_id = $2',
      [req.params.id, req.user.id])
    if (!appCheck.rows.length) return res.status(403).json({ message: 'Forbidden' })

    await query(
      'DELETE FROM application_documents WHERE id = $1 AND application_id = $2',
      [req.params.docId, req.params.id])
    res.json({ message: 'Document deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─────────────────────────────────────────────────────────────
// POST /api/applications/:id/approve  — admin
// ─────────────────────────────────────────────────────────────
router.post('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    await query(
      `UPDATE applications SET status = 'Approved', admin_reason = NULL, updated_at = NOW()
       WHERE id = $1`,
      [req.params.id])
    res.json({ message: 'Application approved' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─────────────────────────────────────────────────────────────
// POST /api/applications/:id/reject  — admin
// ─────────────────────────────────────────────────────────────
router.post('/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { admin_reason } = req.body
    await query(
      `UPDATE applications SET status = 'Rejected', admin_reason = $1, updated_at = NOW()
       WHERE id = $2`,
      [admin_reason, req.params.id])
    res.json({ message: 'Application rejected' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─────────────────────────────────────────────────────────────
// POST /api/applications/:id/resubmit  — admin
// ─────────────────────────────────────────────────────────────
router.post('/:id/resubmit', authenticate, requireAdmin, async (req, res) => {
  try {
    const { admin_reason } = req.body
    await query(
      `UPDATE applications SET status = 'Resubmission Requested', admin_reason = $1, updated_at = NOW()
       WHERE id = $2`,
      [admin_reason, req.params.id])
    res.json({ message: 'Resubmission requested' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

export default router