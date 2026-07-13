import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { StatusBadge } from '../../components/common/StatusBadge'
import api from '../../services/api'
import { format } from 'date-fns'

import { ArrowLeft, Check, X } from 'lucide-react'

export default function ScholarshipRequestReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [req, setReq] = useState(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
const [rejecting, setRejecting] = useState(false)
const [rejectReason, setRejectReason] = useState('')
const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    api.get(`/scholarships/requests/${id}`)
      .then(r => setReq(r.data))
      .catch(() => toast.error('Not found'))
      .finally(() => setLoading(false))
  }, [id])

  const handleApprove = async () => {
  if (actionLoading) return

  setActionLoading(true)

  try {
    const res = await api.post(
      `/scholarships/requests/${id}/approve`
    )

    const { emailResults } = res.data

    if (emailResults?.donor?.success) {
      toast.success(
        `Scholarship published successfully. ${
          emailResults.students?.sent || 0
        } student(s) notified.`
      )
    } else if (emailResults?.donor?.error) {
      toast(
        `Scholarship published, but the donor email failed: ${emailResults.donor.error}`,
        { icon: '⚠️' }
      )
    } else {
      toast.success('Scholarship approved and published successfully')
    }

    navigate('/scholarships')
  } catch (err) {
    toast.error(
      err.response?.data?.message ||
        'Failed to approve the scholarship request'
    )
  } finally {
    setActionLoading(false)
    setApproving(false)
  }
}
  
  const handleReject = async () => {
  const reason = rejectReason.trim()

  if (reason.length < 10) {
    return toast.error(
      'Please provide a clear rejection reason of at least 10 characters'
    )
  }

  if (actionLoading) return

  setActionLoading(true)

  try {
    const res = await api.post(
      `/scholarships/requests/${id}/reject`,
      {
        rejection_reason: reason
      }
    )

    const { emailResult } = res.data

    if (emailResult?.success) {
      toast.success(
        'Request rejected. The donor has been notified by email.'
      )
    } else if (emailResult?.error) {
      toast(
        `Request rejected, but the donor email failed: ${emailResult.error}`,
        { icon: '⚠️' }
      )
    } else {
      toast.success('Scholarship request rejected')
    }

    navigate('/scholarships')
  } catch (err) {
    toast.error(
      err.response?.data?.message ||
        'Failed to reject the scholarship request'
    )
  } finally {
    setActionLoading(false)
    setRejecting(false)
  }
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
         <Field
  label="Amount per Student"
  value={
    req.funding_amount
      ? `LKR ${Number(req.funding_amount).toLocaleString()}`
      : null
  }
/>
          <Field label="Students to Support" value={req.num_students} />
          <Field label="Eligible Batch" value={req.eligible_batch} />
          <Field label="Opening Date" value={req.opening_date ? format(new Date(req.opening_date), 'MMM d, yyyy') : null} />
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
        {req.terms && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Rules & Conditions</p>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">{req.terms}</div>
          </div>
        )}
        {req.notes && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Notes</p>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">{req.notes}</div>
          </div>
        )}
      </div>

      
      {/* Admin Decision */}
{req.status === 'Pending' && (
  <div className="card p-6 space-y-5">
    <div>
      <h2 className="text-base font-semibold text-slate-800">
        Admin Decision
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Publishing will make this scholarship visible to eligible
        students.
      </p>
    </div>

    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100">
      <button
        type="button"
        onClick={() => navigate('/scholarships')}
        disabled={actionLoading}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
      >
        <ArrowLeft size={16} />
        Back to Requests
      </button>

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => setRejecting(true)}
          disabled={actionLoading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-red-300 text-red-600 bg-white hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <X size={16} />
          Reject Request
        </button>

        <button
          type="button"
          onClick={() => setApproving(true)}
          disabled={actionLoading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
        >
          <Check size={16} />
          Approve & Publish
        </button>
      </div>
    </div>
  </div>
)}
      {/* Approval Confirmation Modal */}
{approving && (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6">
      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
        <Check size={24} className="text-purple-600" />
      </div>

      <h3 className="text-lg font-bold text-slate-900">
        Publish this scholarship?
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        This will approve{' '}
        <strong className="text-slate-800">
          {req.scholarship_title}
        </strong>{' '}
        and make it visible to eligible students.
      </p>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={() => setApproving(false)}
          disabled={actionLoading}
          className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleApprove}
          disabled={actionLoading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {actionLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Check size={16} />
              Publish Scholarship
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}
      {/* Rejection Confirmation Modal */}
{rejecting && (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <X size={24} className="text-red-600" />
      </div>

      <h3 className="text-lg font-bold text-slate-900">
        Reject scholarship request
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Explain why this request is being rejected. This feedback will
        be shown to the donor.
      </p>

      <div className="mt-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Rejection reason *
        </label>

        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={5}
          maxLength={500}
          placeholder="For example: Please provide clearer eligibility criteria and correct the application deadline."
          className="input-field resize-none"
        />

        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-slate-400">
            Minimum 10 characters
          </span>

          <span className="text-xs text-slate-400">
            {rejectReason.length}/500
          </span>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={() => {
            setRejecting(false)
            setRejectReason('')
          }}
          disabled={actionLoading}
          className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleReject}
          disabled={
            actionLoading || rejectReason.trim().length < 10
          }
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {actionLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Rejecting...
            </>
          ) : (
            <>
              <X size={16} />
              Reject Request
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}
      
    </div>
  )
}
