// src/pages/AssignStudentsToDonor.jsx
// FULLY FIXED — works even if scholarship_id is null in applications table

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { PageHeader, LoadingSpinner } from '../components/common/UIComponents';
import { StatusBadge } from '../components/common/StatusBadge';

export default function AssignStudentsToDonor() {
  const { id } = useParams(); // scholarship id from URL
  const navigate = useNavigate();

  const [scholarship, setScholarship]         = useState(null);
  const [donor, setDonor]                     = useState(null);
  const [students, setStudents]               = useState([]);
  const [selected, setSelected]               = useState([]);
  const [alreadyAssigned, setAlreadyAssigned] = useState([]);
  const [note, setNote]                       = useState('');
  const [loading, setLoading]                 = useState(true);
  const [submitting, setSubmitting]           = useState(false);

  // ── Load all data ─────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Load scholarship
        const schRes = await api.get(`/scholarships/${id}`);
        const sch = schRes.data;
        setScholarship(sch);

        // 2. Load donor if linked
        if (sch?.donor_id) {
          try {
            const donorRes = await api.get(`/donors/${sch.donor_id}`);
            setDonor(donorRes.data);
          } catch {
            console.warn('Donor not found');
          }
        }

        // 3. Load approved students using the assignment endpoint
        //    This endpoint does smart matching (by id OR by title)
        const assignRes = await api.get(`/assignments/scholarship/${id}`);
        const approvedList = assignRes.data?.approvedStudents || [];

        console.log('Approved students loaded:', approvedList.length, approvedList);
        setStudents(approvedList);

        // 4. Track already assigned
        const assignedIds = approvedList
          .filter(s => s.already_assigned)
          .map(s => s.id);
        setAlreadyAssigned(assignedIds);

      } catch (err) {
        console.error('Load error:', err);
        toast.error('Failed to load data. Check console for details.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // ── Selection logic ───────────────────────────────────────
  const selectableStudents = students.filter(s => !alreadyAssigned.includes(s.id));
  const selectableIds      = selectableStudents.map(s => s.id);
  const allSelected        = selectableIds.length > 0 && selected.length === selectableIds.length;

  const toggleStudent = (studentId) => {
    setSelected(prev =>
      prev.includes(studentId)
        ? prev.filter(s => s !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAll = () => {
    setSelected(allSelected ? [] : [...selectableIds]);
  };

  // ── Assign ────────────────────────────────────────────────
  const handleAssign = async () => {
    if (selected.length === 0) return toast.error('Please select at least one student');

    setSubmitting(true);
    try {
      const res = await api.post('/assignments', {
        scholarship_id: id,
        student_ids:    selected,
        note:           note || null,
      });
      toast.success(res.data.message || `${selected.length} student(s) assigned!`);
      navigate('/scholarships');
    } catch (err) {
      console.error('Assign error:', err);
      toast.error(err.response?.data?.error || 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Assign Students to Donor"
        breadcrumb="Scholarships > Approved Students > Assign to Donor"
      />

      <div className="max-w-4xl space-y-5">

        {/* ── Scholarship Details ── */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Scholarship Details</h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              ['Scholarship Title',  scholarship?.title || '—'],
              ['Donor Name',         donor?.name || 'No donor linked'],
              ['Funding Amount',     scholarship?.funding_amount
                                       ? `LKR ${Number(scholarship.funding_amount).toLocaleString()}`
                                       : '—'],
              ['Approved Students',  students.length],
              ['Already Assigned',   alreadyAssigned.length],
              ['Eligible Batch',     scholarship?.eligible_batch || '—'],
            ].map(([label, val]) => (
              <div key={label}>
                <dt className="text-xs text-slate-400">{label}</dt>
                <dd className="text-sm font-semibold text-slate-800 mt-0.5">{val}</dd>
              </div>
            ))}
          </dl>

          {/* Warning if no donor linked */}
          {!scholarship?.donor_id && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              ⚠️ No donor is linked to this scholarship. Please link a donor before assigning students.
            </div>
          )}
        </div>

        {/* ── Approved Students Table ── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">
              Approved Students
              <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                {students.length} total
              </span>
            </h2>
            {students.length > 0 && (
              <span className="text-xs text-slate-400">
                {selected.length} of {selectableIds.length} selected
              </span>
            )}
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm font-medium">No approved students found for this scholarship.</p>
              <p className="text-xs mt-1">
                Go to <strong>Application Review</strong>, find applications for this scholarship,
                and set their status to <strong>Approved</strong>.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    {/* Select all checkbox */}
                    <th className="px-3 py-2.5 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="accent-purple-600 w-4 h-4 cursor-pointer"
                        title={allSelected ? 'Deselect all' : 'Select all'}
                      />
                    </th>
                    {['Student Name', 'Reg. Number', 'Batch', 'GPA', 'Department', 'Status'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => {
                    const isAssigned = alreadyAssigned.includes(student.id);
                    const isSelected = selected.includes(student.id);

                    return (
                      <tr
                        key={student.id}
                        onClick={() => !isAssigned && toggleStudent(student.id)}
                        className={`border-b border-slate-100 transition-colors duration-100 ${
                          isAssigned
                            ? 'opacity-50 bg-slate-50 cursor-not-allowed'
                            : isSelected
                              ? 'bg-purple-50 cursor-pointer'
                              : 'hover:bg-purple-50/40 cursor-pointer'
                        }`}
                      >
                        {/* Checkbox — stop row click propagation */}
                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isAssigned}
                            onChange={() => !isAssigned && toggleStudent(student.id)}
                            className="accent-purple-600 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-800">
                          {student.student_name}
                          {isAssigned && (
                            <span className="ml-2 text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">
                              Already Assigned
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-500">{student.registration_number || '—'}</td>
                        <td className="px-3 py-3 text-slate-500">{student.batch || '—'}</td>
                        <td className="px-3 py-3">
                          {student.gpa ? (
                            <span className={`font-medium ${Number(student.gpa) >= 3.5 ? 'text-green-600' : 'text-slate-600'}`}>
                              {student.gpa}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-3 text-slate-500">{student.department || '—'}</td>
                        <td className="px-3 py-3"><StatusBadge status={student.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Assignment Confirmation ── */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Assignment Confirmation</h2>

          <dl className="grid grid-cols-3 gap-4 mb-5">
            <div>
              <dt className="text-xs text-slate-400">Scholarship</dt>
              <dd className="text-sm font-medium text-slate-800 mt-0.5">{scholarship?.title || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Linked Donor</dt>
              <dd className="text-sm font-medium text-slate-800 mt-0.5">{donor?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Selected Students</dt>
              {/* Dynamically updates as checkboxes are clicked */}
              <dd className={`text-3xl font-bold mt-0.5 transition-all duration-200 ${
                selected.length > 0 ? 'text-purple-600' : 'text-slate-300'
              }`}>
                {selected.length}
              </dd>
            </div>
          </dl>

          {/* Selected student name chips */}
          {selected.length > 0 && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 mb-4">
              <p className="text-xs text-purple-600 font-semibold mb-2">
                Selected ({selected.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.map(sid => {
                  const s = students.find(st => st.id === sid);
                  return s ? (
                    <span key={sid}
                      className="bg-white text-purple-700 text-xs px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1.5">
                      {s.student_name}
                      <button
                        onClick={() => toggleStudent(sid)}
                        className="text-purple-300 hover:text-red-500 font-bold leading-none"
                        title="Remove"
                      >×</button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Optional note */}
          <div className="mb-5">
            <label className="text-xs text-slate-500 mb-1 block">Note (Optional)</label>
            <textarea
              rows={2}
              className="input-field resize-none"
              placeholder="e.g. Assigned based on approved scholarship funding."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAssign}
              disabled={submitting || selected.length === 0 || !scholarship?.donor_id}
              className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Assigning...'
                : selected.length === 0
                  ? 'Select Students First'
                  : `Assign ${selected.length} Student${selected.length > 1 ? 's' : ''} to Donor`}
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
