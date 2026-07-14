import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

import { query } from '../config/db.js'
import { sendEmail } from '../services/emailService.js'

const router = express.Router()

// Create login token
const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  )

// Create a secure email-verification token
const createVerificationDetails = () => {
  const verificationToken = crypto
    .randomBytes(32)
    .toString('hex')

  const verificationTokenHash = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex')

  const verificationExpires = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  )

  return {
    verificationToken,
    verificationTokenHash,
    verificationExpires
  }
}

// Escape user-entered text before placing it inside an HTML email.
const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

// Send the email-verification message
const sendVerificationEmail = async ({
  name,
  email,
  verificationToken
}) => {
  const frontendUrl =
    process.env.FRONTEND_URL || 'http://localhost:5173'

  const verificationLink =
    `${frontendUrl}/verify-email?token=${verificationToken}`

  const safeName = escapeHtml(name)
  const safeVerificationLink = escapeHtml(verificationLink)

  console.log('📨 About to send verification email to:', email)
  console.log('🔗 Verification link:', verificationLink)

  const emailResult = await sendEmail({
    recipientEmail: email,
    subject: 'Verify your PeraCom SWMS email address',
    body: `
Hello ${name},

Thank you for registering with the PeraCom Student Welfare Management System.

Please verify your email address by opening this link:

${verificationLink}

This verification link expires in 24 hours.

After verifying your email, please wait for administrator approval.

If you did not create this account, you can ignore this email.

PeraCom Student Welfare Management System
University of Peradeniya
    `.trim(),

    html: `
      <!doctype html>
      <html lang="en">
        <body style="margin:0;padding:0;background:#f5f3ff;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
          <div style="padding:32px 16px;">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e9d5ff;border-radius:16px;padding:32px;box-sizing:border-box;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="width:54px;height:54px;line-height:54px;margin:0 auto 12px;border-radius:50%;background:#7c3aed;color:#ffffff;font-size:18px;font-weight:bold;">UP</div>
                <h1 style="margin:0;color:#6d28d9;font-size:22px;">PeraCom SWMS</h1>
                <p style="margin:6px 0 0;color:#64748b;font-size:13px;">University of Peradeniya</p>
              </div>

              <h2 style="margin:0 0 16px;font-size:20px;">Verify your email address</h2>
              <p style="font-size:15px;line-height:1.6;color:#475569;">Hello ${safeName},</p>
              <p style="font-size:15px;line-height:1.6;color:#475569;">
                Thank you for registering with the PeraCom Student Welfare Management System.
                Click the button below to verify your email address.
              </p>

              <div style="text-align:center;margin:28px 0;">
                <a href="${safeVerificationLink}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 28px;border-radius:10px;">
                  Verify Email Address
                </a>
              </div>

              <p style="font-size:13px;line-height:1.6;color:#64748b;">
                This link expires in 24 hours. After verification, please wait for administrator approval.
              </p>
              <p style="font-size:13px;line-height:1.6;color:#64748b;">
                If you did not create this account, you can ignore this email.
              </p>

              <div style="margin-top:22px;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                <p style="margin:0 0 8px;color:#64748b;font-size:12px;">If the button does not work, copy this URL into your browser:</p>
                <p style="margin:0;color:#7c3aed;font-size:11px;line-height:1.5;word-break:break-all;">${safeVerificationLink}</p>
              </div>

              <hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0 18px;">
              <p style="margin:0;text-align:center;color:#94a3b8;font-size:12px;">PeraCom Student Welfare Management System</p>
            </div>
          </div>
        </body>
      </html>
    `,

    emailType: 'Email_Verification'
  })

  console.log('📧 Email result:', emailResult)

  return emailResult
}

// ============================================================
// GET ACTIVE BATCHES
// ============================================================

// GET /api/auth/batches
router.get('/batches', async (req, res) => {
  try {
    const result = await query(
      `SELECT batch_name
       FROM batches
       WHERE status = 'Active'
       ORDER BY batch_name`
    )

    res.json(result.rows)
  } catch (err) {
    console.error('Load batches error:', err)

    res.status(500).json({
      message: 'Unable to load batches'
    })
  }
})

// ============================================================
// VERIFY EMAIL
// ============================================================

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        message: 'Verification token is required'
      })
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    const result = await query(
      `UPDATE users
       SET email_verified = TRUE,
           email_verified_at = NOW(),
           email_verification_token = NULL,
           email_verification_expires = NULL,
           updated_at = NOW()
       WHERE email_verification_token = $1
         AND email_verification_expires > NOW()
         AND email_verified = FALSE
       RETURNING
         id,
         name,
         email,
         role,
         status,
         email_verified`,
      [tokenHash]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({
        message:
          'This verification link is invalid, expired, or already used'
      })
    }

    res.json({
      message:
        'Email verified successfully. Please wait for admin approval.',
      user: result.rows[0]
    })
  } catch (err) {
    console.error('Email verification error:', err)

    res.status(500).json({
      message: 'Unable to verify email'
    })
  }
})

// ============================================================
// LOGIN
// ============================================================

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password required'
      })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [normalizedEmail]
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    )

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    if (!user.email_verified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in'
      })
    }

    if (user.status === 'pending_approval') {
      return res.status(403).json({
        message:
          'Your email is verified, but your account is awaiting admin approval'
      })
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        message:
          'Your registration was rejected. Please contact the administrator'
      })
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        message:
          'Your account is suspended. Please contact the administrator'
      })
    }

    if (user.status !== 'approved') {
      return res.status(403).json({
        message: 'Your account is not approved'
      })
    }

    const token = signToken(user)

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    })
  } catch (err) {
    console.error('Login error:', err)

    res.status(500).json({
      message: 'Server error'
    })
  }
})

