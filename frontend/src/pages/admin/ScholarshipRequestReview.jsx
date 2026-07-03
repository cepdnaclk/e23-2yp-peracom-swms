import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { StatusBadge } from '../../components/common/StatusBadge'
import api from '../../services/api'
import { format } from 'date-fns'

export default function ScholarshipRequestReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [req, setReq] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    api.get(`/scholarships/requests/${id}`)
      .then(r => setReq(r.data))
      .catch(() => toast.error('Not found'))
      .finally(() => setLoading(false))
  }, [id])

  const handleApprove = async () => {
    await api.post(`/scholarships/requests/${id}/approve`)
    toast.success('Request approved & scholarship published!')
    navigate('/scholarships')
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error('Rejection reason required')
    await api.post(`/scholarships/requests/${id}/reject`, { rejection_reason: rejectReason })
    toast.success('Request rejected')
    navigate('/scholarships')
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>
  if (!req) return <div className="p-8 text-center text-slate-400">Request not found.</div>

  const Field = ({ label, value }) => (
    <div>
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumb items={[{ label: 'Scholarships', href: '/scholarships' }, { label: 'Requests' }, { label: 'Review' }]} />

      <div className="flex items-center justify-between">
        <h1 className="page-title">Review Scholarship Request</h1>
        <StatusBadge status={req.status || 'Pending'} />
      </div>

      {/* Details */}
      <div className="card p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <Field label="Scholarship Title" value={req.scholarship_title} />
          <Field label="Donor Name" value={req.donor_name} />
          <Field label="Funding Amount" value={req.funding_amount ? `LKR ${Number(req.funding_amount).toLocaleString()}` : null} />
          <Field label="Eligible Batch" value={req.eligible_batch} />
          <Field label="Application Deadline" value={req.application_deadline ? format(new Date(req.application_deadline), 'MMM d, yyyy') : null} />
          <Field label="Required Documents" value={req.required_documents} />
        </div>

        {req.description && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Description</p>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">{req.description}</div>
          </div>
        )}
        {req.eligibility_criteria && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Eligibility Criteria</p>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">{req.eligibility_criteria}</div>
          </div>
        )}
        {req.notes && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Notes</p>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">{req.notes}</div>
          </div>
        )}
      </div>

      {/* Decision */}
      {req.status === 'Pending' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-700">Admin Decision</h2>
          {!rejecting ? (
            <div className="flex gap-3">
              <button onClick={handleApprove} className="btn-primary flex-1">✓ Approve & Publish</button>
              <button onClick={() => setRejecting(true)} className="btn-danger flex-1">✕ Reject Request</button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Rejection Reason *</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. Eligibility criteria are incomplete. Please specify GPA requirements."
                className="input-field resize-none"
              />
              <div className="flex gap-3">
                <button onClick={handleReject} className="btn-danger flex-1">Confirm Rejection</button>
                <button onClick={() => setRejecting(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {req.status === 'Rejected' && req.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <p className="font-medium mb-1">Rejection Reason:</p>
          <p>{req.rejection_reason}</p>
        </div>
      )}
    </div>
  )
}
