import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Upload, Eye, Download, Trash2, ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../../components/common/StatusBadge'
import { viewDocument } from '../../utils/viewDocument'
import api from '../../services/api'
import { format } from 'date-fns'

const TABS = ['All', 'Pending', 'Approved', 'Awarded', 'Rejected', 'Resubmission Requested']

const REQUIRED_DOCS = [
  'NIC Copy',
  'Academic Transcript',
  'Income Certificate',
  'Recommendation Letter',
]

// ── Progress bar
function ProgressBar({ status }) {
  const config = {
    Pending:                    { width: '25%',  color: 'bg-amber-400' },
    'Under Review':             { width: '40%',  color: 'bg-blue-400' },
    'Resubmission Requested':   { width: '50%',  color: 'bg-orange-400' },
    Approved:                   { width: '65%',  color: 'bg-green-400' },
    'Fully Approved':           { width: '75%',  color: 'bg-green-500' },
    'Payment Details Submitted':{ width: '85%',  color: 'bg-purple-400' },
    'Resubmission Required':    { width: '80%',  color: 'bg-red-400' },
    'Payment Verified':         { width: '95%',  color: 'bg-green-500' },
    Rejected:                   { width: '100%', color: 'bg-red-400' },
    Completed:                  { width: '100%', color: 'bg-green-600' },
  }
  const c = config[status] || { width: '10%', color: 'bg-slate-300' }
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${c.color}`} style={{ width: c.width }}/>
    </div>
  )
}

// ── Document Upload Panel per application
function DocumentUploadPanel({ app, onRefresh }) {
  const [docs, setDocs]         = useState([])
  const [uploading, setUploading] = useState(null)
  const [deleting, setDeleting]   = useState(null)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const fileRefs = useRef({})

  const loadDocs = () => {
    setLoadingDocs(true)
    api.get(`/applications/${app.id}/documents`)
      .then(r => setDocs(r.data))
      .catch(() => setDocs([]))
      .finally(() => setLoadingDocs(false))
  }
  useEffect(() => { loadDocs() }, [app.id])

  const getDoc = (docName) => docs.find(d => d.document_name === docName) || null

  const handleUpload = async (docName, file) => {
    if (!file) return
    const allowed = ['application/pdf','image/jpeg','image/png','image/jpg']
    if (!allowed.includes(file.type))      { toast.error('Only PDF, JPG, PNG allowed'); return }
    if (file.size > 5 * 1024 * 1024)      { toast.error('Max file size is 5MB'); return }

    setUploading(docName)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('document_name', docName)
      await api.post(`/applications/${app.id}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(`${docName} uploaded!`)
      loadDocs()
      onRefresh()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(null)
      // Reset file input
      if (fileRefs.current[docName]) fileRefs.current[docName].value = ''
    }
  }

  const handleDelete = async (docId, docName) => {
    if (!confirm(`Delete ${docName}?`)) return
    setDeleting(docId)
    try {
      await api.delete(`/applications/${app.id}/documents/${docId}`)
      toast.success('Document removed')
      loadDocs()
    } catch { toast.error('Failed to delete') }
    finally { setDeleting(null) }
  }

  const uploadedCount = docs.length
  const verifiedCount = docs.filter(d => d.status === 'Verified').length

  const dotColor = (doc) => {
    if (!doc)                    return 'bg-red-400'
    if (doc.status === 'Verified') return 'bg-green-500'
    return 'bg-blue-400'
  }

  const formatSize = (bytes) => bytes
    ? bytes < 1024*1024 ? `${(bytes/1024).toFixed(0)} KB` : `${(bytes/(1024*1024)).toFixed(1)} MB`
    : ''

  return (
    <div className="mt-4 border-t border-slate-100 pt-5 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Upload size={14} className="text-purple-600"/>
          Required Documents
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="badge-green">{verifiedCount} Verified</span>
          <span className="badge-blue">{uploadedCount} / {REQUIRED_DOCS.length} Uploaded</span>
        </div>
      </div>

      {/* Overall progress */}
      <div className="space-y-1">
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${(uploadedCount / REQUIRED_DOCS.length) * 100}%` }}/>
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>Allowed: PDF, JPG, PNG · Max 5MB</span>
          <span>{uploadedCount}/{REQUIRED_DOCS.length} uploaded</span>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl px-3 py-2 text-xs text-blue-700 flex items-start gap-1.5">
        <AlertCircle size={12} className="mt-0.5 flex-shrink-0"/>
        Only the latest upload is shown per document. You can replace or delete any unverified document.
      </div>

      {/* Document rows */}
      {loadingDocs ? (
        <div className="text-center py-4 text-slate-400 text-xs">Loading documents...</div>
      ) : (
        <div className="space-y-2">
          {REQUIRED_DOCS.map(docName => {
            const doc = getDoc(docName)
            const isUploading = uploading === docName
            const isDeleting  = doc && deleting === doc.id
            const canEdit     = !doc || doc.status !== 'Verified'

            return (
              <div key={docName}
                className={`rounded-xl border-2 transition-all
                  ${doc
                    ? doc.status === 'Verified'
                      ? 'border-green-200 bg-green-50/40'
                      : 'border-blue-200 bg-blue-50/20'
                    : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center gap-3 p-3.5">
                  {/* Status dot */}
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor(doc)}`}/>

                  {/* Icon + name */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${doc ? doc.status==='Verified' ? 'bg-green-100' : 'bg-blue-100' : 'bg-slate-100'}`}>
                    {doc
                      ? doc.status === 'Verified'
                        ? <Check size={14} className="text-green-600"/>
                        : <FileText size={14} className="text-blue-500"/>
                      : <FileText size={14} className="text-slate-400"/>}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{docName}</p>
                    {doc ? (
                      <p className="text-xs text-slate-400 truncate">
                        {doc.file_name}
                        {doc.created_at && ` · ${format(new Date(doc.created_at), 'MMM d, yyyy')}`}
                      </p>
                    ) : (
                      <p className="text-xs text-red-400 font-medium">Not uploaded</p>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="flex-shrink-0">
                    {doc
                      ? <StatusBadge status={doc.status || 'Submitted'}/>
                      : <span className="badge-red">Missing</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* View */}
                    {doc?.file_url && (
                      <button onClick={() => viewDocument(doc.file_url)}
                        className="p-1.5 rounded-lg text-purple-500 hover:bg-purple-50 transition-colors" title="View">
                        <Eye size={14}/>
                      </button>
                    )}
                    {/* Download */}
                    {doc?.file_url && (
                      <a href={doc.file_url} download
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors" title="Download">
                        <Download size={14}/>
                      </a>
                    )}
                    {/* Delete */}
                    {doc && canEdit && (
                      <button onClick={() => handleDelete(doc.id, docName)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                        title="Delete">
                        {isDeleting
                          ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"/>
                          : <Trash2 size={14}/>}
                      </button>
                    )}
                    {/* Upload / Replace */}
                    {canEdit && (
                      <>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                          ref={el => fileRefs.current[docName] = el}
                          onChange={e => handleUpload(docName, e.target.files[0])}/>
                        <button
                          onClick={() => fileRefs.current[docName]?.click()}
                          disabled={isUploading}
                          title={doc ? 'Replace document' : 'Upload document'}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50
                            ${doc
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                          {isUploading
                            ? <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/> Uploading...</>
                            : <><Upload size={12}/> {doc ? 'Replace' : 'Upload'}</>}
                        </button>
                      </>
                    )}
                    {/* Verified — no action */}
                    {doc && doc.status === 'Verified' && (
                      <span className="text-xs text-green-600 font-semibold px-2">✓ Verified</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function MyApplications() {
  const [apps, setApps]           = useState([])
  const [tab, setTab]             = useState('All')
  const [loading, setLoading]     = useState(true)
  const [expandedDocs, setExpandedDocs] = useState({})

  const loadApps = () => {
    api.get('/student/applications')
      .then(r => setApps(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { loadApps() }, [])

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? apps.length : apps.filter(a => a.status === t).length
    return acc
  }, {})

  const filtered = tab === 'All' ? apps : apps.filter(a => a.status === tab)

  const toggleDocs = (appId) =>
    setExpandedDocs(prev => ({ ...prev, [appId]: !prev[appId] }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My Applications</h1>
        <p className="text-slate-500 text-sm mt-1">
          Track your scholarship applications and upload required documents.
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors
              ${tab === t
                ? 'bg-purple-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300'}`}>
            {t} {counts[t] > 0 ? `(${counts[t]})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading applications...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <FileText size={40} className="text-slate-200 mx-auto"/>
          <p className="text-slate-400">No applications found.</p>
          <Link to="/student/scholarships" className="btn-primary inline-block">
            Browse Scholarships
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(app => (
            <div key={app.id} className="card hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-purple-600"/>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-slate-800">{app.scholarship_title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Applied {app.created_at ? format(new Date(app.created_at), 'MMM d, yyyy') : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {app.funding_amount && (
                          <span className="text-sm font-bold text-green-600">
                            LKR {Number(app.funding_amount).toLocaleString()}
                          </span>
                        )}
                        <StatusBadge status={app.status}/>
                      </div>
                    </div>

                    {/* Admin note */}
                    {app.admin_reason && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 flex items-start gap-1.5">
                        <AlertCircle size={12} className="mt-0.5 flex-shrink-0"/>
                        <span><span className="font-semibold">Admin note:</span> {app.admin_reason}</span>
                      </div>
                    )}

                    {/* Payment CTA — shown when Fully Approved or Resubmission Required */}
                    {['Fully Approved', 'Resubmission Required'].includes(app.status) && (
                      <Link to={`/student/payment/${app.id}`}
                        className="mt-3 flex items-center justify-between gap-2 bg-gradient-to-r from-purple-700 to-purple-500 rounded-xl px-4 py-3 text-white text-xs font-semibold hover:opacity-90 transition-opacity">
                        <span>
                          {app.status === 'Resubmission Required'
                            ? '⚠️ Payment details need correction. Click to update.'
                            : '🎉 Fully approved! Click to submit your payment details.'}
                        </span>
                        <span className="underline whitespace-nowrap flex-shrink-0">Open →</span>
                      </Link>
                    )}

                    {/* Payment submitted banner */}
                    {app.status === 'Payment Details Submitted' && (
                      <Link to={`/student/payment/${app.id}`}
                        className="mt-3 flex items-center justify-between gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
                        <span>💳 Payment details submitted — awaiting donor verification.</span>
                        <span className="underline whitespace-nowrap flex-shrink-0">View →</span>
                      </Link>
                    )}

                    {/* Payment verified banner */}
                    {app.status === 'Payment Verified' && (
                      <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-green-700 text-xs font-semibold">
                        ✅ Payment details verified. Scholarship funds will be disbursed shortly.
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Application Progress</span>
                        <span>{app.status}</span>
                      </div>
                      <ProgressBar status={app.status}/>
                    </div>

                    {/* Toggle button */}
                    <button
                      onClick={() => toggleDocs(app.id)}
                      className="mt-3 flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors">
                      <Upload size={13}/>
                      {expandedDocs[app.id] ? 'Hide Documents' : 'Upload / View Documents'}
                      {expandedDocs[app.id] ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                    </button>
                  </div>
                </div>

                {/* Document Upload Panel */}
                {expandedDocs[app.id] && (
                  <DocumentUploadPanel app={app} onRefresh={loadApps}/>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}