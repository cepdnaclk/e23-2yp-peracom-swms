// src/pages/IssueManagement.jsx
// Lists all reported issues with search, filter, status update and reply

import { useEffect, useState } from 'react';
import { Search, AlertCircle, Loader, CheckCircle, FileQuestion } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { SummaryCard } from '../components/common/SummaryCard';
import { PageHeader, LoadingSpinner, EmptyState, Modal } from '../components/common/UIComponents';
import { StatusBadge } from '../components/common/StatusBadge';

const STATUSES   = ['', 'Open', 'In Progress', 'Resolved', 'Draft'];
const CATEGORIES = ['', 'Scholarship Issue', 'Document Issue', 'System Issue', 'Application Inquiry'];

export default function IssueManagement() {
  const [issues, setIssues]       = useState([]);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter]   = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selected, setSelected]   = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reply, setReply]         = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)         params.search   = search;
      if (statusFilter)   params.status   = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const [iRes, sRes] = await Promise.all([
        api.get('/issues', { params }),
        api.get('/issues/summary'),
      ]);
      setIssues(iRes.data);
      setSummary(sRes.data);
    } catch { toast.error('Failed to load issues'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, statusFilter, categoryFilter]);

  const openIssue = (issue) => {
    setSelected(issue);
    setReply(issue.admin_reply || '');
    setNewStatus(issue.status);
    setModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/issues/${selected.id}`, { status: newStatus, admin_reply: reply });
      toast.success('Issue updated');
      setModalOpen(false);
      load();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Issue Management" breadcrumb="Dashboard > Issues" />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard title="Total Issues"       value={summary.total}      icon={FileQuestion} color="purple" />
          <SummaryCard title="Open Issues"        value={summary.open}       icon={AlertCircle}  color="red"    />
          <SummaryCard title="In Progress"        value={summary.inProgress} icon={Loader}       color="blue"   />
          <SummaryCard title="Resolved Issues"    value={summary.resolved}   icon={CheckCircle}  color="green"  />
        </div>
      )}

      {/* Search & Filters */}
      <div className="card mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-8" placeholder="Search issue title..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select-field" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
        </select>
        <select className="select-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      {/* Issues Table */}
      <div className="card">
        {loading ? <LoadingSpinner /> : issues.length === 0 ? <EmptyState message="No issues found." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  {['Issue Title', 'Reported By', 'Category', 'Status', 'Date', 'Action'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {issues.map(issue => (
                  <tr key={issue.id} className="table-row">
                    <td className="px-3 py-3 font-medium text-slate-800 max-w-[200px] truncate">{issue.title}</td>
                    <td className="px-3 py-3 text-slate-500">{issue.reported_by}</td>
                    <td className="px-3 py-3">
                      <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{issue.category}</span>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={issue.status} /></td>
                    <td className="px-3 py-3 text-slate-400 text-xs">
                      {new Date(issue.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => openIssue(issue)} className="text-xs btn-secondary">
                        View / Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Issue Detail + Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Issue Details">
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400">Issue Title</p>
              <p className="font-semibold text-slate-800">{selected.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400">Reported By</p>
                <p className="text-sm text-slate-700">{selected.reported_by}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Category</p>
                <p className="text-sm text-slate-700">{selected.category}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Date Reported</p>
                <p className="text-sm text-slate-700">{new Date(selected.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Current Status</p>
                <StatusBadge status={selected.status} />
              </div>
            </div>
            {selected.description && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Description</p>
                <p className="text-sm text-slate-700">{selected.description}</p>
              </div>
            )}

            {/* Admin Reply */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Admin Reply</label>
              <textarea rows={3} className="input-field resize-none"
                placeholder="Write a reply to the reporter..."
                value={reply} onChange={e => setReply(e.target.value)} />
            </div>

            {/* Change Status */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Change Status</label>
              <select className="select-field w-full" value={newStatus}
                onChange={e => setNewStatus(e.target.value)}>
                {['Open', 'In Progress', 'Resolved', 'Draft'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex gap-2">
              <button onClick={handleUpdate} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
