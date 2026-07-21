import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { StatusBadge } from '../../components/common/StatusBadge'

const ISSUE_CATEGORIES = ['Scholarship Issue', 'Document Issue', 'System Issue', 'Application Inquiry']

export default function DonorIssues() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', category: ISSUE_CATEGORIES[0], description: '' })

  const loadIssues = () => {
    setLoading(true)
    api.get('/donor/issues')
      .then((response) => setIssues(response.data || []))
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load issues')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadIssues()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/donor/issues', form)
      toast.success('Issue submitted successfully')
      setForm({ title: '', category: ISSUE_CATEGORIES[0], description: '' })
      loadIssues()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit issue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Issue Management</h1>
        <p className="text-sm text-slate-500 mt-1">Report issues and track admin replies.</p>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Create New Issue</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
            <input
              type="text"
              className="input-field"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter issue title"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
            <select
              className="input-field"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              {ISSUE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea
              rows={5}
              className="input-field resize-none"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your issue in detail"
              required
            />
          </div>
          <button disabled={submitting} className="btn-primary">
            {submitting ? 'Submitting...' : 'Submit Issue'}
          </button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">My Issues</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {['Title', 'Category', 'Status', 'Admin Reply', 'Date'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : issues.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <AlertTriangle size={16} />
                    <span>No issues submitted yet.</span>
                  </div>
                </td>
              </tr>
            ) : issues.map((issue) => (
              <tr key={issue.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800 max-w-[220px] truncate">{issue.title}</td>
                <td className="px-4 py-3 text-slate-600">{issue.category}</td>
                <td className="px-4 py-3"><StatusBadge status={issue.status} /></td>
                <td className="px-4 py-3 text-slate-600">{issue.admin_reply || '—'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {issue.created_at ? format(new Date(issue.created_at), 'MMM d, yyyy') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
