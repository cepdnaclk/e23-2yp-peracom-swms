import { useState, useEffect } from 'react'
import { Plus, X, BookOpen, Users, Calendar, FileText, Info, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../../components/common/StatusBadge'
import api from '../../services/api'
import { format } from 'date-fns'

const emptyForm = {
  scholarship_title: '',
  funding_amount: '',
  num_students: '',
  eligible_batches: [],
  eligibility_criteria: '',
  opening_date: '',
  application_deadline: '',
  required_documents: [],
  description: '',
  notes: '',
  terms: '',
  confirmed: false,
  editingDraftId: null
}

export default function DonorScholarships() {
  const [tab, setTab] = useState('scholarships')
  const [scholarships, setScholarships] = useState([])
  const [requests, setRequests] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)

  const load = () => {
    Promise.all([
      api.get('/donor/scholarships').catch(() => ({ data: [] })),
      api.get('/donor/scholarship-requests').catch(() => ({ data: [] })),
      api.get('/donor/profile').catch(() => ({ data: null })),
    ]).then(([s, r, p]) => {
      setScholarships(s.data)
      setRequests(r.data)
      setProfile(p.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e, isDraft = false) => {
    if (e) e.preventDefault()

    if (!isDraft) {
      if (!form.scholarship_title) return toast.error('Scholarship title is required')
      if (!form.funding_amount || parseFloat(form.funding_amount) <= 0) return toast.error('Scholarship amount must be greater than 0')
      if (!form.num_students || parseInt(form.num_students) < 1) return toast.error('Number of students must be at least 1')
      if (!form.eligible_batches || form.eligible_batches.length === 0) return toast.error('Eligible batch must be selected')
      if (!form.opening_date) return toast.error('Opening date is required')
      if (!form.application_deadline) return toast.error('Application deadline is required')
      if (new Date(form.application_deadline) <= new Date(form.opening_date)) {
        return toast.error('Application deadline must be later than the opening date')
      }
      if (!form.description) return toast.error('Description is required')
      if (!form.confirmed) return toast.error('Please confirm the accuracy of information')
    }

    try {
      const payload = {
        scholarship_title: form.scholarship_title,
        funding_amount: form.funding_amount ? parseFloat(form.funding_amount) : 0,
        eligible_batch: form.eligible_batches ? form.eligible_batches.join(', ') : '',
        application_deadline: form.application_deadline,
        description: form.description,
        eligibility_criteria: form.eligibility_criteria,
        required_documents: form.required_documents ? form.required_documents.join(', ') : '',
        notes: form.notes,
        num_students: form.num_students ? parseInt(form.num_students) : null,
        opening_date: form.opening_date,
        terms: form.terms,
        status_override: isDraft ? 'Draft' : 'Pending'
      }

      if (form.editingDraftId) {
        await api.put(`/donor/scholarship-requests/${form.editingDraftId}`, payload)
      } else {
        await api.post('/donor/scholarship-requests', payload)
      }
      toast.success(isDraft ? 'Draft saved successfully' : 'Request submitted to admin')
      setShowForm(false)
      setForm(emptyForm)
      load()
    } catch {
      toast.error(isDraft ? 'Failed to save draft' : 'Failed to submit request')
    }
  }

  const handleEditDraft = (r) => {
    setForm({
      scholarship_title: r.scholarship_title || '',
      funding_amount: r.funding_amount ? parseFloat(r.funding_amount) : '',
      num_students: r.num_students || '',
      eligible_batches: r.eligible_batch ? r.eligible_batch.split(', ') : [],
      eligibility_criteria: r.eligibility_criteria || '',
      opening_date: r.opening_date ? format(new Date(r.opening_date), 'yyyy-MM-dd') : '',
      application_deadline: r.application_deadline ? format(new Date(r.application_deadline), 'yyyy-MM-dd') : '',
      required_documents: r.required_documents ? r.required_documents.split(', ') : [],
      description: r.description || '',
      notes: r.notes || '',
      terms: r.terms || '',
      confirmed: false,
      editingDraftId: r.id
    })
    setShowForm(true)
  }

  const handleDuplicate = (r) => {
    setForm({
      scholarship_title: r.scholarship_title ? r.scholarship_title + ' (Duplicate)' : '',
      funding_amount: r.funding_amount ? parseFloat(r.funding_amount) : '',
      num_students: r.num_students || '',
      eligible_batches: r.eligible_batch ? r.eligible_batch.split(', ') : [],
      eligibility_criteria: r.eligibility_criteria || '',
      opening_date: r.opening_date ? format(new Date(r.opening_date), 'yyyy-MM-dd') : '',
      application_deadline: r.application_deadline ? format(new Date(r.application_deadline), 'yyyy-MM-dd') : '',
      required_documents: r.required_documents ? r.required_documents.split(', ') : [],
      description: r.description || '',
      notes: r.notes || '',
      terms: r.terms || '',
      confirmed: false,
      editingDraftId: null
    })
    setShowForm(true)
    toast.success('Prefilled request ready for submit/save draft!')
  }

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
        <div className="card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">New Scholarship Request</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Scholarship Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-purple-700 pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
                <BookOpen size={16} /> Section 1: Scholarship Information
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Scholarship Title *</label>
                  <input type="text" value={form.scholarship_title} onChange={e => setForm({ ...form, scholarship_title: e.target.value })} className="input-field" placeholder="e.g. Peradeniya Engineering Excellence Scholarship" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Total Scholarship Amount (LKR) *</label>
                  <input type="number" min="1" value={form.funding_amount} onChange={e => setForm({ ...form, funding_amount: e.target.value })} className="input-field" placeholder="e.g. 100000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Number of Students to Support *</label>
                  <input type="number" min="1" value={form.num_students} onChange={e => setForm({ ...form, num_students: e.target.value })} className="input-field" placeholder="e.g. 5" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Scholarship Description *</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="input-field resize-none" placeholder="Provide a brief summary of the scholarship..." />
                </div>
              </div>
            </div>

            {/* Section 2: Eligibility Criteria */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-purple-700 pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
                <Users size={16} /> Section 2: Eligibility Criteria
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Eligible Batch *</label>
                  <div className="flex flex-wrap gap-4">
                    {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(batch => {
                      const checked = form.eligible_batches.includes(batch)
                      return (
                        <label key={batch} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? form.eligible_batches.filter(b => b !== batch)
                                : [...form.eligible_batches, batch]
                              setForm({ ...form, eligible_batches: next })
                            }}
                            className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                          />
                          {batch}
                        </label>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Other Eligibility Criteria</label>
                  <textarea value={form.eligibility_criteria} onChange={e => setForm({ ...form, eligibility_criteria: e.target.value })} rows={3} className="input-field resize-none" placeholder="e.g. Minimum GPA of 3.00, monthly family income below LKR 50,000..." />
                </div>
              </div>
            </div>

            {/* Section 3: Application Details */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-purple-700 pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
                <Calendar size={16} /> Section 3: Application Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Application Opening Date *</label>
                  <input type="date" value={form.opening_date} onChange={e => setForm({ ...form, opening_date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Application Deadline *</label>
                  <input type="date" value={form.application_deadline} onChange={e => setForm({ ...form, application_deadline: e.target.value })} className="input-field" />
                </div>
              </div>
            </div>

            {/* Section 4: Required Documents */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-purple-700 pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
                <FileText size={16} /> Section 4: Required Documents
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Select the documents students must upload during application submission:</label>
                <div className="grid sm:grid-cols-2 gap-3.5">
                  {[
                    { key: 'NIC Copy', label: 'NIC Copy' },
                    { key: 'Academic Transcript', label: 'Academic Transcript' },
                    { key: 'Income Certificate', label: 'Income Certificate' },
                    { key: 'Recommendation Letter', label: 'Recommendation Letter' },
                    { key: 'Bank Passbook Copy', label: 'Bank Passbook Copy (Required only after scholarship approval)', helper: true }
                  ].map(doc => {
                    const checked = form.required_documents.includes(doc.key)
                    return (
                      <label key={doc.key} className="flex items-start gap-2.5 cursor-pointer text-sm text-slate-700 bg-slate-50 hover:bg-slate-100/70 p-3 rounded-xl border border-slate-100/60 transition-colors">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? form.required_documents.filter(d => d !== doc.key)
                              : [...form.required_documents, doc.key]
                            setForm({ ...form, required_documents: next })
                          }}
                          className="mt-0.5 w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                        />
                        <div>
                          <p className="font-semibold text-xs text-slate-800">{doc.label}</p>
                          {doc.helper && <p className="text-[10px] text-slate-400 mt-0.5">Will be requested post-selection</p>}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Section 5: Donor Information */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-purple-700 pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
                <Info size={16} /> Section 5: Donor Information
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Donor Name</label>
                  <input type="text" readOnly value={profile?.name || ''} className="input-field bg-slate-100/50 text-slate-600 border-slate-200 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Organization Name</label>
                  <input type="text" readOnly value={profile?.organization || '—'} className="input-field bg-slate-100/50 text-slate-600 border-slate-200 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                  <input type="text" readOnly value={profile?.email || ''} className="input-field bg-slate-100/50 text-slate-600 border-slate-200 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Number</label>
                  <input type="text" readOnly value={profile?.phone || '—'} className="input-field bg-slate-100/50 text-slate-600 border-slate-200 cursor-not-allowed" />
                </div>
              </div>
            </div>

            {/* Section 6: Terms & Conditions */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-purple-700 pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
                <Shield size={16} /> Section 6: Terms & Conditions
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Scholarship Rules and Conditions</label>
                  <textarea value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} rows={3} className="input-field resize-none" placeholder="Provide any rules, guidelines or conditions associated with the scholarship..." />
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.confirmed}
                    onChange={e => setForm({ ...form, confirmed: e.target.checked })}
                    className="mt-0.5 w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">I confirm that the information provided is accurate. *</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-100">
              <button type="button" onClick={(e) => handleSubmit(e, true)} className="btn-secondary px-6">Save as Draft</button>
              <button type="submit" className="btn-primary flex-1">Submit Scholarship Request</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost px-6">Cancel</button>
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
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>💰 LKR {Number(s.funding_amount || 0).toLocaleString()}</span>
                    {s.num_students && <span>👥 {s.num_students} students</span>}
                    <span>🎓 {s.eligible_batch || 'All'}</span>
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
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>💰 LKR {Number(r.funding_amount || 0).toLocaleString()}</span>
                    {r.num_students && <span>👥 {r.num_students} students</span>}
                    {r.eligible_batch && <span>🎓 Batch {r.eligible_batch}</span>}
                  </div>
                  {r.status === 'Rejected' && r.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                      <span className="font-medium">Rejection reason:</span> {r.rejection_reason}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                    {r.status === 'Draft' ? (
                      <button
                        type="button"
                        onClick={() => handleEditDraft(r)}
                        className="px-3.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Plus size={12} /> Continue Editing Draft
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(r)}
                        className="px-3.5 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        👁 View Details
                      </button>
                    )}

                    {r.status === 'Rejected' && (
                      <button
                        type="button"
                        onClick={() => handleDuplicate(r)}
                        className="px-3.5 py-1.5 bg-purple-600 text-white hover:bg-purple-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        ✨ Duplicate Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-2xl w-full max-h-[85vh] flex flex-col transform scale-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800">Scholarship Request Details</h3>
                <p className="text-xs text-slate-400 mt-0.5">Submitted: {selectedRequest.created_at ? format(new Date(selectedRequest.created_at), 'MMM d, yyyy') : '—'}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700">
              {/* Rejection Alert Details Block if Rejected */}
              {selectedRequest.status === 'Rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-2.5">
                  <h4 className="font-bold text-red-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Shield size={14} /> Rejection Details
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4 text-xs text-red-700">
                    <div>
                      <span className="font-medium block text-red-500">Status</span>
                      <span className="font-bold text-red-800 text-sm">Rejected</span>
                    </div>
                    <div>
                      <span className="font-medium block text-red-500">Rejection Date</span>
                      <span className="font-bold text-slate-700 text-sm">{selectedRequest.updated_at ? format(new Date(selectedRequest.updated_at), 'MMM d, yyyy') : '—'}</span>
                    </div>
                    <div>
                      <span className="font-medium block text-red-500">Rejected By</span>
                      <span className="font-bold text-slate-700 text-sm">Admin</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-medium block text-red-500">Rejection Reason</span>
                      <span className="font-semibold text-slate-800 block mt-0.5 bg-white/70 p-3 border border-red-100 rounded-xl whitespace-pre-wrap">{selectedRequest.rejection_reason || 'No reason provided.'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid Info */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Scholarship Title</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedRequest.scholarship_title}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Total Scholarship Amount (LKR)</span>
                  <span className="font-bold text-slate-800 text-sm">LKR {Number(selectedRequest.funding_amount || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Number of Students to Support</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedRequest.num_students || '—'}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Eligible Batch</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedRequest.eligible_batch || 'All'}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Opening Date</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedRequest.opening_date ? format(new Date(selectedRequest.opening_date), 'MMM d, yyyy') : '—'}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-0.5">Application Deadline</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedRequest.application_deadline ? format(new Date(selectedRequest.application_deadline), 'MMM d, yyyy') : '—'}</span>
                </div>
              </div>

              {/* Text Areas */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                {selectedRequest.description && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-1">Description</span>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedRequest.description}</div>
                  </div>
                )}
                {selectedRequest.eligibility_criteria && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-1">Other Eligibility Criteria</span>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedRequest.eligibility_criteria}</div>
                  </div>
                )}
                {selectedRequest.required_documents && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-1">Required Documents</span>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed">{selectedRequest.required_documents}</div>
                  </div>
                )}
                {selectedRequest.terms && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-1">Scholarship Rules and Conditions</span>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedRequest.terms}</div>
                  </div>
                )}
                {selectedRequest.notes && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-1">Notes for Admin</span>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedRequest.notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex gap-3 flex-shrink-0">
              {selectedRequest.status === 'Rejected' && (
                <button
                  type="button"
                  onClick={() => {
                    handleDuplicate(selectedRequest)
                    setSelectedRequest(null)
                  }}
                  className="btn-primary flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-1.5"
                >
                  ✨ Duplicate and Edit Request
                </button>
              )}
              <button onClick={() => setSelectedRequest(null)} className="btn-ghost px-5 py-2 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
