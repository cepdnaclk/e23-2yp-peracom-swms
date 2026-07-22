import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, Pencil, Trash2, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Modal } from '../../components/common/Modal'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import api from '../../services/api'
import { format } from 'date-fns'

const emptyForm = {
  title: '', description: '', eligibility_criteria: '', eligible_batch: '',
  funding_amount: '', required_documents: '', application_deadline: '', status: 'Active'
}

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/scholarships'),
      api.get('/scholarships/requests?status=Pending'),
    ]).then(([s, r]) => {
      setScholarships(s.data)
      setRequests(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (s) => {
    setEditing(s)
    setForm({
      title: s.title || '', description: s.description || '',
      eligibility_criteria: s.eligibility_criteria || '',
      eligible_batch: s.eligible_batch || '',
      funding_amount: s.funding_amount || '',
      required_documents: s.required_documents || '',
      application_deadline: s.application_deadline?.slice(0, 10) || '',
      status: s.status || 'Active'
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title) return toast.error('Title is required')
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/scholarships/${editing.id}`, form)
        toast.success('Scholarship updated')
      } else {
        await api.post('/scholarships', form)
        toast.success('Scholarship created')
      }
      setModalOpen(false)
      load()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this scholarship?')) return
    await api.delete(`/scholarships/${id}`).catch(() => {})
    toast.success('Deleted')
    load()
  }

  const inp = (field, label, type = 'text', opts = {}) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {opts.textarea ? (
        <textarea value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
          rows={3} className="input-field resize-none" />
      ) : opts.select ? (
        <select value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} className="input-field">
          {opts.options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} className="input-field" />
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Scholarships' }]} />

      <div className="flex items-center justify-between">
        <h1 className="page-title">Scholarship Management</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Scholarship
        </button>
      </div>

      {/* Active Scholarships */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <GraduationCap size={18} className="text-purple-600" /> Active Scholarships
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Scholarship Name', 'Eligibility', 'Deadline', 'Amount (LKR)', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : scholarships.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No scholarships yet.</td></tr>
              ) : scholarships.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{s.title}</p>
                    {s.donor_name && <p className="text-xs text-purple-600 mt-0.5">{s.donor_name}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{s.eligibility_criteria || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.application_deadline ? format(new Date(s.application_deadline), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {s.funding_amount ? Number(s.funding_amount).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/scholarships/${s.id}/assign`}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title="Assign Students">
                        <Eye size={15} />
                      </Link>
                      <button onClick={() => openEdit(s)}
                        className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(s.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donor Requests */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Donor Scholarship Requests</h2>
          <p className="text-xs text-slate-400 mt-0.5">Only pending requests shown</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Donor Name', 'Scholarship Title', 'Funding Amount', 'Submitted Date', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requests.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No pending requests.</td></tr>
              ) : requests.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.donor_name}</td>
                  <td className="px-4 py-3 text-slate-700">{r.scholarship_title}</td>
                  <td className="px-4 py-3 text-slate-700">LKR {Number(r.funding_amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500">{r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status || 'Pending'} /></td>
                  <td className="px-4 py-3">
                    <Link to={`/scholarships/requests/${r.id}`} className="btn-primary text-xs px-3 py-1.5">Review</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Scholarship' : 'Add Scholarship'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">{inp('title', 'Scholarship Title *')}</div>
          {inp('eligible_batch', 'Eligible Batch (e.g. 20/21)')}
          {inp('funding_amount', 'Funding Amount (LKR)', 'number')}
          {inp('application_deadline', 'Application Deadline', 'date')}
          {inp('status', 'Status', 'text', { select: true, options: ['Active', 'Inactive', 'Draft'] })}
          {inp('required_documents', 'Required Documents')}
          <div className="sm:col-span-2">{inp('eligibility_criteria', 'Eligibility Criteria', 'text', { textarea: true })}</div>
          <div className="sm:col-span-2">{inp('description', 'Description', 'text', { textarea: true })}</div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Scholarship'}
          </button>
          <button onClick={() => setModalOpen(false)} className="btn-ghost">Cancel</button>
        </div>
      </Modal>
    </div>
  )
}
