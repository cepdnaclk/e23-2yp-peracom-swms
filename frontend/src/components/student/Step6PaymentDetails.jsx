import { useState, useEffect, useRef } from 'react'
import {
  Lock, Unlock, Upload, FileText, CheckCircle, XCircle,
  AlertCircle, Download, Eye, RotateCcw, Building, User,
  CreditCard, Phone, Hash
} from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../common/StatusBadge'
import { viewDocument } from '../../utils/viewDocument'
import api from '../../services/api'

const ACCOUNT_TYPES = ['Savings', 'Current', 'Fixed Deposit', 'Other']

const RESUBMISSION_REASONS = [
  'Incorrect Account Number',
  'Account Name Mismatch',
  'Invalid Bank Information',
  'Unclear Bank Passbook Copy',
  'Missing Documents',
  'Other',
]

// ── Approval progress bar shown when still locked
function ApprovalProgress({ adminStatus, donorStatus }) {
  const adminDone = adminStatus === 'Approved'
  const donorDone = donorStatus === 'Approved'

  const Step = ({ label, done, index }) => (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
        ${done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
        {done ? <CheckCircle size={14}/> : index}
      </div>
      <div>
        <p className={`text-xs font-semibold ${done ? 'text-green-700' : 'text-slate-500'}`}>{label}</p>
        <p className={`text-xs ${done ? 'text-green-600' : 'text-slate-400'}`}>
          {done ? 'Approved ✓' : 'Pending...'}
        </p>
      </div>
    </div>
  )

  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Approval Progress</p>
      <div className="flex items-center gap-6 flex-wrap">
        <Step label="Admin Approval"  done={adminDone} index={1}/>
        <div className={`flex-1 h-0.5 min-w-[40px] ${adminDone ? 'bg-green-300' : 'bg-slate-200'}`}/>
        <Step label="Donor Approval"  done={donorDone} index={2}/>
        <div className={`flex-1 h-0.5 min-w-[40px] ${donorDone ? 'bg-green-300' : 'bg-slate-200'}`}/>
        <Step label="Payment Unlocked" done={adminDone && donorDone} index={3}/>
      </div>
    </div>
  )
}

