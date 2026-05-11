import { supabaseAdmin } from '../config/supabaseClient.js'

function safeJsonParse(value, fallback = []) {
  if (!value) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeDocumentUrls(value) {
  // Converts various JSONB/string forms into the flat dict used by the UI: {id_card_url: '...', ...}
  let docArr = Array.isArray(value) ? value : []

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    // Could already be { id_card_url: '...', ... }
    // If it looks like the flat dict, return it as-is.
    const keys = Object.keys(value)
    const looksFlat = keys.some((k) => k.endsWith('_url'))
    if (looksFlat) return value

    // Otherwise wrap single object
    docArr = [value]
  } else if (typeof value === 'string') {
    try {
      docArr = JSON.parse(value)
    } catch {
      docArr = []
    }
  }

  if (Array.isArray(docArr)) {
    docArr = docArr
      .map((doc) => {
        if (typeof doc === 'string') {
          try {
            return JSON.parse(doc)
          } catch {
            return null
          }
        }
        return doc
      })
      .filter(Boolean)
  }

  const docs = {}
  docArr.flat(Infinity).forEach((doc) => {
    if (doc && doc.type && doc.url) {
      docs[`${doc.type}_url`] = doc.url
    }
  })

  return Object.keys(docs).length > 0 ? docs : docArr
}

const UPLOAD_DOC_TYPES = ['id_card', 'income_certificate', 'bank_account']
const DOC_URL_KEYS = {
  id_card: 'id_card_url',
  income_certificate: 'income_certificate_url',
  bank_account: 'bank_account_url'
}

export async function resubmitApplication(req, res) {
  try {
    const studentId = req.user.id
    const { applicationId } = req.params

    if (!applicationId) {
      return res.status(400).json({ error: 'applicationId is required.' })
    }

    // Load current application
    const { data: app, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('student_id', studentId)
      .single()

    if (fetchError || !app) {
      return res.status(404).json({ error: 'Application not found.' })
    }

    if (app.status !== 'rejected') {
      return res.status(400).json({ error: `Cannot resubmit when status is ${app.status}.` })
    }

    const currentCount = app.resubmission_count || 0
    const maxResub = 3
    if (currentCount >= maxResub) {
      return res.status(400).json({ error: `Maximum resubmissions (${maxResub}) reached.` })
    }

    const files = req.files || {}

    // If student didn’t upload anything, reject.
    const uploadedTypes = UPLOAD_DOC_TYPES.filter((t) => files[t]?.[0])
    if (uploadedTypes.length === 0) {
      return res.status(400).json({ error: 'No document files uploaded for resubmission.' })
    }

    // Current docs
    const currentDocsFlat = normalizeDocumentUrls(app.document_urls)

    // Upload replacements
    const newDocsFlat = { ...currentDocsFlat }

    for (const type of uploadedTypes) {
      const file = files[type]?.[0]
      if (!file) continue

      const fileExt = (file.originalname || '').split('.').pop() || 'pdf'
      const fileName = `${Date.now()}_${type}.${fileExt}`
      const filePath = `applications/${studentId}/${app.scholarship_id}/${fileName}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('documents')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        })

      if (uploadError) {
        return res.status(500).json({ error: 'File upload failed: ' + uploadError.message })
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('documents')
        .getPublicUrl(filePath)

      newDocsFlat[DOC_URL_KEYS[type]] = urlData.publicUrl
    }

    // Update history
    const historyArr = Array.isArray(app.history) ? [...app.history] : []
    historyArr.push({
      action: 'resubmitted',
      by: studentId,
      at: new Date().toISOString(),
      resubmitted_documents: uploadedTypes
    })

    // Store in a format that existing UI expects.
    // Your UI reads document_urls as flat keys (id_card_url...), so keep that.
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        status: 'pending', // Changed from 'resubmitted'
        resubmission_count: currentCount + 1,
        rejection_reason: null,
        document_urls: Object.entries(newDocsFlat).map(([key, value]) => ({
          type: key.replace('_url', ''),
          url: value
        })),
        history: historyArr
      })
      .eq('id', applicationId)
      .select() // Use select() to get the updated record
      .single()

    if (updateError || !updated) {
      return res.status(500).json({ error: 'Failed to resubmit application.' })
    }

    return res.status(200).json({
      message: 'Application resubmitted successfully.',
      application: updated
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to resubmit application: ' + (err?.message || 'Unexpected error') })
  }
}

