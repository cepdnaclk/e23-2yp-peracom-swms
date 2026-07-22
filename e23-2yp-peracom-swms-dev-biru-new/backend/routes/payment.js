import express from 'express'
import { query } from '../config/db.js'
import {
  authenticate,
  requireStudent,
  requireDonor,
  requireAdmin,
} from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { uploadFile } from '../config/supabase.js'

const router = express.Router()

// Student may edit bank details only in these states.
const STUDENT_EDITABLE_STATUSES = [
  'Requested',
  'Correction Required',
]

// Admin may verify or request corrections only in these states.
const ADMIN_REVIEWABLE_STATUSES = [
  'Submitted',
  'Re-Submitted',
]

// Safely trim incoming text values.
function cleanText(value) {
  return typeof value === 'string'
    ? value.trim()
    : ''
}

/*
  IMPORTANT ROUTE ORDER

  Static routes such as:
    /admin/all
    /donor/pending
    /notifications/:user_id

  must appear before:

    /:application_id

  Otherwise Express may treat "admin", "donor", or "notifications"
  as an application ID.
*/


// ─────────────────────────────────────────────────────────────
// GET /api/payment/admin/all
// Admin views all requested, submitted, corrected, and verified
// student bank details.
// ─────────────────────────────────────────────────────────────
router.get(
  '/admin/all',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await query(
        `SELECT
           pd.*,

           a.status AS application_status,
           a.scholarship_id,

           u.name AS student_name,
           u.registration_number,
           u.batch,

           s.title AS scholarship_title,

           verified_user.name AS verified_by_name

         FROM payment_details pd

         JOIN applications a
           ON a.id = pd.application_id

         JOIN users u
           ON u.id = a.student_id

         JOIN scholarships s
           ON s.id = a.scholarship_id

         LEFT JOIN users verified_user
           ON verified_user.id = pd.payment_verified_by

         WHERE pd.payment_details_status <> 'Locked'

         ORDER BY pd.updated_at DESC`
      )

      return res.json(result.rows)
    } catch (err) {
      console.error(
        'Admin payment details list error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to load payment details',
      })
    }
  }
)


// ─────────────────────────────────────────────────────────────
// GET /api/payment/donor/pending
//
// Donor sees only:
// - students assigned to the logged-in donor
// - bank details already verified by admin
//
// The donor will later use this information to process the
// actual scholarship payment.
// ─────────────────────────────────────────────────────────────
router.get(
  '/donor/pending',
  authenticate,
  requireDonor,
  async (req, res) => {
    try {
      const result = await query(
        `SELECT
           pd.*,

           a.student_id,
           a.status AS application_status,

           u.name AS student_name,
           u.registration_number,
           u.batch,

           s.title AS scholarship_title

         FROM payment_details pd

         JOIN applications a
           ON a.id = pd.application_id

         JOIN users u
           ON u.id = a.student_id

         JOIN scholarships s
           ON s.id = a.scholarship_id

         JOIN donor_students ds
           ON ds.application_id = a.id
          AND ds.donor_id = $1

         WHERE pd.payment_details_status = 'Admin Verified'

         ORDER BY pd.updated_at DESC`,
        [req.user.id]
      )

      return res.json(result.rows)
    } catch (err) {
      console.error(
        'Donor payment details list error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to load assigned payment details',
      })
    }
  }
)


// ─────────────────────────────────────────────────────────────
// GET /api/payment/notifications/:user_id
//
// Student may view only their own notifications.
// Admin may view another user's notifications.
// ─────────────────────────────────────────────────────────────
router.get(
  '/notifications/:user_id',
  authenticate,
  async (req, res) => {
    try {
      const isOwner =
        req.user.id === req.params.user_id

      const isAdmin =
        req.user.role === 'admin'

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          message: 'Forbidden',
        })
      }

      const result = await query(
        `SELECT *
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [req.params.user_id]
      )

      return res.json(result.rows)
    } catch (err) {
      console.error(
        'Payment notification list error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to load notifications',
      })
    }
  }
)
// ─────────────────────────────────────────────────────────────
// POST /api/payment/notifications/:id/read
//
// Marks one notification as read.
// Static route is intentionally declared before export.
// ─────────────────────────────────────────────────────────────
router.post(
  '/notifications/:id/read',
  authenticate,
  async (req, res) => {
    try {
      const result = await query(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE id = $1
           AND user_id = $2
         RETURNING id`,
        [
          req.params.id,
          req.user.id,
        ]
      )

      if (!result.rows.length) {
        return res.status(404).json({
          message:
            'Notification not found',
        })
      }

      return res.json({
        message:
          'Notification marked as read',
      })
    } catch (err) {
      console.error(
        'Notification read error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to mark notification as read',
      })
    }
  }
)




