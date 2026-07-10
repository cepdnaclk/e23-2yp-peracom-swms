import express from 'express'
import { query } from '../config/db.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { getEmailProviderStatus } from '../services/emailService.js'

const router = express.Router()

// GET /api/admin/stats  — dashboard summary cards
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [pending_apps, pending_docs, open_issues, active_scholarships] = await Promise.all([
      query(`SELECT COUNT(*) FROM applications WHERE status = 'Pending'`),
      query(`SELECT COUNT(*) FROM application_documents WHERE status = 'Submitted'`),
      query(`SELECT COUNT(*) FROM issues WHERE status = 'Open'`),
      query(`SELECT COUNT(*) FROM scholarships WHERE status = 'Active'`),
    ])
    res.json({
      pending_applications: parseInt(pending_apps.rows[0].count),
      pending_docs: parseInt(pending_docs.rows[0].count),
      open_issues: parseInt(open_issues.rows[0].count),
      active_scholarships: parseInt(active_scholarships.rows[0].count),
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/activity  — recent activity feed
router.get('/activity', authenticate, requireAdmin, async (req, res) => {
  try {
    const [apps, issues, requests] = await Promise.all([
      query(`SELECT 'Application' AS type, u.name || ' applied for ' || s.title AS description,
             a.status, a.created_at AS date
             FROM applications a JOIN users u ON a.student_id = u.id JOIN scholarships s ON a.scholarship_id = s.id
             ORDER BY a.created_at DESC LIMIT 4`),
      query(`SELECT 'Issue' AS type, title AS description, status, created_at AS date
             FROM issues ORDER BY created_at DESC LIMIT 3`),
      query(`SELECT 'Scholarship Request' AS type, u.name || ' requested ' || r.scholarship_title AS description,
             r.status, r.created_at AS date
             FROM donor_scholarship_requests r JOIN users u ON r.donor_id = u.id
             ORDER BY r.created_at DESC LIMIT 3`),
    ])
    const all = [...apps.rows, ...issues.rows, ...requests.rows]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
    res.json(all)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/students
router.get('/students', authenticate, requireAdmin, async (req, res) => {
  try {
    const { batch, search, status } = req.query
    let q = `SELECT u.id, u.name, u.email, u.phone, u.department, u.batch, u.registration_number,
             u.gpa, u.current_year,
             (SELECT a.status FROM applications a WHERE a.student_id = u.id ORDER BY a.created_at DESC LIMIT 1) AS application_status
             FROM users u WHERE u.role = 'student' AND u.status = 'approved'`
    const params = []
    if (batch) { q += ` AND u.batch = $${params.length + 1}`; params.push(batch) }
    if (search) { q += ` AND (u.name ILIKE $${params.length + 1} OR u.registration_number ILIKE $${params.length + 1})`; params.push(`%${search}%`) }
    q += ' ORDER BY u.name'
    const result = await query(q, params)
    let rows = result.rows
    if (status) rows = rows.filter(r => r.application_status === status)
    res.json(rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/batches
router.get('/batches', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(`SELECT DISTINCT batch FROM users WHERE role = 'student' AND batch IS NOT NULL ORDER BY batch DESC`)
    res.json(result.rows.map(r => r.batch))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/student-stats
router.get('/student-stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { batch } = req.query
    let batchFilter = batch ? `AND u.batch = '${batch}'` : ''

    const [total, awarded, funds, totalApps, statusBreakdown] = await Promise.all([
      query(`SELECT COUNT(DISTINCT u.id) FROM users u WHERE u.role = 'student' AND u.status = 'approved' ${batchFilter}`),
      query(`SELECT COUNT(DISTINCT a.student_id) FROM applications a JOIN users u ON a.student_id = u.id WHERE a.status = 'Approved' AND u.role = 'student' ${batchFilter}`),
      query(`SELECT COALESCE(SUM(s.funding_amount),0) FROM applications a JOIN users u ON a.student_id = u.id JOIN scholarships s ON a.scholarship_id = s.id WHERE a.status = 'Approved' ${batchFilter}`),
      query(`SELECT COUNT(*) FROM applications a JOIN users u ON a.student_id = u.id WHERE u.role = 'student' ${batchFilter}`),
      query(`SELECT a.status, COUNT(*) FROM applications a JOIN users u ON a.student_id = u.id WHERE u.role = 'student' ${batchFilter} GROUP BY a.status`),
    ])

    const totalCount = parseInt(total.rows[0].count)
    const awardedCount = parseInt(awarded.rows[0].count)
    const breakdown = {}
    statusBreakdown.rows.forEach(r => { breakdown[r.status] = parseInt(r.count) })

    res.json({
      total_students: totalCount,
      awarded_students: awardedCount,
      total_funds: parseFloat(funds.rows[0].coalesce),
      total_applications: parseInt(totalApps.rows[0].count),
      success_rate: totalCount > 0 ? Math.round((awardedCount / totalCount) * 100) : 0,
      status_breakdown: breakdown,
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/students/:id
router.get('/students/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM users WHERE id = $1 AND role = 'student'`, [req.params.id])
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' })
    const { password_hash, ...user } = result.rows[0]
    res.json(user)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/students/:id/applications
router.get('/students/:id/applications', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, s.title AS scholarship_title, u2.name AS donor_name
       FROM applications a
       JOIN scholarships s ON a.scholarship_id = s.id
       LEFT JOIN users u2 ON s.donor_id = u2.id
       WHERE a.student_id = $1 ORDER BY a.created_at DESC`, [req.params.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/students/:id/documents
router.get('/students/:id/documents', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT ON (d.document_name) d.*
       FROM application_documents d
       JOIN applications a ON d.application_id = a.id
       WHERE a.student_id = $1
       ORDER BY d.document_name, d.created_at DESC`, [req.params.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/donors
router.get('/donors', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.organization, u.address, u.status,
              u.available_fund, u.total_contribution,
              (SELECT COUNT(*) FROM scholarships s WHERE s.donor_id = u.id) AS scholarship_count
       FROM users u WHERE u.role = 'donor'
       ORDER BY u.created_at DESC`)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/donor-stats
router.get('/donor-stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [total, active, funded, funds] = await Promise.all([
      query(`SELECT COUNT(*) FROM users WHERE role = 'donor'`),
      query(`SELECT COUNT(*) FROM users WHERE role = 'donor' AND status = 'approved'`),
      query(`SELECT COUNT(*) FROM scholarships WHERE donor_id IS NOT NULL AND status = 'Active'`),
      query(`SELECT COALESCE(SUM(available_fund), 0) FROM users WHERE role = 'donor' AND status = 'approved'`),
    ])
    res.json({
      total_donors: parseInt(total.rows[0].count),
      active_donors: parseInt(active.rows[0].count),
      funded_scholarships: parseInt(funded.rows[0].count),
      total_funds: parseFloat(funds.rows[0].coalesce),
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/donors/:id
router.get('/donors/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM users WHERE id = $1 AND role = 'donor'`, [req.params.id])
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' })
    const { password_hash, ...user } = result.rows[0]
    res.json(user)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/admin/donors/:id
router.put('/donors/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, organization, email, phone, address, available_fund } = req.body
    const result = await query(
      `UPDATE users SET name=$1, organization=$2, email=$3, phone=$4, address=$5,
       available_fund=$6, updated_at=NOW() WHERE id=$7 AND role='donor' RETURNING *`,
      [name, organization, email, phone, address, available_fund, req.params.id])
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' })
    const { password_hash, ...user } = result.rows[0]
    res.json(user)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/donors/:id/scholarships
router.get('/donors/:id/scholarships', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*,
              (SELECT COUNT(*) FROM donor_students ds WHERE ds.scholarship_id = s.id) AS students_assigned
       FROM scholarships s WHERE s.donor_id = $1 ORDER BY s.created_at DESC`, [req.params.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/donors/:id/students
router.get('/donors/:id/students', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.name AS student_name, u.registration_number, u.batch,
              s.title AS scholarship_title, a.status, ds.donor_decision
       FROM donor_students ds
       JOIN applications a ON ds.application_id = a.id
       JOIN users u ON a.student_id = u.id
       JOIN scholarships s ON ds.scholarship_id = s.id
       WHERE ds.donor_id = $1 ORDER BY ds.created_at DESC`, [req.params.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/admin/donors/:id/approve
router.post('/donors/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    await query(`UPDATE users SET status = 'approved', updated_at = NOW() WHERE id = $1 AND role = 'donor'`, [req.params.id])
    res.json({ message: 'Donor approved' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/admin/donors/:id/suspend
router.post('/donors/:id/suspend', authenticate, requireAdmin, async (req, res) => {
  try {
    await query(`UPDATE users SET status = 'suspended', updated_at = NOW() WHERE id = $1 AND role = 'donor'`, [req.params.id])
    res.json({ message: 'Donor suspended' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/admin/donors/:id/activate
router.post('/donors/:id/activate', authenticate, requireAdmin, async (req, res) => {
  try {
    await query(`UPDATE users SET status = 'approved', updated_at = NOW() WHERE id = $1 AND role = 'donor'`, [req.params.id])
    res.json({ message: 'Donor activated' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/announcements
router.get('/announcements', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM announcements ORDER BY created_at DESC`)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/admin/announcements
router.post('/announcements', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, audience, content, publish_date, status } = req.body
    if (!title) return res.status(400).json({ message: 'Title required' })
    const result = await query(
      `INSERT INTO announcements (title, audience, content, publish_date, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, audience || 'All Users', content, publish_date || null, status || 'Draft', req.user.id])
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/admin/announcements/:id
router.put('/announcements/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, audience, content, publish_date, status } = req.body
    const result = await query(
      `UPDATE announcements SET title=$1, audience=$2, content=$3, publish_date=$4, status=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [title, audience, content, publish_date || null, status, req.params.id])
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/admin/announcements/:id/publish
router.post('/announcements/:id/publish', authenticate, requireAdmin, async (req, res) => {
  try {
    await query(
      `UPDATE announcements SET status = 'Published', publish_date = COALESCE(publish_date, NOW()), updated_at = NOW()
       WHERE id = $1`, [req.params.id])
    res.json({ message: 'Published' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/admin/announcements/:id
router.delete('/announcements/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await query(`DELETE FROM announcements WHERE id = $1`, [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/issues
router.get('/issues', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*, u.name AS reported_by_name
       FROM issues i LEFT JOIN users u ON i.reported_by = u.id
       ORDER BY i.created_at DESC`)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/issue-stats
router.get('/issue-stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(`SELECT status, COUNT(*) FROM issues GROUP BY status`)
    const stats = { total: 0, open: 0, in_progress: 0, resolved: 0 }
    result.rows.forEach(r => {
      stats.total += parseInt(r.count)
      if (r.status === 'Open') stats.open = parseInt(r.count)
      if (r.status === 'In Progress') stats.in_progress = parseInt(r.count)
      if (r.status === 'Resolved') stats.resolved = parseInt(r.count)
    })
    res.json(stats)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/admin/issues/:id
router.put('/issues/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { admin_reply, status } = req.body
    const result = await query(
      `UPDATE issues SET admin_reply=$1, status=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [admin_reply, status, req.params.id])
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/pending-users
router.get('/pending-users', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, status, created_at FROM users
       WHERE role IN ('student','donor') ORDER BY created_at DESC`)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/user-counts
router.get('/user-counts', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT status, COUNT(*) FROM users WHERE role IN ('student','donor') GROUP BY status`)
    const counts = { pending: 0, approved: 0, rejected: 0, suspended: 0 }
    result.rows.forEach(r => {
      if (r.status === 'pending_approval') counts.pending = parseInt(r.count)
      else counts[r.status] = parseInt(r.count)
    })
    res.json(counts)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/admin/users/:id/approve
router.post('/users/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    await query(`UPDATE users SET status = 'approved', updated_at = NOW() WHERE id = $1`, [req.params.id])
    res.json({ message: 'User approved' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/admin/users/:id/reject
router.post('/users/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    await query(`UPDATE users SET status = 'rejected', updated_at = NOW() WHERE id = $1`, [req.params.id])
    res.json({ message: 'User rejected' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/admin/users/:id/suspend
router.post('/users/:id/suspend', authenticate, requireAdmin, async (req, res) => {
  try {
    await query(`UPDATE users SET status = 'suspended', updated_at = NOW() WHERE id = $1`, [req.params.id])
    res.json({ message: 'User suspended' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/email-health
router.get('/email-health', authenticate, requireAdmin, async (req, res) => {
  try {
    const providerStatus = getEmailProviderStatus()
    // Fetch last 10 email log entries
    const logsResult = await query(
      `SELECT recipient_email, email_type, delivery_status, subject, error_message, sent_at
       FROM email_logs ORDER BY sent_at DESC LIMIT 10`
    ).catch(() => ({ rows: [] })) // graceful if table is missing new columns
    res.json({
      ...providerStatus,
      recentLogs: logsResult.rows,
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

export default router
