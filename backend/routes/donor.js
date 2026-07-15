import express from 'express'
import { query } from '../config/db.js'
import {
  authenticate,
  requireDonor,
} from '../middleware/auth.js'

const router = express.Router()

function cleanText(value) {
  return typeof value === 'string'
    ? value.trim()
    : ''
}

// ─────────────────────────────────────────────────────────────
// GET /api/donor/stats
// ─────────────────────────────────────────────────────────────
router.get(
  '/stats',
  authenticate,
  requireDonor,
  async (req, res) => {
    try {
      const donorId = req.user.id

      const [
        scholarshipsResult,
        studentsResult,
        progressResult,
        pendingPaymentsResult,
        completedPaymentsResult,
      ] = await Promise.all([
        query(
          `SELECT COUNT(*)
           FROM scholarships
           WHERE donor_id = $1`,
          [donorId]
        ),

        query(
          `SELECT COUNT(DISTINCT ds.application_id)
           FROM donor_students ds
           WHERE ds.donor_id = $1`,
          [donorId]
        ),

        query(
          `SELECT COUNT(*)
           FROM progress_reports pr
           JOIN applications a
             ON a.id = pr.application_id
           JOIN donor_students ds
             ON ds.application_id = a.id
           WHERE ds.donor_id = $1`,
          [donorId]
        ),

        query(
          `SELECT COUNT(*)
           FROM scholarship_payments
           WHERE donor_id = $1
             AND payment_status IN (
               'Pending',
               'Processing',
               'On Hold'
             )`,
          [donorId]
        ),

        query(
          `SELECT COUNT(*)
           FROM scholarship_payments
           WHERE donor_id = $1
             AND payment_status = 'Paid'`,
          [donorId]
        ),
      ])

      return res.json({
        scholarships_count:
          Number(
            scholarshipsResult.rows[0]?.count || 0
          ),

        students_count:
          Number(
            studentsResult.rows[0]?.count || 0
          ),

        progress_updates:
          Number(
            progressResult.rows[0]?.count || 0
          ),

        pending_payments:
          Number(
            pendingPaymentsResult.rows[0]?.count ||
              0
          ),

        completed_payments:
          Number(
            completedPaymentsResult.rows[0]
              ?.count || 0
          ),
      })
    } catch (err) {
      console.error(
        'Donor stats error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to load donor statistics',
      })
    }
  }
)

// ─────────────────────────────────────────────────────────────
// GET /api/donor/profile
// ─────────────────────────────────────────────────────────────
router.get(
  '/profile',
  authenticate,
  requireDonor,
  async (req, res) => {
    try {
      const result = await query(
        `SELECT
           id,
           name,
           email,
           phone,
           organization,
           address,
           status,
           available_fund,
           total_contribution
         FROM users
         WHERE id = $1`,
        [req.user.id]
      )

      if (!result.rows.length) {
        return res.status(404).json({
          message: 'Donor profile not found',
        })
      }

      return res.json(result.rows[0])
    } catch (err) {
      console.error(
        'Donor profile error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to load donor profile',
      })
    }
  }
)

// ─────────────────────────────────────────────────────────────
// GET /api/donor/scholarships
// ─────────────────────────────────────────────────────────────
router.get(
  '/scholarships',
  authenticate,
  requireDonor,
  async (req, res) => {
    try {
      const result = await query(
        `SELECT
           s.*,

           (
             SELECT COUNT(*)
             FROM donor_students ds
             WHERE ds.scholarship_id = s.id
               AND ds.donor_id = $1
           ) AS students_count,

           (
             SELECT COUNT(*)
             FROM scholarship_payments sp
             JOIN applications a
               ON a.id = sp.application_id
             WHERE a.scholarship_id = s.id
               AND sp.donor_id = $1
               AND sp.payment_status = 'Paid'
           ) AS paid_students_count

         FROM scholarships s

         WHERE s.donor_id = $1

         ORDER BY s.created_at DESC`,
        [req.user.id]
      )

      return res.json(result.rows)
    } catch (err) {
      console.error(
        'Donor scholarships error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to load donor scholarships',
      })
    }
  }
)

// ─────────────────────────────────────────────────────────────
// GET /api/donor/scholarship-requests
// ─────────────────────────────────────────────────────────────
router.get(
  '/scholarship-requests',
  authenticate,
  requireDonor,
  async (req, res) => {
    try {
      const result = await query(
        `SELECT *
         FROM donor_scholarship_requests
         WHERE donor_id = $1
         ORDER BY created_at DESC`,
        [req.user.id]
      )

      return res.json(result.rows)
    } catch (err) {
      console.error(
        'Donor scholarship requests error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to load scholarship requests',
      })
    }
  }
)

