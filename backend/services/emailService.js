/**
 * emailService.js
 *
 * Provider priority:
 *   1. Resend  (RESEND_API_KEY is set)          → real delivery
 *   2. SMTP    (SMTP_HOST + SMTP_USER + SMTP_PASS) → real delivery via nodemailer
 *   3. Console logger                            → dev-only mock, no real delivery
 *
 * Returns: { success: boolean, provider: string, messageId?: string, error?: string }
 */

import nodemailer from 'nodemailer'
import { query } from '../config/db.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getFromAddress() {
  const name    = process.env.EMAIL_FROM_NAME    || 'Pera Com SWMS'
  const address = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev'
  return `"${name}" <${address}>`
}

// ── Provider: Resend ─────────────────────────────────────────────────────────

async function sendViaResend({ to, subject, text }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')

  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev'
  const fromName    = process.env.EMAIL_FROM_NAME    || 'Pera Com SWMS'

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    `${fromName} <${fromAddress}>`,
      to:      [to],
      subject: subject,
      text:    text,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    // Resend returns { name, message, statusCode } on error
    const msg = data?.message || data?.name || `HTTP ${response.status}`
    throw new Error(`Resend API error: ${msg}`)
  }

  return data?.id || 'sent'
}

// ── Provider: SMTP (Nodemailer) ───────────────────────────────────────────────

async function sendViaSMTP({ to, subject, text }) {
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const info = await transporter.sendMail({
    from:    getFromAddress(),
    to:      to,
    subject: subject,
    text:    text,
  })

  return info.messageId
}

// ── Main Export ───────────────────────────────────────────────────────────────

/**
 * Send an email and log the result to email_logs.
 *
 * @param {object} opts
 * @param {string}  opts.recipientEmail
 * @param {string}  opts.subject
 * @param {string}  opts.body              – plain-text body
 * @param {string}  opts.emailType         – e.g. 'Approval_Donor'
 * @param {string} [opts.scholarshipRequestId]
 *
 * @returns {{ success: boolean, provider: string, messageId?: string, error?: string }}
 */
export async function sendEmail({ recipientEmail, subject, body, emailType, scholarshipRequestId }) {
  // Guard: skip if no recipient
  if (!recipientEmail || !recipientEmail.trim()) {
    const err = 'Recipient email is empty or null — email skipped'
    console.warn(`⚠️  ${err}`)
    await logEmail({ recipientEmail: recipientEmail || '(empty)', subject, emailType, scholarshipRequestId, status: 'Failed', errorMessage: err })
    return { success: false, provider: 'none', error: err }
  }

  const hasResend = !!process.env.RESEND_API_KEY
  const hasSMTP   = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

  let provider   = 'console'
  let messageId  = null
  let errorMsg   = null
  let status     = 'Failed'

  try {
    if (hasResend) {
      provider  = 'Resend'
      messageId = await sendViaResend({ to: recipientEmail, subject, text: body })
      status    = 'Sent'
      console.log(`✅ [Resend] Email sent → ${recipientEmail} | Subject: "${subject}" | ID: ${messageId}`)

    } else if (hasSMTP) {
      provider  = 'SMTP'
      messageId = await sendViaSMTP({ to: recipientEmail, subject, text: body })
      status    = 'Sent'
      console.log(`✅ [SMTP] Email sent → ${recipientEmail} | Subject: "${subject}" | ID: ${messageId}`)

    } else {
      // Dev console fallback — no real delivery
      provider = 'console'
      status   = 'Mock'
      console.log(`
============================================================
📧  MOCK EMAIL (no provider configured)
============================================================
To:      ${recipientEmail}
Subject: ${subject}
Type:    ${emailType}
------------------------------------------------------------
${body}
============================================================
`)
    }
  } catch (err) {
    errorMsg = err.message
    status   = 'Failed'
    console.error(`❌ [${provider}] Email FAILED → ${recipientEmail} | Subject: "${subject}"`)
    console.error(`   Error: ${errorMsg}`)
  }

  // Log every attempt to the database
  await logEmail({ recipientEmail, subject, emailType, scholarshipRequestId, status, errorMessage: errorMsg })

  if (status === 'Failed') {
    return { success: false, provider, error: errorMsg }
  }
  return { success: true, provider, messageId }
}

// ── DB Logger ─────────────────────────────────────────────────────────────────

async function logEmail({ recipientEmail, subject, emailType, scholarshipRequestId, status, errorMessage }) {
  try {
    await query(
      `INSERT INTO email_logs
         (recipient_email, scholarship_request_id, email_type, delivery_status, subject, error_message, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        recipientEmail,
        scholarshipRequestId || null,
        emailType,
        status,
        subject || null,
        errorMessage || null,
      ]
    )
  } catch (dbErr) {
    // If email_logs is missing new columns, log a helpful message
    console.warn('⚠️  Could not write to email_logs:', dbErr.message)
    console.warn('   Run the SQL migration to add subject/error_message/sent_at columns.')
  }
}

// ── Health Check ──────────────────────────────────────────────────────────────

/**
 * Returns the active email provider configuration status.
 * Used by GET /api/admin/email-health
 */
export function getEmailProviderStatus() {
  const hasResend = !!process.env.RESEND_API_KEY
  const hasSMTP   = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

  if (hasResend) {
    return {
      provider:    'Resend',
      configured:  true,
      fromAddress: process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev',
      fromName:    process.env.EMAIL_FROM_NAME    || 'Pera Com SWMS',
      warning:     null,
    }
  }

  if (hasSMTP) {
    return {
      provider:    'SMTP',
      configured:  true,
      fromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@pdn.ac.lk',
      fromName:    process.env.EMAIL_FROM_NAME    || 'Pera Com SWMS',
      warning:     null,
    }
  }

  return {
    provider:    'none',
    configured:  false,
    fromAddress: null,
    fromName:    null,
    warning:     'No email provider configured. Set RESEND_API_KEY in .env to enable real email delivery.',
  }
}
