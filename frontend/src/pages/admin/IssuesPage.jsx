import { useState, useEffect } from 'react'
import { AlertCircle, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatCard } from '../../components/common/StatCard'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Modal } from '../../components/common/Modal'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import api from '../../services/api'
import { format } from 'date-fns'

export default function IssuesPage() {
  const [issues, setIssues] = useState([])
  const [stats, setStats] = useState({})
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([
      api.get('/admin/issues'),
      api.get('/admin/issue-stats').catch(() => ({ data: {} })),
    ]).then(([i, s]) => {
      setIssues(i.data)
      setStats(s.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openIssue = (issue) => {
    setSelected(issue)
    setReply(issue.admin_reply || '')
    setNewStatus(issue.status || 'Open')
  }

  const handleSave = async () => {
    await api.put(`/admin/issues/${selected.id}`, { admin_reply: reply, status: newStatus })
    toast.success('Issue updated')
    setSelected(null)
    load()
  }

  const filtered = issues.filter(i => {
    const matchSearch = !search || i.title?.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || i.category === filterCat
    const matchStatus = !filterStatus || i.status === filterStatus
    return matchSearch && matchCat && matchStatus
  })

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Issues' }]} />
      <h1 className="page-title">Issue Management</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Issues" value={stats.total ?? 0} icon={AlertTriangle} color="purple" />
        <StatCard title="Open Issues" value={stats.open ?? 0} icon={AlertCircle} color="red" />
        <StatCard title="In Progress" value={stats.in_progress ?? 0} icon={Clock} color="blue" />
        <StatCard title="Resolved Issues" value={stats.resolved ?? 0} icon={CheckCircle} color="green" />
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by issue title..." className="input-field flex-1" />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input-field sm:w-52">
          <option value="">All Categories</option>
          {['Scholarship Issue', 'Document Issue', 'System Issue', 'Application Inquiry'].map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field sm:w-40">
          <option value="">All Statuses</option>
          {['Open', 'In Progress', 'Resolved', 'Draft'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {['Issue Title', 'Reported By', 'Category', 'Status', 'Date', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No issues found.</td></tr>
            ) : filtered.map(issue => (
              <tr key={issue.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px] truncate">{issue.title}</td>
                <td className="px-4 py-3 text-slate-600">{issue.reported_by_name || '—'}</td>
                <td className="px-4 py-3">
                  <span className="badge-grey text-xs">{issue.category}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={issue.status} /></td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {issue.created_at ? format(new Date(issue.created_at), 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openIssue(issue)} className="btn-primary text-xs px-3 py-1.5">View / Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Issue Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Issue Detail" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-800 text-base">{selected.title}</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <div><span className="text-slate-500">Reported By:</span> <span className="font-medium text-slate-700">{selected.reported_by_name}</span></div>
                <div><span className="text-slate-500">Category:</span> <span className="badge-grey ml-1">{selected.category}</span></div>
                <div><span className="text-slate-500">Date:</span> <span className="font-medium text-slate-700">{selected.created_at ? format(new Date(selected.created_at), 'MMM d, yyyy') : '—'}</span></div>
                <div className="flex items-center gap-2"><span className="text-slate-500">Status:</span> <StatusBadge status={selected.status} /></div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Description</p>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">{selected.description}</div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Admin Reply</label>
              <textarea value={reply} onChange={e => setReply(e.target.value)}
                rows={4} placeholder="Write a reply to the reporter..."
                className="input-field resize-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Change Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-field">
                {['Open', 'In Progress', 'Resolved', 'Draft'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} className="btn-primary flex-1">Save Changes</button>
              <button onClick={() => setSelected(null)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