// ─────────────────────────────────────────────────────────────
// PUT /api/donor/scholarship-requests/:id
// ─────────────────────────────────────────────────────────────
router.put(
  '/scholarship-requests/:id',
  authenticate,
  requireDonor,
  async (req, res) => {
    try {
      const {
        scholarship_title,
        funding_amount,
        eligible_batch,
        application_deadline,
        description,
        eligibility_criteria,
        required_documents,
        supplementary_documents,
        notes,
        category,
        num_students,
        opening_date,
        terms,
        status_override,
      } = req.body

      let finalFunding =
        Number.parseFloat(funding_amount)

      if (Number.isNaN(finalFunding)) {
        finalFunding = 0
      }

      const finalStatus =
        status_override === 'Draft'
          ? 'Draft'
          : 'Pending'

      if (
        finalStatus !== 'Draft' &&
        finalFunding <= 0
      ) {
        return res.status(400).json({
          message:
            'Funding amount must be greater than 0',
        })
      }

      const checkResult = await query(
        `SELECT id, status
         FROM donor_scholarship_requests
         WHERE id = $1
           AND donor_id = $2`,
        [
          req.params.id,
          req.user.id,
        ]
      )

      if (!checkResult.rows.length) {
        return res.status(404).json({
          message:
            'Scholarship request not found',
        })
      }

      if (
        checkResult.rows[0].status !==
        'Draft'
      ) {
        return res.status(400).json({
          message:
            'Only draft requests can be edited',
        })
      }

      const result = await query(
        `UPDATE donor_scholarship_requests
         SET
           scholarship_title = $1,
           funding_amount = $2,
           eligible_batch = $3,
           application_deadline = $4,
           description = $5,
           eligibility_criteria = $6,
           required_documents = $7,
           supplementary_documents = $8,
           notes = $9,
           status = $10,
           category = $11,
           num_students = $12,
           opening_date = $13,
           terms = $14,
           updated_at = NOW()

         WHERE id = $15

         RETURNING *`,
        [
          cleanText(scholarship_title),
          finalFunding,
          eligible_batch || null,
          application_deadline || null,
          description || null,
          eligibility_criteria || null,
          required_documents || [],
          supplementary_documents || [],
          notes || null,
          finalStatus,
          category || null,
          num_students
            ? Number.parseInt(
                num_students,
                10
              )
            : null,
          opening_date || null,
          terms || null,
          req.params.id,
        ]
      )

      return res.json(result.rows[0])
    } catch (err) {
      console.error(
        'Update donor scholarship request error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to update scholarship request',
      })
    }
  }
)

// ─────────────────────────────────────────────────────────────
// POST /api/donor/scholarship-requests
// ─────────────────────────────────────────────────────────────
router.post(
  '/scholarship-requests',
  authenticate,
  requireDonor,
  async (req, res) => {
    try {
      const {
        scholarship_title,
        funding_amount,
        eligible_batch,
        application_deadline,
        description,
        eligibility_criteria,
        required_documents,
        supplementary_documents,
        notes,
        category,
        num_students,
        opening_date,
        terms,
        status_override,
      } = req.body

      if (!cleanText(scholarship_title)) {
        return res.status(400).json({
          message:
            'Scholarship title is required',
        })
      }

      let finalFunding =
        Number.parseFloat(funding_amount)

      if (Number.isNaN(finalFunding)) {
        finalFunding = 0
      }

      const finalStatus =
        status_override === 'Draft'
          ? 'Draft'
          : 'Pending'

      if (
        finalStatus !== 'Draft' &&
        finalFunding <= 0
      ) {
        return res.status(400).json({
          message:
            'Funding amount must be greater than 0',
        })
      }

      const result = await query(
        `INSERT INTO donor_scholarship_requests (
           donor_id,
           scholarship_title,
           funding_amount,
           eligible_batch,
           application_deadline,
           description,
           eligibility_criteria,
           required_documents,
           supplementary_documents,
           notes,
           status,
           category,
           num_students,
           opening_date,
           terms
         )
         VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, $8, $9, $10,
           $11, $12, $13, $14, $15
         )
         RETURNING *`,
        [
          req.user.id,
          cleanText(scholarship_title),
          finalFunding,
          eligible_batch || null,
          application_deadline || null,
          description || null,
          eligibility_criteria || null,
          required_documents || [],
          supplementary_documents || [],
          notes || null,
          finalStatus,
          category || null,
          num_students
            ? Number.parseInt(
                num_students,
                10
              )
            : null,
          opening_date || null,
          terms || null,
        ]
      )

      return res
        .status(201)
        .json(result.rows[0])
    } catch (err) {
      console.error(
        'Create donor scholarship request error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to create scholarship request',
      })
    }
  }
)

