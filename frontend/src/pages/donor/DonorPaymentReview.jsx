import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, XCircle, Eye, Download, FileText,
  CreditCard, User, Building, Hash, Phone, RotateCcw, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { viewDocument } from '../../utils/viewDocument'
import api from '../../services/api'
import { format } from 'date-fns'

const RESUBMISSION_REASONS = [
  'Incorrect Account Number',
  'Account Name Mismatch',
  'Invalid Bank Information',
  'Unclear Bank Passbook Copy',
  'Missing Documents',
  'Other',
]

function StatusChip({ status }) {
  const map = {
    'Submitted':             'badge-amber',
    'Re-Submitted':          'badge-amber',
    'Pending Verification':  'badge-blue',
    'Verified':              'badge-green',
    'Resubmission Required': 'badge-red',
  }
  return <span className={map[status] || 'badge-grey'}>{status}</span>
}

function PaymentCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <p className="text-xs font-medium text-slate-400 flex items-center gap-1 mb-1">
        {Icon && <Icon size={11}/>}{label}
      </p>
      <p className="text-sm font-bold text-slate-800">{value || '—'}</p>
    </div>
  )
}

export default function DonorPaymentReview() {
  const navigate = useNavigate()
  const [pending, setPending]     = useState([])
  const [selected, setSelected]   = useState(null)
  const [action, setAction]       = useState(null) // 'verify' | 'resubmit'
  const [reason, setReason]       = useState('')
  const [comments, setComments]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading]     = useState(true)

  const load = () => {
    setLoading(true)
    api.get('/payment/donor/pending')
      .then(r => setPending(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleVerify = async () => {
    setSubmitting(true)
    try {
      await api.post(`/payment/${selected.application_id}/verify`)
      toast.success('✅ Payment details verified!')
      setSelected(null); setAction(null)
      load()
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  const handleResubmit = async () => {
    if (!reason) { toast.error('Please select a resubmission reason'); return }
    setSubmitting(true)
    try {
      await api.post(`/payment/${selected.application_id}/resubmit`, {
        resubmission_reason: reason,
        donor_payment_comments: comments,
      })
      toast.success('Resubmission requested')
      setSelected(null); setAction(null); setReason(''); setComments('')
      load()
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="page-title">Payment Details Review</h1>
        <p className="text-slate-500 text-sm mt-1">
          Review and verify student payment information before scholarship disbursement.
        </p>
      </div>

      {/* List */}
      {!selected ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Student','Scholarship','Batch','Submitted','Status','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : pending.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No payment details pending review.</td></tr>
              ) : pending.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{p.student_name}</p>
                    <p className="text-xs text-slate-400 font-mono">{p.registration_number}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[140px] truncate">{p.scholarship_title}</td>
                  <td className="px-4 py-3"><span className="badge-purple">{p.batch}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {p.updated_at ? format(new Date(p.updated_at), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusChip status={p.payment_details_status}/></td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setSelected(p); setAction(null); setReason(''); setComments('') }}
                      className="btn-primary text-xs px-3 py-1.5">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Detail Review View ── */
        <div className="space-y-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-purple-600 font-semibold mb-1">{selected.scholarship_title}</p>
              <h2 className="text-xl font-bold text-slate-800">{selected.student_name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{selected.registration_number} · {selected.batch}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusChip status={selected.payment_details_status}/>
              <button onClick={() => { setSelected(null); setAction(null) }}
                className="btn-ghost text-sm">← Back to List</button>
            </div>
          </div>

          {/* Payment info grid */}
          <div className="card p-6">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-purple-600"/> Bank Account Details
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <PaymentCard label="Account Holder Name" value={selected.account_holder_name} icon={User}/>
              <PaymentCard label="Bank Name"           value={selected.bank_name}           icon={Building}/>
              <PaymentCard label="Branch Name"         value={selected.branch_name}         icon={Building}/>
              <PaymentCard label="Account Number"      value={selected.account_number}      icon={Hash}/>
              <PaymentCard label="Account Type"        value={selected.account_type}        icon={CreditCard}/>
              <PaymentCard label="Contact Number"      value={selected.contact_number}      icon={Phone}/>
            </div>

            {/* Passbook */}
            {selected.passbook_url ? (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
                  <FileText size={13}/> Bank Passbook / Account Proof
                </p>
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <FileText size={15} className="text-green-600 flex-shrink-0"/>
                  <p className="text-sm text-green-700 flex-1 truncate font-medium">
                    {selected.passbook_file_name || 'Passbook document'}
                  </p>
                  <button onClick={() => viewDocument(selected.passbook_url)}
                    className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium px-3 py-1.5 bg-white rounded-lg border border-purple-200">
                    <Eye size={13}/> View
                  </button>
                  <a href={selected.passbook_url} download={selected.passbook_file_name}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                    <Download size={13}/> Download
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <AlertCircle size={13}/> No passbook document uploaded.
                </div>
              </div>
            )}

            {/* Resubmission count */}
            {selected.payment_resubmission_count > 0 && (
              <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
                <RotateCcw size={12}/> This is resubmission #{selected.payment_resubmission_count}
              </div>
            )}
          </div>

          {/* Decision panel */}
          <div className="card p-6 border-2 border-purple-100 space-y-5">
            <h3 className="font-semibold text-slate-800">Your Decision</h3>

            {/* Action selector */}
            <div className="flex gap-3">
              <button onClick={() => setAction(a => a === 'verify' ? null : 'verify')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors
                  ${action === 'verify'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                <CheckCircle size={16}/> Verify Payment Details
              </button>
              <button onClick={() => setAction(a => a === 'resubmit' ? null : 'resubmit')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors
                  ${action === 'resubmit'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                <XCircle size={16}/> Request Resubmission
              </button>
            </div>

            {/* Verify confirm */}
            {action === 'verify' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                  <CheckCircle size={15}/> Confirm Payment Verification
                </p>
                <p className="text-xs text-green-600">
                  By verifying, you confirm the bank details are correct and authorize scholarship disbursement.
                </p>
                <div className="flex gap-3">
                  <button onClick={handleVerify} disabled={submitting}
                    className="bg-green-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {submitting
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Processing...</>
                      : <><CheckCircle size={15}/> Confirm Verification</>}
                  </button>
                  <button onClick={() => setAction(null)} className="btn-ghost">Cancel</button>
                </div>
              </div>
            )}

            {/* Resubmit form */}
            {action === 'resubmit' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-4">
                <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                  <XCircle size={15}/> Request Resubmission
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Reason for Resubmission *
                  </label>
                  <select value={reason} onChange={e => setReason(e.target.value)}
                    className="input-field">
                    <option value="">Select reason...</option>
                    {RESUBMISSION_REASONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Additional Notes
                  </label>
                  <textarea value={comments} onChange={e => setComments(e.target.value)}
                    rows={3} placeholder="Provide specific details to help the student correct their payment information..."
                    className="input-field resize-none"/>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleResubmit} disabled={submitting || !reason}
                    className="bg-red-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {submitting
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Processing...</>
                      : <><XCircle size={15}/> Confirm Resubmission Request</>}
                  </button>
                  <button onClick={() => { setAction(null); setReason(''); setComments('') }} className="btn-ghost">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}