// ─────────────────────────────────────────────────────────────
// GET /api/payment/:application_id
//
// Access rules:
// - Student: only their own application
// - Admin: any application
// - Donor: only an assigned student whose bank details have
//          already been verified by an admin
// ─────────────────────────────────────────────────────────────
router.get(
  '/:application_id',
  authenticate,
  async (req, res) => {
    try {
      const { application_id } = req.params

      const applicationResult = await query(
        `SELECT
           id,
           student_id
         FROM applications
         WHERE id = $1`,
        [application_id]
      )

      if (!applicationResult.rows.length) {
        return res.status(404).json({
          message: 'Application not found',
        })
      }

      const application =
        applicationResult.rows[0]

      // Student may access only their own application.
      if (
        req.user.role === 'student' &&
        application.student_id !== req.user.id
      ) {
        return res.status(403).json({
          message: 'Forbidden',
        })
      }

      // Donor may access only assigned and admin-verified details.
      if (req.user.role === 'donor') {
        const assignmentResult = await query(
          `SELECT ds.id

           FROM donor_students ds

           JOIN payment_details pd
             ON pd.application_id = ds.application_id

           WHERE ds.application_id = $1
             AND ds.donor_id = $2
             AND pd.payment_details_status = 'Admin Verified'`,
          [
            application_id,
            req.user.id,
          ]
        )

        if (!assignmentResult.rows.length) {
          return res.status(403).json({
            message: 'Forbidden',
          })
        }
      }

      const result = await query(
        `SELECT
           pd.*,
           verified_user.name AS verified_by_name

         FROM payment_details pd

         LEFT JOIN users verified_user
           ON verified_user.id = pd.payment_verified_by

         WHERE pd.application_id = $1`,
        [application_id]
      )

      // No row means payment details have not been requested yet.
      if (!result.rows.length) {
        return res.json({
          application_id,
          payment_details_status: 'Locked',
        })
      }

      return res.json(result.rows[0])
    } catch (err) {
      console.error(
        'Get payment details error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to load payment details',
      })
    }
  }
)