// ─────────────────────────────────────────────────────────────
// GET /api/donor/students
//
// Donor views students already selected, verified and assigned
// by the admin.
//
// The donor no longer approves or rejects these students.
// ─────────────────────────────────────────────────────────────
router.get(
  '/students',
  authenticate,
  requireDonor,
  async (req, res) => {
    try {
      const result = await query(
        `SELECT
           ds.id AS assignment_id,
           ds.created_at AS assigned_at,

           a.id AS application_id,
           a.status AS application_status,
           a.student_id,

           u.name AS student_name,
           u.registration_number,
           u.batch,
           u.department,
           u.gpa,
           u.email,
           u.phone,

           s.id AS scholarship_id,
           s.title AS scholarship_title,

           pd.payment_details_status,

           sp.id AS scholarship_payment_id,
           COALESCE(
             sp.payment_status,
             'Pending'
           ) AS payment_status,
           sp.amount AS paid_amount,
           sp.payment_date,
           sp.transaction_reference

         FROM donor_students ds

         JOIN applications a
           ON a.id = ds.application_id

         JOIN users u
           ON u.id = a.student_id

         JOIN scholarships s
           ON s.id = ds.scholarship_id

         LEFT JOIN payment_details pd
           ON pd.application_id =
              a.id

         LEFT JOIN scholarship_payments sp
           ON sp.application_id =
              a.id

         WHERE ds.donor_id = $1
           AND a.status IN (
             'Assigned to Donor',
             'Payment Processing',
             'Completed'
           )
           AND pd.payment_details_status =
             'Admin Verified'

         ORDER BY ds.created_at DESC`,
        [req.user.id]
      )

      return res.json(result.rows)
    } catch (err) {
      console.error(
        'Donor students error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to load assigned students',
      })
    }
  }
)

// ─────────────────────────────────────────────────────────────
// GET /api/donor/students/:id
//
// Loads one assigned student for the donor.
// :id is the donor_students assignment ID.
// ─────────────────────────────────────────────────────────────
router.get(
  '/students/:id',
  authenticate,
  requireDonor,
  async (req, res) => {
    try {
      const result = await query(
        `SELECT
           ds.id AS assignment_id,
           ds.created_at AS assigned_at,
           a.id AS application_id,
           a.*,

           u.name AS student_name,
           u.registration_number,
           u.batch,
           u.department,
           u.gpa,
           u.email,
           u.phone,

           s.id AS scholarship_id,
           s.title AS scholarship_title,

           pd.payment_details_status,
           pd.account_holder_name,
           pd.bank_name,
           pd.branch_name,
           pd.account_number,
           pd.account_type,
           pd.contact_number,
           pd.passbook_url,
           pd.passbook_file_name,
           pd.payment_verified_date,

           verifier.name AS verified_by_name,

           sp.payment_status,
           sp.amount AS paid_amount,
           sp.payment_date,
           sp.transaction_reference,
           sp.receipt_url,
           sp.receipt_file_name,
           sp.donor_comments

         FROM donor_students ds

         JOIN applications a
           ON a.id = ds.application_id

         JOIN users u
           ON u.id = a.student_id

         JOIN scholarships s
           ON s.id = ds.scholarship_id

         JOIN payment_details pd
           ON pd.application_id =
              a.id

         LEFT JOIN users verifier
           ON verifier.id =
              pd.payment_verified_by

         LEFT JOIN scholarship_payments sp
           ON sp.application_id =
              a.id

         WHERE ds.id = $1
           AND ds.donor_id = $2
           AND pd.payment_details_status =
             'Admin Verified'`,
        [
          req.params.id,
          req.user.id,
        ]
      )

      if (!result.rows.length) {
        return res.status(404).json({
          message:
            'Assigned student not found',
        })
      }

      return res.json(result.rows[0])
    } catch (err) {
      console.error(
        'Donor student detail error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to load student details',
      })
    }
  }
)

// ─────────────────────────────────────────────────────────────
// POST /api/donor/students/:id/decision
//
// Deprecated old workflow route.
//
// Donors no longer approve or reject students.
// The admin already completed student selection and bank-detail
// verification before assignment.
// ─────────────────────────────────────────────────────────────
router.post(
  '/students/:id/decision',
  authenticate,
  requireDonor,
  async (req, res) => {
    return res.status(410).json({
      message:
        'Donor approval is no longer required. Use the Payments page to process the scholarship payment.',
    })
  }
)

// ─────────────────────────────────────────────────────────────
// GET /api/donor/announcements
// ─────────────────────────────────────────────────────────────
router.get(
  '/announcements',
  authenticate,
  requireDonor,
  async (req, res) => {
    try {
      const result = await query(
        `SELECT *
         FROM announcements
         WHERE status = 'Published'
           AND (
             audience = 'All Users'
             OR audience = 'Donors'
           )
         ORDER BY publish_date DESC`
      )

      return res.json(result.rows)
    } catch (err) {
      console.error(
        'Donor announcements error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to load announcements',
      })
    }
  }
)

// ─────────────────────────────────────────────────────────────
// GET /api/donor/progress-updates
// ─────────────────────────────────────────────────────────────
router.get(
  '/progress-updates',
  authenticate,
  requireDonor,
  async (req, res) => {
    try {
      const result = await query(
        `SELECT
           pr.*,
           u.name AS student_name,
           s.title AS scholarship_title

         FROM progress_reports pr

         JOIN applications a
           ON a.id = pr.application_id

         JOIN users u
           ON u.id = a.student_id

         JOIN scholarships s
           ON s.id = a.scholarship_id

         JOIN donor_students ds
           ON ds.application_id =
              a.id
          AND ds.donor_id = $1

         ORDER BY pr.created_at DESC

         LIMIT 20`,
        [req.user.id]
      )

      return res.json(result.rows)
    } catch (err) {
      console.error(
        'Donor progress updates error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to load progress updates',
      })
    }
  }
)

export default router