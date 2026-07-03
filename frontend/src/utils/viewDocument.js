// Opens a document in a new browser tab.
// PDFs and Office docs are routed through Google Docs Viewer for inline rendering;
// other file types (images, etc.) open directly.
export function viewDocument(fileUrl) {
  if (!fileUrl) return
  const isPdfOrDoc = /\.(pdf|docx?|pptx?|xlsx?)$/i.test(fileUrl)
  const url = isPdfOrDoc
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`
    : fileUrl
  window.open(url, '_blank', 'noopener,noreferrer')
}