// ── Main exported component
export default function Step6PaymentDetails({ applicationId, applicationStatus, adminApproval, donorApproval }) {
  const [payment, setPayment]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    account_holder_name: '',
    bank_name: '',
    branch_name: '',
    account_number: '',
    account_type: '',
    contact_number: '',
  })
  const [passbookFile, setPassbookFile] = useState(null)
  const fileRef = useRef()

  const fullyApproved = adminApproval === 'Approved' && donorApproval === 'Approved'
  const isLocked = !fullyApproved ||
    (payment && !['Unlocked','Resubmission Required'].includes(payment.payment_details_status))

  const load = () => {
    if (!applicationId) { setLoading(false); return }
    api.get(`/payment/${applicationId}`)
      .then(r => {
        setPayment(r.data)
        if (r.data?.account_holder_name) {
          setForm({
            account_holder_name: r.data.account_holder_name || '',
            bank_name:           r.data.bank_name           || '',
            branch_name:         r.data.branch_name         || '',
            account_number:      r.data.account_number      || '',
            account_type:        r.data.account_type        || '',
            contact_number:      r.data.contact_number      || '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [applicationId])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!form.account_holder_name) { toast.error('Account holder name is required'); return }
    if (!form.bank_name)           { toast.error('Bank name is required'); return }
    if (!form.account_number)      { toast.error('Account number is required'); return }
    if (!form.account_type)        { toast.error('Account type is required'); return }

    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (passbookFile) fd.append('passbook', passbookFile)
      await api.post(`/payment/${applicationId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Payment details submitted!')
      setPassbookFile(null)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed')
    } finally { setSubmitting(false) }
  }

  const pdStatus = payment?.payment_details_status || 'Locked'

  const statusConfig = {
    Locked:                 { color: 'bg-slate-100 text-slate-500 border-slate-200',    icon: Lock },
    Unlocked:               { color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: Unlock },
    Submitted:              { color: 'bg-amber-100 text-amber-700 border-amber-200',    icon: CheckCircle },
    'Re-Submitted':         { color: 'bg-amber-100 text-amber-700 border-amber-200',    icon: CheckCircle },
    'Pending Verification': { color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: CheckCircle },
    Verified:               { color: 'bg-green-100 text-green-700 border-green-200',    icon: CheckCircle },
    'Resubmission Required':{ color: 'bg-red-100 text-red-700 border-red-200',          icon: XCircle },
  }
  const { color: statusColor, icon: StatusIcon } = statusConfig[pdStatus] || statusConfig['Locked']

  if (loading) return <div className="py-8 text-center text-slate-400 text-sm">Loading payment details...</div>

  const inp = (field, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{['account_holder_name','bank_name','account_number','account_type'].includes(field) && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[field]}
        onChange={e => !isLocked && setForm({ ...form, [field]: e.target.value })}
        placeholder={placeholder}
        disabled={isLocked}
        className={`input-field ${isLocked ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
      />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Section header with lock/unlock status */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${statusColor}`}>
            <StatusIcon size={18}/>
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Payment Details</h3>
            <p className="text-xs text-slate-500 mt-0.5">Bank account information for scholarship disbursement</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${statusColor}`}>
          {pdStatus}
        </span>
      </div>

      {/* LOCKED STATE */}
      {isLocked && pdStatus === 'Locked' && (
        <>
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <Lock size={28} className="text-slate-400"/>
            </div>
            <div>
              <p className="font-bold text-slate-600">Payment Details Locked</p>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                Payment Details can only be completed after the application has been approved by both the Admin and Donor.
              </p>
            </div>
          </div>
          <ApprovalProgress adminStatus={adminApproval} donorStatus={donorApproval}/>
        </>
      )}

      {/* RESUBMISSION REQUIRED */}
      {pdStatus === 'Resubmission Required' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5"/>
            <div>
              <p className="font-semibold text-red-700 text-sm">Payment Details Require Correction</p>
              <p className="text-xs text-red-600 mt-0.5">
                Your payment details require correction. Please review the donor comments and submit updated information.
              </p>
            </div>
          </div>
          {payment?.resubmission_reason && (
            <div className="bg-white rounded-xl p-3 border border-red-100 space-y-2">
              <div>
                <p className="text-xs font-semibold text-slate-500">Reason</p>
                <p className="text-sm text-slate-700 font-medium">{payment.resubmission_reason}</p>
              </div>
              {payment?.donor_payment_comments && (
                <div>
                  <p className="text-xs font-semibold text-slate-500">Donor Comments</p>
                  <p className="text-sm text-slate-600">{payment.donor_payment_comments}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VERIFIED */}
      {pdStatus === 'Verified' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="font-semibold text-green-700">Payment Details Verified</p>
            <p className="text-xs text-green-600 mt-0.5">
              Your payment details have been verified.
              {payment?.payment_verified_date && ` Verified on ${new Date(payment.payment_verified_date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}.`}
            </p>
          </div>
        </div>
      )}

      {/* SUBMITTED / PENDING */}
      {['Submitted','Re-Submitted','Pending Verification'].includes(pdStatus) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="font-semibold text-amber-700">Payment Details Submitted</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Your payment details are pending donor verification. You will be notified once reviewed.
            </p>
          </div>
        </div>
      )}

      {/* FORM — shown when unlocked or in editable states */}
      {(fullyApproved || pdStatus !== 'Locked') && (
        <div className={`space-y-5 ${isLocked ? 'opacity-50 pointer-events-none select-none' : ''}`}>
          {/* Read-only overlay for submitted states */}
          {['Submitted','Re-Submitted','Pending Verification','Verified'].includes(pdStatus) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700 flex items-center gap-2">
              <AlertCircle size={13} className="flex-shrink-0"/>
              These details are read-only while under review.
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {inp('account_holder_name', 'Account Holder Name', 'text', 'Full name as per bank records')}
            {inp('bank_name', 'Bank Name', 'text', 'e.g. Bank of Ceylon')}
            {inp('branch_name', 'Branch Name', 'text', 'e.g. Peradeniya')}
            {inp('account_number', 'Account Number', 'text', 'e.g. 0012345678')}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.account_type}
                onChange={e => !isLocked && setForm({ ...form, account_type: e.target.value })}
                disabled={isLocked}
                className={`input-field ${isLocked ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}>
                <option value="">Select account type...</option>
                {ACCOUNT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {inp('contact_number', 'Contact Number', 'tel', 'e.g. 0771234567')}
          </div>

          {/* Passbook upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Bank Passbook / Account Proof
            </label>
            {payment?.passbook_url && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mb-2">
                <FileText size={14} className="text-green-600 flex-shrink-0"/>
                <p className="text-xs text-green-700 flex-1 truncate">{payment.passbook_file_name || 'Passbook uploaded'}</p>
                <button onClick={() => viewDocument(payment.passbook_url)}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800">
                  <Eye size={12}/> View
                </button>
                <a href={payment.passbook_url} download={payment.passbook_file_name}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                  <Download size={12}/> Download
                </a>
              </div>
            )}
            {!isLocked && !['Submitted','Re-Submitted','Pending Verification','Verified'].includes(pdStatus) && (
              <>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" ref={fileRef} className="hidden"
                  onChange={e => setPassbookFile(e.target.files[0])}/>
                {passbookFile ? (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <FileText size={14} className="text-blue-500 flex-shrink-0"/>
                    <span className="text-xs text-blue-700 flex-1 truncate">{passbookFile.name}</span>
                    <button onClick={() => { setPassbookFile(null); if (fileRef.current) fileRef.current.value = '' }}
                      className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-colors text-sm">
                    <Upload size={16}/> Click to upload passbook (PDF / JPG / PNG, max 5MB)
                  </button>
                )}
              </>
            )}
          </div>

          {/* Submit button — only when editable */}
          {!isLocked && !['Submitted','Re-Submitted','Pending Verification','Verified'].includes(pdStatus) && (
            <button onClick={handleSubmit} disabled={submitting}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Submitting...</>
                : <><CheckCircle size={16}/> Submit Payment Details</>}
            </button>
          )}
        </div>
      )}
    </div>
  )
}