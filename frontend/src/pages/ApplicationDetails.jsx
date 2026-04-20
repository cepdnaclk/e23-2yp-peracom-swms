// src/pages/ApplicationDetails.jsx
// Matches the UI design: purple theme, table-style info, document status badges

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { LoadingSpinner } from '../components/common/UIComponents';

export default function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason]   = useState('');
  const [action, setAction]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/applications/${id}`)
      .then(r => setApp(r.data))
      .catch(() => toast.error('Failed to load application'))
      .finally(() => setLoading(false));
  }, [id]);

  const makeDecision = async (status) => {
    if ((status === 'Rejected' || status === 'Resubmission Requested') && !reason.trim()) {
      return toast.error('Please enter a reason');
    }
    setSubmitting(true);
    try {
      await api.put(`/applications/${id}/decision`, { status, reason });
      toast.success(`Application ${status}`);
      navigate('/applications');
    } catch { toast.error('Action failed'); }
    finally { setSubmitting(false); }
  };

  const getDocStatusStyle = (status) => {
    switch (status) {
      case 'Verified':  return { badge: 'bg-purple-600 text-white', dot: 'bg-green-500' };
      case 'Submitted': return { badge: 'bg-white text-purple-700 border border-purple-300', dot: 'bg-green-500' };
      case 'Missing':   return { badge: 'bg-red-500 text-white', dot: 'bg-red-500' };
      case 'Rejected':  return { badge: 'bg-red-400 text-white', dot: 'bg-red-400' };
      default:          return { badge: 'bg-gray-200 text-gray-600', dot: 'bg-gray-400' };
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!app)    return <p className="text-center py-20 text-slate-500">Application not found.</p>;

  // Sample documents if none from DB
  const documents = app.documents?.length > 0 ? app.documents : [
    { id: 1, document_name: 'National Identity Card (NIC)', status: 'Submitted', file_url: null },
    { id: 2, document_name: 'Academic Transcript',          status: 'Verified',  file_url: null },
    { id: 3, document_name: 'Income Certificate',           status: 'Submitted', file_url: null },
    { id: 4, document_name: 'Recommendation Letter',        status: 'Missing',   file_url: null },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)' }}
      className="py-6 px-4">

      {/* Breadcrumb */}
      <div className="max-w-3xl mx-auto mb-3">
        <p className="text-sm text-purple-700">
          <span className="cursor-pointer hover:underline" onClick={() => navigate('/applications')}>Applications</span>
          {' › '}<span className="cursor-pointer hover:underline" onClick={() => navigate('/applications')}>Review</span>
          {' › '}<span className="text-purple-900 font-medium">Student Application</span>
        </p>
      </div>

      {/* Page Title */}
      <div className="max-w-3xl mx-auto mb-4">
        <h1 className="text-2xl font-bold text-purple-900">Application Details</h1>
        <p className="text-sm text-purple-800 mt-1">
          Scholarship: <span className="font-bold">{app.scholarship_title || 'Merit Fund Scholarship'}</span>
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">

        {/* Student Information */}
        <div className="bg-white/80 backdrop-blur rounded-xl border border-purple-200 overflow-hidden">
          <div className="bg-white/60 px-5 py-3 border-b border-purple-100">
            <h2 className="font-bold text-purple-900">Student Information</h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Full Name',            app.student_name || 'Samith Perera'],
                ['Registration Number',  app.registration_number || 'CG/2021/025'],
                ['Batch',                app.batch || '20/21'],
                ['Email',                app.email || 'samith.perera@email.com'],
                ['Phone',                app.phone || '+94 71 123 4567'],
                ['Department',           app.department || 'Department of Computer Engineering'],
              ].map(([label, value], i) => (
                <tr key={label} className={i % 2 === 0 ? 'bg-white/40' : 'bg-purple-50/40'}>
                  <td className="px-5 py-2.5 text-purple-800 font-medium w-44">{label}:</td>
                  <td className="px-5 py-2.5 text-slate-700">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Academic Details */}
        <div className="bg-white/80 backdrop-blur rounded-xl border border-purple-200 overflow-hidden">
          <div className="bg-white/60 px-5 py-3 border-b border-purple-100">
            <h2 className="font-bold text-purple-900">Academic Details</h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              ['Current Year / Level', app.current_year || '3'],
              ['GPA',                  app.gpa || '3.75'],
              ['Program / Department', app.department || 'Department of Computer Engineering'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center gap-4">
                <span className="text-sm text-purple-800 font-medium w-44 shrink-0">{label}:</span>
                <div className="flex-1 border border-purple-200 rounded-lg px-3 py-1.5 bg-white/60 text-sm text-slate-700 flex items-center justify-between">
                  {value}
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Details + Documents */}
        <div className="bg-white/80 backdrop-blur rounded-xl border border-purple-200 overflow-hidden">
          <div className="bg-white/60 px-5 py-3 border-b border-purple-100">
            <h2 className="font-bold text-purple-900">Financial Details</h2>
          </div>
          <div className="p-5 space-y-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-purple-800 font-medium w-52 shrink-0">Monthly Family Income (LKR):</span>
              <span className="text-slate-700">{app.monthly_income ? Number(app.monthly_income).toLocaleString() : '50,000'}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-purple-800 font-medium w-52 shrink-0">Number of Dependents:</span>
              <span className="text-slate-700">{app.dependents || '4'}</span>
            </div>
          </div>

          {/* Uploaded Documents */}
          <div className="border-t border-purple-100">
            <div className="px-5 py-3">
              <h2 className="font-bold text-purple-900">Uploaded Documents</h2>
            </div>

            {/* Documents Table Header */}
            <div className="px-5 pb-1">
              <div className="grid grid-cols-12 text-xs font-semibold text-purple-700 mb-1">
                <div className="col-span-6"></div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-4 text-center">Action</div>
              </div>
            </div>

            {/* Document Rows */}
            <div className="px-5 pb-4 space-y-2">
              {documents.map(doc => {
                const style = getDocStatusStyle(doc.status || 'Submitted');
                return (
                  <div key={doc.id} className="grid grid-cols-12 items-center">
                    {/* Doc name with dot */}
                    <div className="col-span-6 flex items-center gap-2 text-sm text-slate-700">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`}></span>
                      {doc.document_name}
                    </div>
                    {/* Status badge */}
                    <div className="col-span-2 flex justify-center">
                      <span className={`text-xs px-3 py-1 rounded-md font-medium ${style.badge}`}>
                        {doc.status || 'Submitted'}
                      </span>
                    </div>
                    {/* View / Download */}
                    <div className="col-span-4 flex justify-center gap-3 text-sm text-purple-700">
                      {doc.file_url ? (
                        <>
                          <a href={doc.file_url} target="_blank" rel="noreferrer"
                            className="hover:underline cursor-pointer">View</a>
                          <span className="text-purple-300">/</span>
                          <a href={doc.file_url} download className="hover:underline cursor-pointer">Download</a>
                        </>
                      ) : (
                        <>
                          <span className="text-purple-400 cursor-not-allowed">View</span>
                          <span className="text-purple-300">/</span>
                          <span className="text-purple-400 cursor-not-allowed">Download</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Admin Decision Buttons */}
        {app.status === 'Pending' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 justify-center">
              {action === '' && (
                <>
                  <button
                    onClick={() => makeDecision('Approved')}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium text-sm transition-all"
                    style={{ background: 'linear-gradient(135deg, #6d28d9, #7c3aed)' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve Application
                  </button>
                  <button
                    onClick={() => setAction('reject')}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium text-sm bg-red-500 hover:bg-red-600 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject Application
                  </button>
                  <button
                    onClick={() => setAction('resubmit')}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium text-sm transition-all"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Request Resubmission
                  </button>
                </>
              )}
            </div>

            {/* Reason textarea */}
            {(action === 'reject' || action === 'resubmit') && (
              <div className="space-y-3">
                <textarea
                  rows={3}
                  className="w-full border border-purple-200 rounded-lg px-4 py-3 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  placeholder={
                    action === 'reject'
                      ? 'Enter rejection reason...'
                      : 'e.g. Recommendation letter is missing. Please upload the required document.'
                  }
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => makeDecision(action === 'reject' ? 'Rejected' : 'Resubmission Requested')}
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-lg text-white font-medium text-sm transition-all"
                    style={{ background: action === 'reject' ? '#ef4444' : 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}
                  >
                    {submitting ? 'Submitting...' : action === 'reject' ? 'Confirm Rejection' : 'Send Request'}
                  </button>
                  <button
                    onClick={() => { setAction(''); setReason(''); }}
                    className="px-6 py-2.5 rounded-lg font-medium text-sm bg-white/80 text-purple-700 border border-purple-200 hover:bg-white transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Already decided */}
        {app.status !== 'Pending' && (
          <div className="bg-white/80 rounded-xl border border-purple-200 p-4 text-center">
            <p className="text-sm text-purple-700">
              This application has been <span className="font-bold">{app.status}</span>.
            </p>
            {app.admin_reason && (
              <p className="text-sm text-slate-600 mt-2 italic">"{app.admin_reason}"</p>
            )}
          </div>
        )}

        <div className="pb-6">
          <button onClick={() => navigate('/applications')}
            className="text-sm text-purple-700 hover:underline">← Back to Applications</button>
        </div>
      </div>
    </div>
  );
}
