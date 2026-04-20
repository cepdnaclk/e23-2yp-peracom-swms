// src/pages/AssignStudentsToDonor.jsx
// Admin selects approved students and assigns them to the scholarship's linked donor

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { PageHeader, LoadingSpinner } from '../components/common/UIComponents';
import { StatusBadge } from '../components/common/StatusBadge';

export default function AssignStudentsToDonor() {
  const { id } = useParams(); // scholarship id
  const navigate = useNavigate();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState([]);
  const [note, setNote]           = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/assignments/scholarship/${id}`)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load scholarship data'))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleStudent = (studentId) => {
    setSelected(prev =>
      prev.includes(studentId) ? prev.filter(s => s !== studentId) : [...prev, studentId]
    );
  };

  const toggleAll = () => {
    if (!data) return;
    const allIds = data.approvedStudents.map(s => s.id);
    setSelected(selected.length === allIds.length ? [] : allIds);
  };

  const handleAssign = async () => {
    if (selected.length === 0) return toast.error('Please select at least one student');
    setSubmitting(true);
    try {
      await api.post('/assignments', {
        scholarship_id: id,
        student_ids: selected,
        note,
      });
      toast.success(`${selected.length} student(s) assigned successfully!`);
      navigate('/scholarships');
    } catch { toast.error('Assignment failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!data)   return <p className="text-center py-20 text-slate-500">Data not found.</p>;

  const { scholarship, donor, approvedStudents, alreadyAssignedCount } = data;
  const allSelected = selected.length === approvedStudents.length && approvedStudents.length > 0;

  return (
    <div>
      <PageHeader title="Assign Students to Donor"
        breadcrumb="Scholarships > Approved Students > Assign to Donor" />

      <div className="max-w-4xl space-y-5">
        {/* Section A: Scholarship Details */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Scholarship Details</h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              ['Scholarship Title', scholarship.title],
              ['Donor Name',        donor?.name || '—'],
              ['Funding Amount',    `LKR ${scholarship.funding_amount?.toLocaleString() || '—'}`],
              ['Approved Students', approvedStudents.length],
              ['Already Assigned',  alreadyAssignedCount],
              ['Eligible Batch',    scholarship.eligible_batch || '—'],
            ].map(([label, val]) => (
              <div key={label}>
                <dt className="text-xs text-slate-400">{label}</dt>
                <dd className="text-sm font-semibold text-slate-800 mt-0.5">{val}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Section B: Approved Students */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Approved Students</h2>
          {approvedStudents.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No approved students for this scholarship yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-3 py-2.5">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll}
                        className="accent-purple-600" />
                    </th>
                    {['Student Name', 'Reg. Number', 'Batch', 'GPA', 'Department', 'Status'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {approvedStudents.map(s => (
                    <tr key={s.id} className="table-row">
                      <td className="px-3 py-3">
                        <input type="checkbox"
                          checked={selected.includes(s.id)}
                          onChange={() => toggleStudent(s.id)}
                          className="accent-purple-600" />
                      </td>
                      <td className="px-3 py-3 font-medium">{s.student_name}</td>
                      <td className="px-3 py-3 text-slate-500">{s.registration_number}</td>
                      <td className="px-3 py-3 text-slate-500">{s.batch}</td>
                      <td className="px-3 py-3 text-slate-500">{s.gpa}</td>
                      <td className="px-3 py-3 text-slate-500">{s.department}</td>
                      <td className="px-3 py-3"><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section C: Assignment Confirmation */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Assignment Confirmation</h2>
          <dl className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <dt className="text-xs text-slate-400">Scholarship</dt>
              <dd className="text-sm font-medium text-slate-800">{scholarship.title}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Linked Donor</dt>
              <dd className="text-sm font-medium text-slate-800">{donor?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Selected Students</dt>
              <dd className="text-2xl font-bold text-purple-600">{selected.length}</dd>
            </div>
          </dl>

          {/* Optional note */}
          <div className="mb-4">
            <label className="text-xs text-slate-500 mb-1 block">Note (Optional)</label>
            <textarea
              rows={2}
              className="input-field resize-none"
              placeholder="e.g. Assigned based on approved scholarship funding."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={handleAssign} disabled={submitting || selected.length === 0} className="btn-primary flex-1">
              {submitting ? 'Assigning...' : `Assign ${selected.length} Student(s)`}
            </button>
            <button onClick={() => navigate('/scholarships')} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
