/**
 * emailService.js
 *
 * Provider priority:
 * 1. Resend when RESEND_API_KEY is configured
 * 2. SMTP/Nodemailer when SMTP settings are configured
 * 3. Console mock when no provider is configured
 */

import nodemailer from 'nodemailer'
import { query } from '../config/db.js'

// ============================================================
// HELPERS
// ============================================================

function getFromAddress() {
  const name =
    process.env.EMAIL_FROM_NAME || 'PeraCom SWMS'

  const address =
    process.env.EMAIL_FROM_ADDRESS ||
    process.env.SMTP_USER ||
    'no-reply@pdn.ac.lk'

  return `"${name}" <${address}>`
}

// ============================================================
// RESEND PROVIDER
// ============================================================

async function sendViaResend({
  to,
  subject,
  text,
  html
}) {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const fromAddress =
    process.env.EMAIL_FROM_ADDRESS ||
    'onboarding@resend.dev'

  const fromName =
    process.env.EMAIL_FROM_NAME ||
    'PeraCom SWMS'

  const response = await fetch(
    'https://api.resend.com/emails',
    {
      method: 'POST',

      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        from: `${fromName} <${fromAddress}>`,
        to: [to],
        subject,
        text,
        html
      })
    }
  )

  const data = await response.json()

  if (!response.ok) {
    const message =
      data?.message ||
      data?.name ||
      `HTTP ${response.status}`

    throw new Error(
      `Resend API error: ${message}`
    )
  }

  return data?.id || 'sent'
}

// ============================================================
// SMTP / NODEMAILER PROVIDER
// ============================================================

async function sendViaSMTP({
  to,
  subject,
  text,
  html
}) {
  const port = Number(
    process.env.SMTP_PORT || 587
  )

  const transporter =
    nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,

      // Port 465 normally uses secure=true.
      // Port 587 normally uses secure=false with STARTTLS.
      secure:
        process.env.SMTP_SECURE === 'true',

      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

  const info = await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html
  })

  return info.messageId
}

// ============================================================
// MAIN EMAIL FUNCTION
// ============================================================

/**
 * Send an email and log the result.
 *
 * @param {object} options
 * @param {string} options.recipientEmail
 * @param {string} options.subject
 * @param {string} options.body
 * @param {string} [options.html]
 * @param {string} options.emailType
 * @param {string} [options.scholarshipRequestId]
 */
export async function sendEmail({
  recipientEmail,
  subject,
  body,
  html,
  emailType,
  scholarshipRequestId
}) {
  const normalizedRecipient =
    recipientEmail
      ? String(recipientEmail).trim()
      : ''

  if (!normalizedRecipient) {
    const errorMessage =
      'Recipient email is empty — email skipped'

    console.warn(`⚠️ ${errorMessage}`)

    await logEmail({
      recipientEmail: '(empty)',
      subject,
      emailType,
      scholarshipRequestId,
      status: 'Failed',
      errorMessage
    })

    return {
      success: false,
      provider: 'none',
      error: errorMessage
    }
  }

  const hasResend =
    Boolean(process.env.RESEND_API_KEY)

  const hasSMTP =
    Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    )

  let provider = 'none'
  let messageId = null
  let errorMessage = null
  let deliveryStatus = 'Failed'

  try {
    if (hasResend) {
      provider = 'Resend'

      messageId = await sendViaResend({
        to: normalizedRecipient,
        subject,
        text: body,
        html
      })

      deliveryStatus = 'Sent'

      console.log(
        `✅ [Resend] Email sent → ${normalizedRecipient} | ` +
        `Subject: "${subject}" | ID: ${messageId}`
      )
    } else if (hasSMTP) {
      provider = 'SMTP'

      messageId = await sendViaSMTP({
        to: normalizedRecipient,
        subject,
        text: body,
        html
      })

      deliveryStatus = 'Sent'

      console.log(
        `✅ [SMTP] Email sent → ${normalizedRecipient} | ` +
        `Subject: "${subject}" | ID: ${messageId}`
      )
    } else {
      provider = 'console'
      deliveryStatus = 'Mock'

      console.log(`
============================================================
📧 MOCK EMAIL — NO REAL PROVIDER CONFIGURED
============================================================
To:      ${normalizedRecipient}
Subject: ${subject}
Type:    ${emailType}
------------------------------------------------------------
${body}
============================================================
      `)
    }
  } catch (err) {
    errorMessage =
      err instanceof Error
        ? err.message
        : String(err)

    deliveryStatus = 'Failed'

    console.error(
      `❌ [${provider}] Email failed → ` +
      `${normalizedRecipient} | Subject: "${subject}"`
    )

    console.error(`Error: ${errorMessage}`)
  }

  await logEmail({
    recipientEmail: normalizedRecipient,
    subject,
    emailType,
    scholarshipRequestId,
    status: deliveryStatus,
    errorMessage
  })

  if (deliveryStatus === 'Failed') {
    return {
      success: false,
      provider,
      error: errorMessage
    }
  }

  // Mock mode does not deliver a real email.
  if (deliveryStatus === 'Mock') {
    return {
      success: false,
      provider,
      error:
        'No real email provider is configured'
    }
  }

  return {
    success: true,
    provider,
    messageId
  }
}

// ============================================================
// EMAIL DATABASE LOG
// ============================================================

async function logEmail({
  recipientEmail,
  subject,
  emailType,
  scholarshipRequestId,
  status,
  errorMessage
}) {
  try {
    await query(
      `INSERT INTO email_logs (
         recipient_email,
         scholarship_request_id,
         email_type,
         delivery_status,
         subject,
         error_message,
         sent_at
       )
       VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         $6,
         NOW()
       )`,
      [
        recipientEmail,
        scholarshipRequestId || null,
        emailType || 'General',
        status,
        subject || null,
        errorMessage || null
      ]
    )
  } catch (dbError) {
    console.warn(
      '⚠️ Could not write to email_logs:',
      dbError.message
    )
  }
}

// ============================================================
// EMAIL PROVIDER HEALTH
// ============================================================

export function getEmailProviderStatus() {
  const hasResend =
    Boolean(process.env.RESEND_API_KEY)

  const hasSMTP =
    Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    )

  if (hasResend) {
    return {
      provider: 'Resend',
      configured: true,

      fromAddress:
        process.env.EMAIL_FROM_ADDRESS ||
        'onboarding@resend.dev',

      fromName:
        process.env.EMAIL_FROM_NAME ||
        'PeraCom SWMS',

      warning: null
    }
  }

  if (hasSMTP) {
    return {
      provider: 'SMTP',
      configured: true,

      fromAddress:
        process.env.EMAIL_FROM_ADDRESS ||
        process.env.SMTP_USER,

      fromName:
        process.env.EMAIL_FROM_NAME ||
        'PeraCom SWMS',

      warning: null
    }
  }

  return {
    provider: 'none',
    configured: false,
    fromAddress: null,
    fromName: null,

    warning:
      'No email provider is configured. Add SMTP settings or RESEND_API_KEY to backend/.env.'
  }
}