import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { StatusBadge } from '../../components/common/StatusBadge'
import api from '../../services/api'
import { format } from 'date-fns'

import { ArrowLeft, Check, X } from 'lucide-react'

const normalizeDocuments = (documents) => {
  if (!documents) return []

  if (Array.isArray(documents)) {
    return documents.filter(Boolean)
  }

  if (typeof documents === 'string') {
    return documents
      .split(',')
      .map(document => document.trim())
      .filter(Boolean)
  }

  return []
}
export default function ScholarshipRequestReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [req, setReq] = useState(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [publishConfirmed, setPublishConfirmed] = useState(false)
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
  
  const standardDocuments = [
  'NIC Copy',
  'Academic Transcript',
  'Faculty Acceptance Letter',
  'Student Request Letter',
  'University ID Copy'
]

const requestedDocuments = normalizeDocuments(
  req.required_documents
)

const supplementaryDocuments = normalizeDocuments(
  req.supplementary_documents
)

const amountPerStudent = Number(req.funding_amount || 0)
const numberOfStudents = Number(req.num_students || 0)

const totalCommitment =
  amountPerStudent * numberOfStudents
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
          onClick={() => {
  setPublishConfirmed(false)
  setApproving(true)
}}
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
     {/* Final Approval and Publishing Confirmation */}
{approving && (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Check size={24} className="text-purple-600" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Approve and publish scholarship?
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Please review these important details before making the
              scholarship visible to students.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Scholarship name */}
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
            Scholarship
          </p>

          <p className="mt-1 font-bold text-purple-900">
            {req.scholarship_title}
          </p>

          <p className="mt-1 text-sm text-purple-700">
            Offered by {req.donor_name || 'Donor'}
          </p>
        </div>

        {/* Important financial details */}
        <div>
          <h4 className="text-sm font-bold text-slate-800 mb-3">
            Funding summary
          </h4>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500">
                Amount per student
              </p>

              <p className="mt-1 text-base font-bold text-slate-900">
                LKR {amountPerStudent.toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500">
                Students supported
              </p>

              <p className="mt-1 text-base font-bold text-slate-900">
                {numberOfStudents}
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs text-green-700">
                Total commitment
              </p>

              <p className="mt-1 text-base font-bold text-green-800">
                LKR {totalCommitment.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Eligibility and dates */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Eligible batches
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              {req.eligible_batch || 'Not specified'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">
              Opening date
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              {req.opening_date
                ? format(
                    new Date(req.opening_date),
                    'MMM d, yyyy'
                  )
                : 'Not specified'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">
              Application deadline
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              {req.application_deadline
                ? format(
                    new Date(req.application_deadline),
                    'MMM d, yyyy'
                  )
                : 'Not specified'}
            </p>
          </div>
        </div>

        {/* Standard documents */}
        <div>
          <h4 className="text-sm font-bold text-slate-800">
            Standard required documents
          </h4>

          <p className="mt-1 text-xs text-slate-500">
            Every student must upload these documents.
          </p>

          <div className="mt-3 grid sm:grid-cols-2 gap-2">
            {standardDocuments.map(document => (
              <div
                key={document}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5"
              >
                <Check
                  size={15}
                  className="text-green-600 flex-shrink-0"
                />

                <span className="text-sm text-slate-700">
                  {document}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Additional required documents if stored separately */}
        {requestedDocuments.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Documents selected in this request
            </h4>

            <div className="mt-3 flex flex-wrap gap-2">
              {requestedDocuments.map((document, index) => (
                <span
                  key={`${document}-${index}`}
                  className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-3 py-2 text-sm"
                >
                  {document}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Supplementary documents */}
        <div>
          <h4 className="text-sm font-bold text-slate-800">
            Supplementary documents
          </h4>

          <p className="mt-1 text-xs text-slate-500">
            These are additional documents specifically requested by
            the donor.
          </p>

          {supplementaryDocuments.length > 0 ? (
            <div className="mt-3 space-y-2">
              {supplementaryDocuments.map((document, index) => (
                <div
                  key={`${document}-${index}`}
                  className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5"
                >
                  <span className="text-amber-600">!</span>

                  <span className="text-sm font-medium text-amber-900">
                    {document}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 text-sm text-slate-500">
              No supplementary documents requested.
            </div>
          )}
        </div>

        {/* Final warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-900">
            Important
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-800">
            After publishing, this scholarship becomes visible to
            eligible students and applications can begin according to
            the opening date.
          </p>
        </div>

        {/* Confirmation checkbox */}
        <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
          <input
            type="checkbox"
            checked={publishConfirmed}
            onChange={(event) =>
              setPublishConfirmed(event.target.checked)
            }
            className="mt-1 w-4 h-4 accent-purple-600"
          />

          <span className="text-sm leading-6 text-slate-700">
            I have reviewed the funding amount, number of students,
            eligibility requirements and all required documents. I
            want to approve and publish this scholarship.
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 p-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setApproving(false)
            setPublishConfirmed(false)
          }}
          disabled={actionLoading}
          className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleApprove}
          disabled={!publishConfirmed || actionLoading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {actionLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Check size={16} />
              Confirm and Publish
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