// ─────────────────────────────────────────────────────────────
// POST /api/payment/:application_id
//
// Student submits bank details after admin requests them,
// or submits corrected details after admin requests a correction.
// ─────────────────────────────────────────────────────────────
router.post(
  '/:application_id',
  authenticate,
  requireStudent,
  upload.single('passbook'),
  async (req, res) => {
    try {
      const { application_id } = req.params

      const accountHolderName =
        cleanText(req.body.account_holder_name)

      const bankName =
        cleanText(req.body.bank_name)

      const branchName =
        cleanText(req.body.branch_name)

      const accountNumber =
        cleanText(req.body.account_number)

      const accountType =
        cleanText(req.body.account_type)

      const contactNumber =
        cleanText(req.body.contact_number)

      // Validate required fields.
      if (
        !accountHolderName ||
        !bankName ||
        !accountNumber ||
        !accountType
      ) {
        return res.status(400).json({
          message:
            'Account holder name, bank name, account number and account type are required',
        })
      }

      // Confirm that the application belongs to the logged-in student.
      const applicationResult = await query(
        `SELECT
           a.id,
           a.student_id,
           a.status AS application_status,

           pd.payment_details_status,
           pd.passbook_url

         FROM applications a

         LEFT JOIN payment_details pd
           ON pd.application_id = a.id

         WHERE a.id = $1
           AND a.student_id = $2`,
        [
          application_id,
          req.user.id,
        ]
      )

      if (!applicationResult.rows.length) {
        return res.status(403).json({
          message:
            'You are not allowed to update this application',
        })
      }

      const application =
        applicationResult.rows[0]

      const currentPaymentStatus =
        application.payment_details_status || 'Locked'

      // Student can edit only after admin requests details
      // or requests a correction.
      if (
        !STUDENT_EDITABLE_STATUSES.includes(
          currentPaymentStatus
        )
      ) {
        return res.status(403).json({
          message:
            `Payment details cannot be edited while the current status is ${currentPaymentStatus}`,
        })
      }

      const isCorrection =
        currentPaymentStatus === 'Correction Required'

      // A passbook/account-proof document is required
      // for the first submission.
      if (
        !req.file &&
        !application.passbook_url
      ) {
        return res.status(400).json({
          message:
            'Please upload a bank passbook or account proof document',
        })
      }

      let passbookUrl = null
      let passbookFileName = null

      if (req.file) {
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
        ]

        if (
          !allowedMimeTypes.includes(
            req.file.mimetype
          )
        ) {
          return res.status(400).json({
            message:
              'Only PDF, JPG and PNG files are allowed',
          })
        }

        const maximumFileSize =
          5 * 1024 * 1024

        if (req.file.size > maximumFileSize) {
          return res.status(400).json({
            message:
              'The passbook file must not exceed 5 MB',
          })
        }

        try {
          const extension =
            req.file.originalname
              .split('.')
              .pop()
              ?.toLowerCase() || 'file'

          const filePath =
            `payment/${application_id}/passbook_${Date.now()}.${extension}`

          passbookUrl = await uploadFile(
            'welfare-docs',
            filePath,
            req.file.buffer,
            req.file.mimetype
          )

          passbookFileName =
            req.file.originalname
        } catch (uploadError) {
          console.error(
            'Passbook upload failed:',
            uploadError
          )

          return res.status(500).json({
            message:
              'Failed to upload the passbook document',
          })
        }
      }

      const nextPaymentStatus =
        isCorrection
          ? 'Re-Submitted'
          : 'Submitted'

      const paymentResult = await query(
        `INSERT INTO payment_details (
           application_id,
           student_id,

           account_holder_name,
           bank_name,
           branch_name,
           account_number,
           account_type,
           contact_number,

           passbook_url,
           passbook_file_name,

           payment_details_status,
           payment_resubmission_count,

           updated_at
         )
         VALUES (
           $1,
           $2,

           $3,
           $4,
           $5,
           $6,
           $7,
           $8,

           $9,
           $10,

           $11,

           CASE
             WHEN $12 THEN 1
             ELSE 0
           END,

           NOW()
         )

         ON CONFLICT (application_id)

         DO UPDATE SET
           account_holder_name =
             EXCLUDED.account_holder_name,

           bank_name =
             EXCLUDED.bank_name,

           branch_name =
             EXCLUDED.branch_name,

           account_number =
             EXCLUDED.account_number,

           account_type =
             EXCLUDED.account_type,

           contact_number =
             EXCLUDED.contact_number,

           passbook_url =
             COALESCE(
               EXCLUDED.passbook_url,
               payment_details.passbook_url
             ),

           passbook_file_name =
             COALESCE(
               EXCLUDED.passbook_file_name,
               payment_details.passbook_file_name
             ),

           payment_details_status =
             EXCLUDED.payment_details_status,

           payment_resubmission_count =
             CASE
               WHEN $12 THEN
                 COALESCE(
                   payment_details.payment_resubmission_count,
                   0
                 ) + 1

               ELSE
                 COALESCE(
                   payment_details.payment_resubmission_count,
                   0
                 )
             END,

           resubmission_reason = NULL,
           admin_payment_comments = NULL,

           updated_at = NOW()

         RETURNING *`,
        [
          application_id,
          req.user.id,

          accountHolderName,
          bankName,
          branchName || null,
          accountNumber,
          accountType,
          contactNumber || null,

          passbookUrl,
          passbookFileName,

          nextPaymentStatus,
          isCorrection,
        ]
      )

      // Keep the application workflow synchronized.
      await query(
        `UPDATE applications
         SET
           status = 'Payment Details Submitted',
           updated_at = NOW()
         WHERE id = $1`,
        [application_id]
      )

      return res.status(201).json({
        message: isCorrection
          ? 'Payment details resubmitted successfully'
          : 'Payment details submitted successfully',

        payment_details:
          paymentResult.rows[0],
      })
    } catch (err) {
      console.error(
        'Student payment submission error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to submit payment details',
      })
    }
  }
)