// ============================================================
// STUDENT REGISTRATION
// ============================================================

// POST /api/auth/register/student
router.post('/register/student', async (req, res) => {
  try {
    console.log(
      '🟣 Student registration request received:',
      req.body.email
    )

    const {
      name,
      email,
      password,
      phone,
      batch,
      registration_number
    } = req.body

    if (
  !name ||
  !email ||
  !password ||
  !phone ||
  !batch ||
  !registration_number
) {
  return res.status(400).json({
    message:
      'Name, email, password, phone number, batch, and registration number are required'
  })
}

    // Validate Sri Lankan mobile number
    const sriLankanPhonePattern = /^07\d{8}$/

    if (!sriLankanPhonePattern.test(phone)) {
      return res.status(400).json({
        message:
          'Phone number must contain 10 digits and start with 07'
      })
    }
    // Validate student registration number
const registrationNumberPattern = /^E\d{5}$/

const normalizedRegistrationNumber =
  registration_number.trim().toUpperCase()

if (
  !registrationNumberPattern.test(
    normalizedRegistrationNumber
  )
) {
  return res.status(400).json({
    message:
      'Registration number must be in the format E23040'
  })
}

    // Validate active batch
    const batchResult = await query(
      `SELECT id
       FROM batches
       WHERE batch_name = $1
         AND status = 'Active'`,
      [String(batch)]
    )

    if (batchResult.rows.length === 0) {
      return res.status(400).json({
        message: 'Please select a valid active batch'
      })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check duplicate email
    const exists = await query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    )

    if (exists.rows.length > 0) {
      console.log('🟠 Registration stopped: email already registered')

      return res.status(409).json({
        message: 'Email already registered'
      })
    }
    // Check duplicate student registration number
const registrationExists = await query(
  `SELECT id
   FROM users
   WHERE UPPER(registration_number) = $1`,
  [normalizedRegistrationNumber]
)

if (registrationExists.rows.length > 0) {
  return res.status(409).json({
    message: 'Registration number is already registered'
  })
}
    const passwordHash = await bcrypt.hash(password, 12)

    const {
      verificationToken,
      verificationTokenHash,
      verificationExpires
    } = createVerificationDetails()

    const department = 'Computer Engineering'

    const result = await query(
      `INSERT INTO users (
         name,
         email,
         password_hash,
         role,
         status,
         phone,
         department,
         batch,
         registration_number,
         email_verified,
         email_verification_token,
         email_verification_expires
       )
       VALUES (
         $1,
         $2,
         $3,
         'student',
         'pending_approval',
         $4,
         $5,
         $6,
         $7,
         FALSE,
         $8,
         $9
       )
       RETURNING
         id,
         name,
         email,
         role,
         status,
         email_verified`,
      [
        name.trim(),
        normalizedEmail,
        passwordHash,
        phone.trim(),
        department,
        String(batch),
        normalizedRegistrationNumber,
        verificationTokenHash,
        verificationExpires
      ]
    )

    // Send email before returning the response
    const emailResult = await sendVerificationEmail({
      name: name.trim(),
      email: normalizedEmail,
      verificationToken
    })

    if (!emailResult.success) {
      return res.status(201).json({
        message:
          'Account created, but the verification email could not be delivered.',
        emailSent: false,
        user: result.rows[0]
      })
    }

    return res.status(201).json({
      message:
        'Registration successful. Please check your email and verify your account.',
      emailSent: true,
      user: result.rows[0]
    })
  } catch (err) {
    console.error('Student registration error:', err)

    res.status(500).json({
      message: 'Server error'
    })
  }
})

// ============================================================
// DONOR REGISTRATION
// ============================================================

// POST /api/auth/register/donor
router.post('/register/donor', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      organization,
      address
    } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email, and password required'
      })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const exists = await query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    )

    if (exists.rows.length > 0) {
      return res.status(409).json({
        message: 'Email already registered'
      })
    }
   
    const passwordHash = await bcrypt.hash(password, 12)

    const {
      verificationToken,
      verificationTokenHash,
      verificationExpires
    } = createVerificationDetails()

    const result = await query(
      `INSERT INTO users (
         name,
         email,
         password_hash,
         role,
         status,
         phone,
         organization,
         address,
         email_verified,
         email_verification_token,
         email_verification_expires
       )
       VALUES (
         $1,
         $2,
         $3,
         'donor',
         'pending_approval',
         $4,
         $5,
         $6,
         FALSE,
         $7,
         $8
       )
       RETURNING
         id,
         name,
         email,
         role,
         status,
         email_verified`,
      [
        name.trim(),
        normalizedEmail,
        passwordHash,
        phone?.trim() || null,
        organization?.trim() || null,
        address?.trim() || null,
        verificationTokenHash,
        verificationExpires
      ]
    )

    const emailResult = await sendVerificationEmail({
      name: name.trim(),
      email: normalizedEmail,
      verificationToken
    })

    if (!emailResult.success) {
      return res.status(201).json({
        message:
          'Account created, but the verification email could not be delivered.',
        emailSent: false,
        user: result.rows[0]
      })
    }

    return res.status(201).json({
      message:
        'Registration successful. Please check your email and verify your account.',
      emailSent: true,
      user: result.rows[0]
    })
  } catch (err) {
    console.error('Donor registration error:', err)

    res.status(500).json({
      message: 'Server error'
    })
  }
})

// ============================================================
// FORGOT PASSWORD
// ============================================================

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  // Password-reset implementation will be added separately.
  res.json({
    message:
      'If that email exists, a reset link has been sent.'
  })
})

export default router