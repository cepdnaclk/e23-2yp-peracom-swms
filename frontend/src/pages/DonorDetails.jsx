// src/pages/DonorDetails.jsx
// Full donor profile with scholarships and assigned students

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { PageHeader, LoadingSpinner, Modal } from '../components/common/UIComponents';
import { StatusBadge } from '../components/common/StatusBadge';

export default function DonorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donor, setDonor]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);

  const load = () => {
    api.get(`/donors/${id}`)
      .then(r => { setDonor(r.data); setForm(r.data); })
      .catch(() => toast.error('Failed to load donor'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusUpdate = async (status) => {
    try {
      await api.put(`/donors/${id}/status`, { status });
      toast.success(`Donor ${status.toLowerCase()}`);
      load();
    } catch { toast.error('Status update failed'); }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/donors/${id}`, form);
      toast.success('Donor details updated');
      setEditOpen(false);
      load();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!donor)  return <p className="text-center py-20 text-slate-500">Donor not found.</p>;

  const InfoField = ({ label, value }) => (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-sm font-medium text-slate-800 mt-0.5">{value || '—'}</dd>
    </div>
  );

  return (
    <div>
      <PageHeader title={donor.name} breadcrumb="Dashboard > Donors > Detail">
        <StatusBadge status={donor.status} />
      </PageHeader>

      <div className="max-w-4xl space-y-5">
        {/* Donor Info Card */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Donor Information</h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <InfoField label="Donor Name"         value={donor.name} />
            <InfoField label="Organization"        value={donor.organization} />
            <InfoField label="Email"               value={donor.email} />
            <InfoField label="Phone"               value={donor.phone} />
            <InfoField label="Address"             value={donor.address} />
            <InfoField label="Account Status"      value={donor.status} />
            <InfoField label="Total Contribution"  value={donor.total_contribution ? `LKR ${Number(donor.total_contribution).toLocaleString()}` : '—'} />
            <InfoField label="Available Fund"      value={donor.available_fund ? `LKR ${Number(donor.available_fund).toLocaleString()}` : '—'} />
            <InfoField label="Students Supported"  value={donor.students?.length ?? 0} />
            {donor.registered_at && <InfoField label="Registration Date" value={new Date(donor.registered_at).toLocaleDateString()} />}
          </dl>
          {donor.notes && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{donor.notes}</p>
            </div>
          )}
        </div>

        {/* Supported Scholarships */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Supported Scholarships</h2>
          {(!donor.scholarships || donor.scholarships.length === 0) ? (
            <p className="text-sm text-slate-400">No scholarships linked.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    {['Scholarship Name', 'Funding Amount', 'Status', 'Students Assigned'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {donor.scholarships.map(s => (
                    <tr key={s.id} className="table-row">
                      <td className="px-3 py-3 font-medium">{s.title}</td>
                      <td className="px-3 py-3">LKR {s.funding_amount?.toLocaleString() || '—'}</td>
                      <td className="px-3 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-3 py-3 text-center">
                        {donor.students?.filter(st => st.scholarship_id === s.id).length ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Approved Students Under Donor */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Assigned Students</h2>
          {(!donor.students || donor.students.length === 0) ? (
            <p className="text-sm text-slate-400">No students assigned yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    {['Student Name', 'Reg. Number', 'Scholarship', 'Batch', 'Status'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {donor.students.map((s, i) => (
                    <tr key={i} className="table-row">
                      <td className="px-3 py-3 font-medium">{s.applications?.student_name || '—'}</td>
                      <td className="px-3 py-3 text-slate-500">{s.applications?.registration_number || '—'}</td>
                      <td className="px-3 py-3 text-slate-500">{s.scholarships?.title || '—'}</td>
                      <td className="px-3 py-3 text-slate-500">{s.applications?.batch || '—'}</td>
                      <td className="px-3 py-3"><StatusBadge status={s.applications?.status || 'Approved'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pb-6">
          <button onClick={() => setEditOpen(true)} className="btn-secondary">✏️ Edit Donor Details</button>
          {donor.status === 'Pending Approval' && (
            <button onClick={() => handleStatusUpdate('Active')} className="btn-primary">✓ Approve Donor</button>
          )}
          {donor.status === 'Active' && (
            <button onClick={() => handleStatusUpdate('Suspended')} className="btn-danger">⛔ Suspend Donor</button>
          )}
          {donor.status === 'Suspended' && (
            <button onClick={() => handleStatusUpdate('Active')} className="btn-primary">✓ Activate Donor</button>
          )}
          <button onClick={() => navigate('/donors')} className="btn-secondary">← Back to Donor List</button>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Donor Details">
        <div className="grid gap-3">
          {[
            ['name',          'Donor Name'],
            ['organization',  'Organization'],
            ['email',         'Email'],
            ['phone',         'Phone'],
            ['address',       'Address'],
            ['available_fund','Available Fund (LKR)'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-slate-500 mb-1 block">{label}</label>
              <input className="input-field" value={form[key] || ''}
                onChange={e => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <button onClick={handleSaveEdit} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => setEditOpen(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