// ─────────────────────────────────────────────────────────────
// POST /api/payment/:application_id/verify
//
// Admin verifies the student's submitted bank details.
// ─────────────────────────────────────────────────────────────
router.post(
  '/:application_id/verify',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { application_id } = req.params

      const adminComments =
        cleanText(req.body.admin_payment_comments)

      const checkResult = await query(
        `SELECT
           a.id,
           a.student_id,
           pd.payment_details_status

         FROM applications a

         JOIN payment_details pd
           ON pd.application_id = a.id

         WHERE a.id = $1`,
        [application_id]
      )

      if (!checkResult.rows.length) {
        return res.status(404).json({
          message:
            'Application payment details not found',
        })
      }

      const paymentDetails =
        checkResult.rows[0]

      if (
        !ADMIN_REVIEWABLE_STATUSES.includes(
          paymentDetails.payment_details_status
        )
      ) {
        return res.status(400).json({
          message:
            'Only submitted or re-submitted payment details can be verified',
        })
      }

      await query(
        `UPDATE payment_details
         SET
           payment_details_status =
             'Admin Verified',

           payment_verified_by = $1,

           payment_verified_date = NOW(),

           admin_payment_comments = $2,

           resubmission_reason = NULL,

           updated_at = NOW()

         WHERE application_id = $3`,
        [
          req.user.id,
          adminComments || null,
          application_id,
        ]
      )

      await query(
        `UPDATE applications
         SET
           status =
             'Payment Details Verified',

           updated_at = NOW()

         WHERE id = $1`,
        [application_id]
      )

      await query(
        `INSERT INTO notifications (
           user_id,
           type,
           title,
           message,
           link
         )
         VALUES (
           $1,
           'payment_verified',
           'Payment Details Verified',
           'Your bank details were verified by the admin. Your application is now ready for donor assignment.',
           '/student/applications'
         )`,
        [paymentDetails.student_id]
      )

      return res.json({
        message:
          'Payment details verified successfully',

        status:
          'Admin Verified',
      })
    } catch (err) {
      console.error(
        'Admin payment verification error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to verify payment details',
      })
    }
  }
)


// ─────────────────────────────────────────────────────────────
// POST /api/payment/:application_id/resubmit
//
// Admin requests correction from the student.
// ─────────────────────────────────────────────────────────────
router.post(
  '/:application_id/resubmit',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { application_id } = req.params

      const resubmissionReason =
        cleanText(req.body.resubmission_reason)

      const adminComments =
        cleanText(req.body.admin_payment_comments)

      if (!resubmissionReason) {
        return res.status(400).json({
          message:
            'Correction reason is required',
        })
      }

      const checkResult = await query(
        `SELECT
           a.id,
           a.student_id,
           pd.payment_details_status

         FROM applications a

         JOIN payment_details pd
           ON pd.application_id = a.id

         WHERE a.id = $1`,
        [application_id]
      )

      if (!checkResult.rows.length) {
        return res.status(404).json({
          message:
            'Application payment details not found',
        })
      }

      const paymentDetails =
        checkResult.rows[0]

      if (
        !ADMIN_REVIEWABLE_STATUSES.includes(
          paymentDetails.payment_details_status
        )
      ) {
        return res.status(400).json({
          message:
            'A correction can only be requested for submitted or re-submitted payment details',
        })
      }

      await query(
        `UPDATE payment_details
         SET
           payment_details_status =
             'Correction Required',

           resubmission_reason = $1,

           admin_payment_comments = $2,

           payment_verified_by = NULL,

           payment_verified_date = NULL,

           updated_at = NOW()

         WHERE application_id = $3`,
        [
          resubmissionReason,
          adminComments || null,
          application_id,
        ]
      )

      await query(
        `UPDATE applications
         SET
           status =
             'Payment Correction Required',

           updated_at = NOW()

         WHERE id = $1`,
        [application_id]
      )

      await query(
        `INSERT INTO notifications (
           user_id,
           type,
           title,
           message,
           link
         )
         VALUES (
           $1,
           'payment_correction_required',
           'Payment Details Require Correction',
           'The admin requested corrections to your bank details. Please review the instructions and submit the updated information.',
           $2
         )`,
        [
          paymentDetails.student_id,
          `/student/payment/${application_id}`,
        ]
      )

      return res.json({
        message:
          'Payment-detail correction requested successfully',

        status:
          'Correction Required',
      })
    } catch (err) {
      console.error(
        'Admin payment correction error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to request payment-detail correction',
      })
    }
  }
)

