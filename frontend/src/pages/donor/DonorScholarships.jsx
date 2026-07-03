import { useState, useEffect } from 'react'
import { Plus, X, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../../components/common/StatusBadge'
import api from '../../services/api'
import { format } from 'date-fns'

const emptyForm = {
  scholarship_title: '', funding_amount: '', eligible_batch: '', application_deadline: '',
  description: '', eligibility_criteria: '', required_documents: '', notes: ''
}

export default function DonorScholarships() {
  const [tab, setTab] = useState('scholarships')
  const [scholarships, setScholarships] = useState([])
  const [requests, setRequests] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([
      api.get('/donor/scholarships').catch(() => ({ data: [] })),
      api.get('/donor/scholarship-requests').catch(() => ({ data: [] })),
    ]).then(([s, r]) => {
      setScholarships(s.data)
      setRequests(r.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.scholarship_title) return toast.error('Scholarship title is required')
    if (!form.funding_amount) return toast.error('Funding amount is required')
    try {
      await api.post('/donor/scholarship-requests', form)
      toast.success('Request submitted to admin')
      setShowForm(false)
      setForm(emptyForm)
      load()
    } catch { toast.error('Failed to submit request') }
  }

  const inp = (field, label, type = 'text', opts = {}) => (
    <div className={opts.full ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      {opts.textarea ? (
        <textarea value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
          rows={3} className="input-field resize-none" />
      ) : (
        <input type={type} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
          className="input-field" />
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">My Scholarships</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 text-sm">
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Request New Scholarship</>}
        </button>
      </div>

      {/* Request Form */}
      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">New Scholarship Request</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid sm:grid-cols-2 gap-4">
              {inp('scholarship_title', 'Scholarship Title *', 'text', { full: true })}
              {inp('funding_amount', 'Funding Amount (LKR) *', 'number')}
              {inp('eligible_batch', 'Eligible Batch', 'text')}
              {inp('application_deadline', 'Application Deadline', 'date')}
              {inp('description', 'Description', 'text', { textarea: true, full: true })}
              {inp('eligibility_criteria', 'Eligibility Criteria', 'text', { textarea: true, full: true })}
              {inp('required_documents', 'Required Documents')}
              {inp('notes', 'Notes for Admin', 'text', { textarea: true, full: true })}
            </div>
            <div className="flex gap-3 mt-6">
              <button type="submit" className="btn-primary flex-1">Submit Request to Admin</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('scholarships')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'scholarships' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
          My Scholarships
        </button>
        <button onClick={() => setTab('requests')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'requests' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
          My Requests
        </button>
      </div>

      {/* Scholarships Grid */}
      {tab === 'scholarships' && (
        loading ? <div className="text-center py-12 text-slate-400">Loading...</div> :
        scholarships.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <BookOpen size={40} className="text-slate-200 mx-auto" />
            <p className="text-slate-400">No scholarships yet. Request one above!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {scholarships.map(s => (
              <div key={s.id} className="card p-5 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-800">{s.title}</h3>
                  <StatusBadge status={s.status} />
                </div>
                {s.description && <p className="text-xs text-slate-500 line-clamp-2">{s.description}</p>}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>💰 LKR {Number(s.funding_amount || 0).toLocaleString()}</span>
                  <span>👥 {s.eligible_batch || 'All'}</span>
                  {s.application_deadline && <span>📅 {format(new Date(s.application_deadline), 'MMM d, yyyy')}</span>}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Requests List */}
      {tab === 'requests' && (
        loading ? <div className="text-center py-12 text-slate-400">Loading...</div> :
        requests.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No requests yet.</div>
        ) : (
          <div className="space-y-4">
            {requests.map(r => (
              <div key={r.id} className="card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{r.scholarship_title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Submitted {r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : '—'}
                    </p>
                  </div>
                  <StatusBadge status={r.status || 'Pending'} />
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>💰 LKR {Number(r.funding_amount || 0).toLocaleString()}</span>
                  {r.eligible_batch && <span>👥 Batch {r.eligible_batch}</span>}
                </div>
                {r.status === 'Rejected' && r.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                    <span className="font-medium">Rejection reason:</span> {r.rejection_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
