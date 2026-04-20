// src/pages/ScholarshipManagement.jsx
// Section A: Active Scholarships (CRUD)
// Section B: Donor Scholarship Requests

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { PageHeader } from '../components/common/UIComponents';
import { LoadingSpinner, EmptyState, Modal } from '../components/common/UIComponents';
import { StatusBadge } from '../components/common/StatusBadge';

const EMPTY_FORM = {
  title: '', description: '', eligibility_criteria: '',
  eligible_batch: '', deadline: '', funding_amount: '',
  required_documents: '', status: 'Active',
};

export default function ScholarshipManagement() {
  const [scholarships, setScholarships] = useState([]);
  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [sRes, rRes] = await Promise.all([
        api.get('/scholarships'),
        api.get('/donor-requests'),
      ]);
      setScholarships(sRes.data);
      setRequests(rRes.data);
    } catch (e) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (s)  => { setEditItem(s); setForm({ ...s }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.title) return toast.error('Title is required');
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/scholarships/${editItem.id}`, form);
        toast.success('Scholarship updated');
      } else {
        await api.post('/scholarships', form);
        toast.success('Scholarship created');
      }
      setModalOpen(false);
      load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this scholarship?')) return;
    try {
      await api.delete(`/scholarships/${id}`);
      toast.success('Deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <PageHeader title="Scholarship Management" breadcrumb="Dashboard > Scholarships">
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5">
          <Plus size={16} /> Add Scholarship
        </button>
      </PageHeader>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Section A — Active Scholarships */}
          <div className="card mb-6">
            <h2 className="font-semibold text-slate-700 mb-4">Active Scholarships</h2>
            {scholarships.length === 0 ? <EmptyState message="No scholarships yet." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-header">
                      {['Scholarship Name', 'Eligibility', 'Deadline', 'Amount (LKR)', 'Status', 'Action'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scholarships.map(s => (
                      <tr key={s.id} className="table-row">
                        <td className="px-3 py-3 font-medium text-slate-800">{s.title}</td>
                        <td className="px-3 py-3 text-slate-500">{s.eligibility_criteria}</td>
                        <td className="px-3 py-3 text-slate-500">{s.deadline ? new Date(s.deadline).toLocaleDateString() : '—'}</td>
                        <td className="px-3 py-3 text-slate-700">{s.funding_amount?.toLocaleString() || '—'}</td>
                        <td className="px-3 py-3"><StatusBadge status={s.status} /></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => navigate(`/scholarships/${s.id}/assign`)}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg" title="Assign Students">
                              <Eye size={15} />
                            </button>
                            <button onClick={() => openEdit(s)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => handleDelete(s.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section B — Donor Scholarship Requests */}
          <div className="card">
            <h2 className="font-semibold text-slate-700 mb-4">Donor Scholarship Requests</h2>
            {requests.length === 0 ? <EmptyState message="No donor requests." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-header">
                      {['Donor Name', 'Scholarship Title', 'Funding Amount', 'Submitted Date', 'Status', 'Action'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r.id} className="table-row">
                        <td className="px-3 py-3 font-medium">{r.donor_name}</td>
                        <td className="px-3 py-3">{r.scholarship_title}</td>
                        <td className="px-3 py-3">LKR {r.funding_amount?.toLocaleString()}</td>
                        <td className="px-3 py-3 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-3 py-3">
                          <button onClick={() => navigate(`/scholarships/requests/${r.id}`)}
                            className="text-xs btn-secondary">Review</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Scholarship' : 'Add Scholarship'}>
        <div className="grid gap-3">
          {[
            ['title', 'Scholarship Title *'],
            ['description', 'Description'],
            ['eligibility_criteria', 'Eligibility Criteria'],
            ['eligible_batch', 'Eligible Batch (e.g. 20/21)'],
            ['funding_amount', 'Funding Amount (LKR)'],
            ['required_documents', 'Required Documents'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-slate-500 mb-1 block">{label}</label>
              <input className="input-field" value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Application Deadline</label>
            <input type="date" className="input-field" value={form.deadline || ''} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Status</label>
            <select className="select-field w-full" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {['Active', 'Inactive', 'Draft'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