// ─────────────────────────────────────────────────────────────
// POST /api/payment/:application_id/process
//
// Donor starts processing an assigned scholarship payment.
// ─────────────────────────────────────────────────────────────
router.post(
  '/:application_id/process',
  authenticate,
  requireDonor,
  async (req, res) => {
    try {
      const { application_id } = req.params

      const donorComments =
        cleanText(req.body.donor_comments)

      // Confirm that:
      // 1. The application is assigned to this donor.
      // 2. The student's bank details were verified by admin.
      const assignmentResult = await query(
        `SELECT
           a.id AS application_id,
           a.student_id,
           a.status AS application_status,
           s.title AS scholarship_title,
           pd.payment_details_status

         FROM applications a

         JOIN donor_students ds
           ON ds.application_id = a.id

         JOIN scholarships s
           ON s.id = a.scholarship_id

         JOIN payment_details pd
           ON pd.application_id = a.id

         WHERE a.id = $1
           AND ds.donor_id = $2`,
        [
          application_id,
          req.user.id,
        ]
      )

      if (!assignmentResult.rows.length) {
        return res.status(403).json({
          message:
            'This application is not assigned to you',
        })
      }

      const assignment =
        assignmentResult.rows[0]

      if (
        assignment.payment_details_status !==
        'Admin Verified'
      ) {
        return res.status(400).json({
          message:
            'The student bank details have not been verified by the admin',
        })
      }

      const existingPaymentResult =
        await query(
          `SELECT payment_status
           FROM scholarship_payments
           WHERE application_id = $1
             AND donor_id = $2`,
          [
            application_id,
            req.user.id,
          ]
        )

      if (
        existingPaymentResult.rows[0]
          ?.payment_status === 'Paid'
      ) {
        return res.status(400).json({
          message:
            'This scholarship payment is already completed',
        })
      }

      const paymentResult = await query(
        `INSERT INTO scholarship_payments (
           application_id,
           donor_id,
           payment_status,
           donor_comments,
           failure_reason,
           updated_at
         )
         VALUES (
           $1,
           $2,
           'Processing',
           $3,
           NULL,
           NOW()
         )

         ON CONFLICT (application_id)

         DO UPDATE SET
           donor_id = EXCLUDED.donor_id,
           payment_status = 'Processing',
           donor_comments =
             EXCLUDED.donor_comments,
           failure_reason = NULL,
           updated_at = NOW()

         RETURNING *`,
        [
          application_id,
          req.user.id,
          donorComments || null,
        ]
      )

      await query(
        `UPDATE applications
         SET
           status = 'Payment Processing',
           updated_at = NOW()
         WHERE id = $1`,
        [application_id]
      )

      await query(
        `INSERT INTO notifications (
           user_id,
           type,
           title,
           message,
           link
         )
         VALUES (
           $1,
           'payment_processing',
           'Scholarship Payment Processing',
           $2,
           '/student/applications'
         )`,
        [
          assignment.student_id,
          `Your scholarship payment for ${assignment.scholarship_title} is now being processed.`,
        ]
      )

      return res.json({
        message:
          'Payment marked as processing',
        payment:
          paymentResult.rows[0],
      })
    } catch (err) {
      console.error(
        'Start scholarship payment error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to start payment processing',
      })
    }
  }
)


