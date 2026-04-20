// src/pages/AnnouncementManagement.jsx
// Create, edit, delete and publish announcements

import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { PageHeader, LoadingSpinner, EmptyState, Modal } from '../components/common/UIComponents';
import { StatusBadge } from '../components/common/StatusBadge';

const EMPTY_FORM = { title: '', audience: 'All Users', content: '', publish_date: '', status: 'Draft' };
const AUDIENCES  = ['All Users', 'Students', 'Donors'];
const STATUSES   = ['', 'Draft', 'Published', 'Scheduled'];

export default function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen]   = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [viewItem, setViewItem]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)       params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/announcements', { params });
      setAnnouncements(res.data);
    } catch { toast.error('Failed to load announcements'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (a) => { setEditItem(a); setForm({ ...a }); setModalOpen(true); };
  const openView = (a) => { setViewItem(a); setViewOpen(true); };

  const handleSave = async () => {
    if (!form.title || !form.content) return toast.error('Title and content are required');
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/announcements/${editItem.id}`, form);
        toast.success('Announcement updated');
      } else {
        await api.post('/announcements', form);
        toast.success('Announcement created');
      }
      setModalOpen(false);
      load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      toast.success('Deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const handlePublish = async (a) => {
    try {
      await api.put(`/announcements/${a.id}`, { ...a, status: 'Published' });
      toast.success('Announcement published');
      load();
    } catch { toast.error('Publish failed'); }
  };

  return (
    <div>
      <PageHeader title="Announcement Management" breadcrumb="Dashboard > Announcements">
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5">
          <Plus size={16} /> Create Announcement
        </button>
      </PageHeader>

      {/* Search & Filter */}
      <div className="card mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-8" placeholder="Search announcements..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <LoadingSpinner /> : announcements.length === 0 ? <EmptyState message="No announcements yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  {['Title', 'Audience', 'Status', 'Published / Scheduled Date', 'Action'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {announcements.map(a => (
                  <tr key={a.id} className="table-row">
                    <td className="px-3 py-3 font-medium text-slate-800">{a.title}</td>
                    <td className="px-3 py-3">
                      <span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full">{a.audience}</span>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-3 py-3 text-slate-500">
                      {a.publish_date ? new Date(a.publish_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openView(a)}
                          className="text-xs text-purple-600 px-2 py-1 rounded hover:bg-purple-50">View</button>
                        <button onClick={() => openEdit(a)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></button>
                        {a.status === 'Draft' && (
                          <button onClick={() => handlePublish(a)}
                            className="text-xs text-green-600 px-2 py-1 rounded hover:bg-green-50">Publish</button>
                        )}
                        <button onClick={() => handleDelete(a.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Announcement' : 'Create Announcement'}>
        <div className="grid gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Title *</label>
            <input className="input-field" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Audience</label>
            <select className="select-field w-full" value={form.audience}
              onChange={e => setForm({ ...form, audience: e.target.value })}>
              {AUDIENCES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Content *</label>
            <textarea rows={5} className="input-field resize-none" value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Publish Date</label>
            <input type="date" className="input-field" value={form.publish_date || ''}
              onChange={e => setForm({ ...form, publish_date: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Status</label>
            <select className="select-field w-full" value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}>
              {['Draft', 'Published', 'Scheduled'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-1">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={viewItem?.title || ''}>
        {viewItem && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <StatusBadge status={viewItem.status} />
              <span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full">{viewItem.audience}</span>
            </div>
            {viewItem.publish_date && (
              <p className="text-xs text-slate-400">
                Published: {new Date(viewItem.publish_date).toLocaleDateString()}
              </p>
            )}
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{viewItem.content}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
