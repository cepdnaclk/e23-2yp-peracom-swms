// src/pages/ScholarshipRequestReview.jsx
// Admin reviews a donor-submitted scholarship request

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { PageHeader, LoadingSpinner } from '../components/common/UIComponents';
import { StatusBadge } from '../components/common/StatusBadge';

export default function ScholarshipRequestReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [rejecting, setRejecting]     = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    api.get(`/donor-requests/${id}`)
      .then(r => setRequest(r.data))
      .catch(() => toast.error('Failed to load request'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDecision = async (status) => {
    if (status === 'Rejected' && !rejectionReason.trim()) {
      return toast.error('Please enter a rejection reason');
    }
    setSubmitting(true);
    try {
      await api.put(`/donor-requests/${id}/review`, {
        status,
        rejection_reason: status === 'Rejected' ? rejectionReason : undefined,
      });
      toast.success(status === 'Approved' ? 'Request approved & scholarship published!' : 'Request rejected');
      navigate('/scholarships');
    } catch { toast.error('Action failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!request) return <p className="text-center text-slate-500 py-20">Request not found.</p>;

  const fields = [
    ['Scholarship Title', request.scholarship_title],
    ['Donor Name',        request.donor_name],
    ['Funding Amount',    `LKR ${request.funding_amount?.toLocaleString()}`],
    ['Eligible Batch',    request.eligible_batch],
    ['Application Deadline', request.application_deadline ? new Date(request.application_deadline).toLocaleDateString() : '—'],
    ['Required Documents', request.required_documents],
  ];

  return (
    <div>
      <PageHeader title="Scholarship Request Review" breadcrumb="Scholarships > Requests > Review">
        <StatusBadge status={request.status} />
      </PageHeader>

      <div className="max-w-2xl">
        {/* Details */}
        <div className="card mb-5">
          <h2 className="font-semibold text-slate-700 mb-4">Scholarship Details</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
            {fields.map(([label, val]) => (
              <div key={label}>
                <dt className="text-xs text-slate-400">{label}</dt>
                <dd className="text-sm font-medium text-slate-800 mt-0.5">{val || '—'}</dd>
              </div>
            ))}
          </dl>
          {request.description && (
            <div className="mt-4">
              <p className="text-xs text-slate-400 mb-1">Description</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{request.description}</p>
            </div>
          )}
          {request.eligibility_criteria && (
            <div className="mt-3">
              <p className="text-xs text-slate-400 mb-1">Eligibility Criteria</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{request.eligibility_criteria}</p>
            </div>
          )}
          {request.notes && (
            <div className="mt-3">
              <p className="text-xs text-slate-400 mb-1">Notes</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{request.notes}</p>
            </div>
          )}
        </div>

        {/* Admin Actions — only show if Pending */}
        {request.status === 'Pending' && (
          <div className="card">
            <h2 className="font-semibold text-slate-700 mb-4">Admin Decision</h2>

            {/* Rejection reason form */}
            {rejecting && (
              <div className="mb-4">
                <label className="text-xs text-slate-500 mb-1 block">Rejection Reason *</label>
                <textarea
                  rows={4}
                  className="input-field resize-none"
                  placeholder="e.g. Eligibility criteria are incomplete. Please specify GPA requirements."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-3">
              {!rejecting && (
                <button
                  onClick={() => handleDecision('Approved')}
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  ✓ Approve & Publish
                </button>
              )}
              {!rejecting ? (
                <button onClick={() => setRejecting(true)} className="btn-danger flex-1">
                  ✕ Reject Request
                </button>
              ) : (
                <>
                  <button onClick={() => handleDecision('Rejected')} disabled={submitting} className="btn-danger flex-1">
                    {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                  <button onClick={() => { setRejecting(false); setRejectionReason(''); }} className="btn-secondary">
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Show existing rejection reason */}
        {request.status === 'Rejected' && request.rejection_reason && (
          <div className="card border border-red-100 bg-red-50">
            <p className="text-xs text-red-500 font-medium mb-1">Rejection Reason</p>
            <p className="text-sm text-red-700">{request.rejection_reason}</p>
          </div>
        )}

        <button onClick={() => navigate('/scholarships')} className="btn-secondary mt-4">← Back to Scholarships</button>
      </div>
    </div>
  );
}