// ─────────────────────────────────────────────────────────────
// POST /api/payment/:application_id/hold
//
// Donor places a scholarship payment on hold.
// ─────────────────────────────────────────────────────────────
router.post(
  '/:application_id/hold',
  authenticate,
  requireDonor,
  async (req, res) => {
    try {
      const { application_id } = req.params

      const holdReason =
        cleanText(req.body.reason)

      const donorComments =
        cleanText(req.body.donor_comments)

      if (!holdReason) {
        return res.status(400).json({
          message:
            'A reason is required to place the payment on hold',
        })
      }

      const assignmentResult = await query(
        `SELECT
           a.student_id,
           s.title AS scholarship_title

         FROM donor_students ds

         JOIN applications a
           ON a.id = ds.application_id

         JOIN scholarships s
           ON s.id = a.scholarship_id

         JOIN payment_details pd
           ON pd.application_id = a.id

         WHERE ds.application_id = $1
           AND ds.donor_id = $2
           AND pd.payment_details_status =
             'Admin Verified'`,
        [
          application_id,
          req.user.id,
        ]
      )

      if (!assignmentResult.rows.length) {
        return res.status(403).json({
          message:
            'You cannot update this payment',
        })
      }

      const assignment =
        assignmentResult.rows[0]

      const existingPaymentResult =
        await query(
          `SELECT payment_status
           FROM scholarship_payments
           WHERE application_id = $1
             AND donor_id = $2`,
          [
            application_id,
            req.user.id,
          ]
        )

      if (
        existingPaymentResult.rows[0]
          ?.payment_status === 'Paid'
      ) {
        return res.status(400).json({
          message:
            'A completed payment cannot be placed on hold',
        })
      }

      const combinedComments = donorComments
        ? `Hold reason: ${holdReason}\n${donorComments}`
        : `Hold reason: ${holdReason}`

      const paymentResult = await query(
        `INSERT INTO scholarship_payments (
           application_id,
           donor_id,
           payment_status,
           donor_comments,
           failure_reason,
           updated_at
         )
         VALUES (
           $1,
           $2,
           'On Hold',
           $3,
           NULL,
           NOW()
         )

         ON CONFLICT (application_id)

         DO UPDATE SET
           donor_id = EXCLUDED.donor_id,
           payment_status = 'On Hold',
           donor_comments =
             EXCLUDED.donor_comments,
           failure_reason = NULL,
           updated_at = NOW()

         RETURNING *`,
        [
          application_id,
          req.user.id,
          combinedComments,
        ]
      )

      await query(
        `UPDATE applications
         SET
           status = 'Payment Processing',
           updated_at = NOW()
         WHERE id = $1`,
        [application_id]
      )

      await query(
        `INSERT INTO notifications (
           user_id,
           type,
           title,
           message,
           link
         )
         VALUES (
           $1,
           'payment_on_hold',
           'Scholarship Payment On Hold',
           $2,
           '/student/applications'
         )`,
        [
          assignment.student_id,
          `Your scholarship payment for ${assignment.scholarship_title} is temporarily on hold. Reason: ${holdReason}`,
        ]
      )

      return res.json({
        message:
          'Payment placed on hold',
        payment:
          paymentResult.rows[0],
      })
    } catch (err) {
      console.error(
        'Hold scholarship payment error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to place payment on hold',
      })
    }
  }
)


