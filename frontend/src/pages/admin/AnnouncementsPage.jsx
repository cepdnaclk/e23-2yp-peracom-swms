import { useState, useEffect } from 'react'
import { Plus, Eye, Pencil, Trash2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Modal } from '../../components/common/Modal'
import api from '../../services/api'
import { format } from 'date-fns'

const emptyForm = { title: '', audience: 'All Users', content: '', publish_date: '', status: 'Draft' }

export default function AnnouncementsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const load = () => {
    api.get('/admin/announcements').then(r => setItems(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (a) => {
    setEditing(a)
    setForm({ title: a.title, audience: a.audience, content: a.content, publish_date: a.publish_date?.slice(0, 10) || '', status: a.status })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title) return toast.error('Title required')
    if (editing) {
      await api.put(`/admin/announcements/${editing.id}`, form)
      toast.success('Updated')
    } else {
      await api.post('/admin/announcements', form)
      toast.success('Created')
    }
    setModalOpen(false)
    load()
  }

  const handlePublish = async (id) => {
    await api.post(`/admin/announcements/${id}/publish`)
    toast.success('Published')
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return
    await api.delete(`/admin/announcements/${id}`)
    toast.success('Deleted')
    load()
  }

  const filtered = items.filter(a => {
    const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || a.status === filterStatus
    return matchSearch && matchStatus
  })

  const audienceBadge = (a) => (
    <span className="badge-purple">{a}</span>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Announcement Management</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create Announcement
        </button>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search announcements..." className="input-field flex-1" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field sm:w-44">
          <option value="">All Statuses</option>
          {['Draft', 'Published', 'Scheduled'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {['Title', 'Audience', 'Status', 'Published / Scheduled Date', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No announcements.</td></tr>
            ) : filtered.map(a => (
              <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{a.title}</td>
                <td className="px-4 py-3">{audienceBadge(a.audience)}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {a.publish_date ? format(new Date(a.publish_date), 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewItem(a)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50"><Eye size={14} /></button>
                    <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50"><Pencil size={14} /></button>
                    {a.status === 'Draft' && (
                      <button onClick={() => handlePublish(a.id)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"><Send size={14} /></button>
                    )}
                    <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Announcement' : 'Create Announcement'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Audience</label>
              <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} className="input-field">
                {['All Users', 'Students', 'Donors'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                {['Draft', 'Published', 'Scheduled'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Publish Date</label>
            <input type="date" value={form.publish_date} onChange={e => setForm({ ...form, publish_date: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Content</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              rows={5} className="input-field resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} className="btn-primary flex-1">
            {editing ? 'Save Changes' : 'Create Announcement'}
          </button>
          <button onClick={() => setModalOpen(false)} className="btn-ghost">Cancel</button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={viewItem?.title || ''}>
        {viewItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={viewItem.status} />
              <span className="badge-purple">{viewItem.audience}</span>
              {viewItem.publish_date && (
                <span className="text-xs text-slate-500">{format(new Date(viewItem.publish_date), 'MMM d, yyyy')}</span>
              )}
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed">
              {viewItem.content}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
