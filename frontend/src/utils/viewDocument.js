/**
 * Open a document in a new browser tab.
 *
 * Handles three cases:
 * 1. Supabase / CDN URL  → routed through Google Docs Viewer for PDFs/Office files
 * 2. Base64 data URL     → decoded to a Blob URL and opened directly (works offline)
 * 3. Image URL           → opened directly (no Google Docs wrapper needed)
 */
export function viewDocument(fileUrl) {
  if (!fileUrl) return

  // Base64 data URL — decode and open as blob
  if (fileUrl.startsWith('data:')) {
    try {
      const [meta, base64] = fileUrl.split(',')
      const mimeType = meta.match(/data:([^;]+)/)?.[1] || 'application/octet-stream'
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: mimeType })
      const blobUrl = URL.createObjectURL(blob)
      const win = window.open(blobUrl, '_blank', 'noopener,noreferrer')
      // Revoke after a short delay so the new tab has time to load it
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
      return
    } catch (e) {
      console.error('Failed to open base64 document:', e)
      return
    }
  }

  // Regular URL — PDFs and Office docs go through Google Docs Viewer
  const isPdfOrDoc = /\.(pdf|docx?|pptx?|xlsx?)(\?|$)/i.test(fileUrl)
  const url = isPdfOrDoc
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`
    : fileUrl

  window.open(url, '_blank', 'noopener,noreferrer')
}