// ─────────────────────────────────────────────────────────────
// POST /api/payment/:application_id/fail
//
// Donor records a failed scholarship-payment attempt.
// ─────────────────────────────────────────────────────────────
router.post(
  '/:application_id/fail',
  authenticate,
  requireDonor,
  async (req, res) => {
    try {
      const { application_id } = req.params

      const failureReason =
        cleanText(req.body.failure_reason)

      const donorComments =
        cleanText(req.body.donor_comments)

      if (!failureReason) {
        return res.status(400).json({
          message:
            'A payment failure reason is required',
        })
      }

      const assignmentResult = await query(
        `SELECT
           a.student_id,
           s.title AS scholarship_title

         FROM donor_students ds

         JOIN applications a
           ON a.id = ds.application_id

         JOIN scholarships s
           ON s.id = a.scholarship_id

         JOIN payment_details pd
           ON pd.application_id = a.id

         WHERE ds.application_id = $1
           AND ds.donor_id = $2
           AND pd.payment_details_status =
             'Admin Verified'`,
        [
          application_id,
          req.user.id,
        ]
      )

      if (!assignmentResult.rows.length) {
        return res.status(403).json({
          message:
            'You cannot update this payment',
        })
      }

      const assignment =
        assignmentResult.rows[0]

      const existingPaymentResult =
        await query(
          `SELECT payment_status
           FROM scholarship_payments
           WHERE application_id = $1
             AND donor_id = $2`,
          [
            application_id,
            req.user.id,
          ]
        )

      if (
        existingPaymentResult.rows[0]
          ?.payment_status === 'Paid'
      ) {
        return res.status(400).json({
          message:
            'A completed payment cannot be marked as failed',
        })
      }

      const paymentResult = await query(
        `INSERT INTO scholarship_payments (
           application_id,
           donor_id,
           payment_status,
           donor_comments,
           failure_reason,
           updated_at
         )
         VALUES (
           $1,
           $2,
           'Failed',
           $3,
           $4,
           NOW()
         )

         ON CONFLICT (application_id)

         DO UPDATE SET
           donor_id = EXCLUDED.donor_id,
           payment_status = 'Failed',
           donor_comments =
             EXCLUDED.donor_comments,
           failure_reason =
             EXCLUDED.failure_reason,
           updated_at = NOW()

         RETURNING *`,
        [
          application_id,
          req.user.id,
          donorComments || null,
          failureReason,
        ]
      )

      // Keep the student assigned to the donor so the donor can retry.
      await query(
        `UPDATE applications
         SET
           status = 'Assigned to Donor',
           updated_at = NOW()
         WHERE id = $1`,
        [application_id]
      )

      await query(
        `INSERT INTO notifications (
           user_id,
           type,
           title,
           message,
           link
         )
         VALUES (
           $1,
           'payment_failed',
           'Scholarship Payment Failed',
           $2,
           '/student/applications'
         )`,
        [
          assignment.student_id,
          `The payment attempt for ${assignment.scholarship_title} was unsuccessful. Reason: ${failureReason}`,
        ]
      )

      return res.json({
        message:
          'Payment marked as failed',
        payment:
          paymentResult.rows[0],
      })
    } catch (err) {
      console.error(
        'Fail scholarship payment error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to update payment status',
      })
    }
  }
)


// ─────────────────────────────────────────────────────────────
// POST /api/payment/:application_id/complete
//
// Donor records a completed scholarship payment.
// Expected multipart field name: receipt
// ─────────────────────────────────────────────────────────────
router.post(
  '/:application_id/complete',
  authenticate,
  requireDonor,
  upload.single('receipt'),
  async (req, res) => {
    try {
      const { application_id } = req.params

      const amount =
        Number.parseFloat(req.body.amount)

      const transactionReference =
        cleanText(
          req.body.transaction_reference
        )

      const paymentDate =
        cleanText(req.body.payment_date)

      const donorComments =
        cleanText(req.body.donor_comments)

      if (
        Number.isNaN(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          message:
            'A valid payment amount is required',
        })
      }

      if (!transactionReference) {
        return res.status(400).json({
          message:
            'Transaction reference is required',
        })
      }

      if (!paymentDate) {
        return res.status(400).json({
          message:
            'Payment date is required',
        })
      }

      const parsedPaymentDate =
        new Date(paymentDate)

      if (
        Number.isNaN(
          parsedPaymentDate.getTime()
        )
      ) {
        return res.status(400).json({
          message:
            'Invalid payment date',
        })
      }

      if (!req.file) {
        return res.status(400).json({
          message:
            'Payment receipt is required',
        })
      }

      const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
      ]

      if (
        !allowedMimeTypes.includes(
          req.file.mimetype
        )
      ) {
        return res.status(400).json({
          message:
            'Only PDF, JPG and PNG receipt files are allowed',
        })
      }

      if (
        req.file.size >
        5 * 1024 * 1024
      ) {
        return res.status(400).json({
          message:
            'The payment receipt must not exceed 5 MB',
        })
      }

      const assignmentResult = await query(
        `SELECT
           a.student_id,
           a.status AS application_status,
           s.title AS scholarship_title,
           pd.payment_details_status

         FROM donor_students ds

         JOIN applications a
           ON a.id = ds.application_id

         JOIN scholarships s
           ON s.id = a.scholarship_id

         JOIN payment_details pd
           ON pd.application_id = a.id

         WHERE ds.application_id = $1
           AND ds.donor_id = $2`,
        [
          application_id,
          req.user.id,
        ]
      )

      if (!assignmentResult.rows.length) {
        return res.status(403).json({
          message:
            'This application is not assigned to you',
        })
      }

      const assignment =
        assignmentResult.rows[0]

      if (
        assignment.payment_details_status !==
        'Admin Verified'
      ) {
        return res.status(400).json({
          message:
            'The student bank details have not been verified by the admin',
        })
      }

      const existingPaymentResult =
        await query(
          `SELECT payment_status
           FROM scholarship_payments
           WHERE application_id = $1
             AND donor_id = $2`,
          [
            application_id,
            req.user.id,
          ]
        )

      if (
        existingPaymentResult.rows[0]
          ?.payment_status === 'Paid'
      ) {
        return res.status(400).json({
          message:
            'This scholarship payment is already completed',
        })
      }

      let receiptUrl
      let receiptFileName

      try {
        const extension =
          req.file.originalname
            .split('.')
            .pop()
            ?.toLowerCase() || 'file'

        const filePath =
          `payments/${application_id}/receipt_${Date.now()}.${extension}`

        receiptUrl = await uploadFile(
          'welfare-docs',
          filePath,
          req.file.buffer,
          req.file.mimetype
        )

        receiptFileName =
          req.file.originalname
      } catch (uploadError) {
        console.error(
          'Payment receipt upload failed:',
          uploadError
        )

        return res.status(500).json({
          message:
            'Failed to upload the payment receipt',
        })
      }

      const paymentResult = await query(
        `INSERT INTO scholarship_payments (
           application_id,
           donor_id,
           amount,
           payment_status,
           transaction_reference,
           payment_date,
           receipt_url,
           receipt_file_name,
           donor_comments,
           failure_reason,
           updated_at
         )
         VALUES (
           $1,
           $2,
           $3,
           'Paid',
           $4,
           $5,
           $6,
           $7,
           $8,
           NULL,
           NOW()
         )

         ON CONFLICT (application_id)

         DO UPDATE SET
           donor_id =
             EXCLUDED.donor_id,
           amount =
             EXCLUDED.amount,
           payment_status = 'Paid',
           transaction_reference =
             EXCLUDED.transaction_reference,
           payment_date =
             EXCLUDED.payment_date,
           receipt_url =
             EXCLUDED.receipt_url,
           receipt_file_name =
             EXCLUDED.receipt_file_name,
           donor_comments =
             EXCLUDED.donor_comments,
           failure_reason = NULL,
           updated_at = NOW()

         RETURNING *`,
        [
          application_id,
          req.user.id,
          amount,
          transactionReference,
          parsedPaymentDate,
          receiptUrl,
          receiptFileName,
          donorComments || null,
        ]
      )

      await query(
        `UPDATE applications
         SET
           status = 'Completed',
           updated_at = NOW()
         WHERE id = $1`,
        [application_id]
      )

      await query(
        `INSERT INTO notifications (
           user_id,
           type,
           title,
           message,
           link
         )
         VALUES (
           $1,
           'payment_completed',
           'Scholarship Payment Completed',
           $2,
           '/student/applications'
         )`,
        [
          assignment.student_id,
          `Your scholarship payment of LKR ${amount.toLocaleString()} for ${assignment.scholarship_title} has been completed. Transaction reference: ${transactionReference}.`,
        ]
      )

      return res.json({
        message:
          'Scholarship payment recorded successfully',
        payment:
          paymentResult.rows[0],
      })
    } catch (err) {
      console.error(
        'Complete scholarship payment error:',
        err
      )

      return res.status(500).json({
        message:
          err.message ||
          'Failed to complete scholarship payment',
      })
    }
  }
)
export default router