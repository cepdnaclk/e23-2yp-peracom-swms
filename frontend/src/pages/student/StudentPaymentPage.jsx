import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Lock, Unlock, Upload, FileText, CheckCircle,
  AlertCircle, Download, Eye, ArrowLeft, CreditCard,
  Building, Hash, Phone, RotateCcw, Info, Clock,
  ChevronDown, ChevronUp, User, Calendar, History
} from 'lucide-react'
import toast from 'react-hot-toast'
import { viewDocument } from '../../utils/viewDocument'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import api from '../../services/api'
import { format } from 'date-fns'

const ACCOUNT_TYPES = ['Savings', 'Current', 'Fixed Deposit', 'Other']



// ─────────────────────────────────────────────────────────────
// Status Flow Timeline
// ─────────────────────────────────────────────────────────────
function StatusTimeline({ payment }) {
  const count =
    payment?.payment_resubmission_count || 0

  const status =
    payment?.payment_details_status

  const steps = [
    {
      label: 'Payment Details Requested',
      done: [
        'Requested',
        'Submitted',
        'Correction Required',
        'Re-Submitted',
        'Admin Verified'
      ].includes(status),
      color: 'bg-blue-500'
    },
    {
      label: 'Payment Details Submitted',
      done: [
        'Submitted',
        'Correction Required',
        'Re-Submitted',
        'Admin Verified'
      ].includes(status),
      color: 'bg-amber-400'
    },
    ...(count > 0
      ? [
          {
            label: `Correction Requested (×${count})`,
            done: [
              'Correction Required',
              'Re-Submitted',
              'Admin Verified'
            ].includes(status),
            color: 'bg-red-400'
          },
          {
            label: 'Corrected Details Submitted',
            done: [
              'Re-Submitted',
              'Admin Verified'
            ].includes(status),
            color: 'bg-amber-400'
          }
        ]
      : []),
    {
      label: 'Admin Verified',
      done: status === 'Admin Verified',
      color: 'bg-green-500'
    }
  ]

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div
          key={index}
          className="flex items-center gap-3"
        >
          <div
            className={`w-3 h-3 rounded-full flex-shrink-0 ${
              step.done
                ? step.color
                : 'bg-slate-200'
            }`}
          />

          <span
            className={`text-xs ${
              step.done
                ? 'text-slate-700 font-medium'
                : 'text-slate-400'
            }`}
          >
            {step.label}
          </span>

          {step.done &&
            step.label === 'Admin Verified' &&
            payment?.payment_verified_date && (
              <span className="text-xs text-slate-400 ml-auto">
                {format(
                  new Date(
                    payment.payment_verified_date
                  ),
                  'MMM d, yyyy'
                )}
              </span>
            )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Locked Application Section (Steps 1–5 read-only display)
// ─────────────────────────────────────────────────────────────
function LockedSection({ title, icon: Icon }) {
  return (
    <div className="card overflow-hidden opacity-60">
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-slate-400"/>}
          <span className="font-semibold text-sm text-slate-500">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Lock size={12}/> Read-only
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Field wrapper
// ─────────────────────────────────────────────────────────────
function Field({ label, required, children, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={11}/>{error}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Info display row (read-only bank detail)
// ─────────────────────────────────────────────────────────────
function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3.5">
      <p className="text-xs text-slate-400 flex items-center gap-1 mb-0.5">
        {Icon && <Icon size={11}/>}{label}
      </p>
      <p className="text-sm font-semibold text-slate-800">{value || '—'}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function StudentPaymentPage() {
  const { applicationId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [appInfo, setAppInfo]           = useState(null)
  const [payment, setPayment]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [submitting, setSubmitting]     = useState(false)
  const [passbookFile, setPassbookFile] = useState(null)
  const [errors, setErrors]             = useState({})
  const [historyOpen, setHistoryOpen]   = useState(false)


  const [form, setForm] = useState({
    account_holder_name: '',
    bank_name:           '',
    branch_name:         '',
    account_number:      '',
    account_type:        '',
    contact_number:      '',
  })

  const load = async () => {
    setLoading(true)

    try {
      const [appRes, payRes] = await Promise.all([
        api.get(`/applications/${applicationId}`).catch(() => ({ data: null })),
        api.get(`/payment/${applicationId}`).catch(() => ({ data: null }))
      ])

      const application = appRes.data
      const paymentDetails = payRes.data

      setAppInfo(application)
      setPayment(paymentDetails)

      if (paymentDetails?.account_holder_name) {
        setForm({
          account_holder_name: paymentDetails.account_holder_name || '',
          bank_name: paymentDetails.bank_name || '',
          branch_name: paymentDetails.branch_name || '',
          account_number: paymentDetails.account_number || '',
          account_type: paymentDetails.account_type || '',
          contact_number: paymentDetails.contact_number || ''
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [applicationId])

  const pdStatus = payment?.payment_details_status || 'Locked'

  const isResubmission = pdStatus === 'Correction Required'

  const isEditable = ['Requested', 'Correction Required'].includes(pdStatus)

  const isReadOnly = ['Submitted', 'Re-Submitted', 'Admin Verified'].includes(pdStatus)

  const validate = () => {
    const e = {}
    if (!form.account_holder_name.trim()) e.account_holder_name = 'Required'
    if (!form.bank_name.trim())           e.bank_name           = 'Required'
    if (!form.account_number.trim())      e.account_number      = 'Required'
    if (!form.account_type)               e.account_type        = 'Required'
    if (!payment?.passbook_url && !passbookFile) e.passbook = 'Bank passbook/account proof is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) { toast.error('Please fill all required fields'); return }
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
      if (passbookFile) fd.append('passbook', passbookFile)
      await api.post(`/payment/${applicationId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(isResubmission
        ? '✅ Payment details resubmitted successfully!'
        : '✅ Payment details submitted successfully!')
      setPassbookFile(null)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed')
    } finally { setSubmitting(false) }
  }

  const setField = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    setErrors(p => ({ ...p, [field]: '' }))
  }

  const handlePassbookChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    const maxSize = 5 * 1024 * 1024

    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPG and PNG files are allowed')
      event.target.value = ''
      return
    }

    if (file.size > maxSize) {
      toast.error('File size must not exceed 5 MB')
      event.target.value = ''
      return
    }

    setPassbookFile(file)
    setErrors(previous => ({ ...previous, passbook: '' }))
  }

  const inputClass = (field) =>
    `input-field ${!isEditable ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''} ${errors[field] ? 'border-red-300' : ''}`

  // ── Status config
  const statusInfo = {
  Locked: {
    icon: Lock,
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-600',
    title: 'Payment Details Not Requested',
    desc:
      'Payment details will become available after the admin reviews your application.'
  },

  Requested: {
    icon: Unlock,
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    title: 'Payment Details Requested',
    desc:
      'Your application passed the initial admin review. Please submit your bank details.'
  },

  Submitted: {
    icon: Clock,
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    title: 'Payment Details Submitted',
    desc:
      'Your payment details are waiting for admin verification.'
  },

  'Correction Required': {
    icon: AlertCircle,
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    title: 'Payment Details Require Correction',
    desc:
      'The admin requested corrections. Review the instructions and submit the updated details.'
  },

  'Re-Submitted': {
    icon: Clock,
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    title: 'Corrected Payment Details Submitted',
    desc:
      'Your corrected payment details are waiting for admin verification.'
  },

  'Admin Verified': {
    icon: CheckCircle,
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
    title: 'Payment Details Verified',
    desc:
      'The admin verified your bank details. Your application is ready for donor assignment.'
  }
}

  const sc = statusInfo[pdStatus] || statusInfo.Locked
  const StatusIcon = sc.icon

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"/>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      <Breadcrumb items={[
        { label: 'My Applications', href: '/student/applications' },
        { label: 'Payment Details' },
      ]}/>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-purple-600 font-semibold mb-1">
            Step 6 — Payment Details
          </p>
          <h1 className="page-title">
            {appInfo?.scholarship_title || 'Scholarship Application'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Bank account information for scholarship disbursement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={pdStatus}/>
          <button onClick={() => navigate('/student/applications')}
            className="btn-ghost flex items-center gap-1.5 text-sm">
            <ArrowLeft size={14}/> Back
          </button>
        </div>
      </div>

      {/* ── Status Banner ── */}
      <div className={`rounded-2xl p-5 border flex items-start gap-4 ${sc.bg}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sc.bg}`}>
          <StatusIcon size={22} className={sc.text}/>
        </div>
        <div>
          <p className={`font-bold ${sc.text}`}>{sc.title}</p>
          <p className={`text-sm mt-0.5 ${sc.text} opacity-80`}>{sc.desc}</p>
          {pdStatus === 'Admin Verified' && payment?.payment_verified_date && (
            <p className={`text-xs mt-1 ${sc.text} opacity-60`}>
              Verified on {format(new Date(payment.payment_verified_date), 'MMM d, yyyy · h:mm a')}
            </p>
          )}
        </div>
      </div>

      {/* ── Resubmission Feedback Card ── */}
      {isResubmission && (
        <div className="card border-l-4 border-red-400 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0"/>
            <h2 className="font-bold text-slate-800">Admin Correction Instructions</h2>
            {payment?.payment_resubmission_count > 0 && (
              <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
                <RotateCcw size={11}/> Resubmission #{payment.payment_resubmission_count}
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Reason</p>
              <p className="text-sm font-bold text-red-700 bg-red-50 rounded-xl px-3 py-2">
                {payment?.resubmission_reason || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Last Submission</p>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400"/>
                {payment?.updated_at
                  ? format(new Date(payment.updated_at), 'MMM d, yyyy · h:mm a')
                  : '—'}
              </p>
            </div>
          </div>

          {payment?.admin_payment_comments && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Admin Comments</p>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-slate-700 leading-relaxed">
                {payment.admin_payment_comments}
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-start gap-2">
            <Info size={13} className="flex-shrink-0 mt-0.5"/>
            <span>Only your payment details (Step 6) need to be updated. Your application (Steps 1–5) remains locked and unchanged.</span>
          </div>
        </div>
      )}

      {/* ── Status Flow Timeline ── */}
      {pdStatus !== 'Locked' && (
        <div className="card p-5">
          <button onClick={() => setHistoryOpen(o => !o)}
            className="w-full flex items-center justify-between text-left">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
              <History size={13}/> Submission History
              {payment?.payment_resubmission_count > 0 && (
                <span className="badge-red ml-1">{payment.payment_resubmission_count} resubmission{payment.payment_resubmission_count > 1 ? 's' : ''}</span>
              )}
            </span>
            {historyOpen ? <ChevronUp size={15} className="text-slate-400"/> : <ChevronDown size={15} className="text-slate-400"/>}
          </button>
          {historyOpen && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <StatusTimeline payment={payment}/>
            </div>
          )}
        </div>
      )}

      {/* ── Locked Application Sections 1–5 ── */}
      {pdStatus !== 'Locked' && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 px-1">
            <Lock size={11}/> Application Sections (Read-only)
          </p>
          {[
            { title: 'Step 1 — Personal Information', icon: User },
            { title: 'Step 2 — Family Details',       icon: User },
            { title: 'Step 3 — Financial Details',    icon: User },
            { title: 'Step 4 — Academic Details',     icon: User },
            { title: 'Step 5 — Documents',            icon: FileText },
          ].map(s => <LockedSection key={s.title} title={s.title} icon={s.icon}/>)}
        </div>
      )}

      {/* ── Read-only info banner ── */}
      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700 flex items-center gap-2">
          <Info size={13} className="flex-shrink-0"/>
          These details are read-only while under verification. You'll be notified if any correction is needed.
        </div>
      )}

      {/* ── Payment Details Form / Display ── */}
      {pdStatus !== 'Locked' && (
        <div className={`card p-6 space-y-5 ${isReadOnly ? 'opacity-80' : ''}`}>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CreditCard size={16} className="text-purple-600"/>
            <h2 className="font-bold text-slate-800">Step 6 — Payment Details</h2>
            {isEditable && (
              <span className="ml-auto badge-blue flex items-center gap-1"><Unlock size={11}/> Editable</span>
            )}
            {isReadOnly && (
              <span className="ml-auto badge-grey flex items-center gap-1"><Lock size={11}/> Read-only</span>
            )}
          </div>

          {/* Read-only display */}
          {isReadOnly && (
            <div className="grid sm:grid-cols-2 gap-3">
              <InfoRow label="Account Holder Name" value={payment?.account_holder_name} icon={User}/>
              <InfoRow label="Bank Name"           value={payment?.bank_name}           icon={Building}/>
              <InfoRow label="Branch Name"         value={payment?.branch_name}         icon={Building}/>
              <InfoRow label="Account Number"      value={payment?.account_number}      icon={Hash}/>
              <InfoRow label="Account Type"        value={payment?.account_type}        icon={CreditCard}/>
              <InfoRow label="Contact Number"      value={payment?.contact_number}      icon={Phone}/>
            </div>
          )}

          {/* Editable form */}
          {isEditable && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Account Holder Name" required error={errors.account_holder_name}>
                <input type="text" placeholder="Full name as per bank records"
                  value={form.account_holder_name}
                  onChange={e => setField('account_holder_name', e.target.value)}
                  className={inputClass('account_holder_name')}/>
              </Field>

              <Field label="Bank Name" required error={errors.bank_name}>
                <input type="text" placeholder="e.g. Bank of Ceylon"
                  value={form.bank_name}
                  onChange={e => setField('bank_name', e.target.value)}
                  className={inputClass('bank_name')}/>
              </Field>

              <Field label="Branch Name">
                <input type="text" placeholder="e.g. Peradeniya"
                  value={form.branch_name}
                  onChange={e => setField('branch_name', e.target.value)}
                  className={inputClass('branch_name')}/>
              </Field>

              <Field label="Account Number" required error={errors.account_number}>
                <input type="text" placeholder="e.g. 0012345678"
                  value={form.account_number}
                  onChange={e => setField('account_number', e.target.value)}
                  className={inputClass('account_number')}/>
              </Field>

              <Field label="Account Type" required error={errors.account_type}>
                <select value={form.account_type}
                  onChange={e => setField('account_type', e.target.value)}
                  className={inputClass('account_type')}>
                  <option value="">Select account type…</option>
                  {ACCOUNT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>

              <Field label="Contact Number">
                <input type="tel" placeholder="e.g. 0771234567"
                  value={form.contact_number}
                  onChange={e => setField('contact_number', e.target.value)}
                  className={inputClass('contact_number')}/>
              </Field>
            </div>
          )}

          {/* Passbook section */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
              <FileText size={13}/> Bank Passbook / Account Proof
            </p>
            {errors.passbook && (
              <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
                <AlertCircle size={11}/>{errors.passbook}
              </p>
            )}

            {/* Existing uploaded passbook */}
            {payment?.passbook_url && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mb-3">
                <FileText size={14} className="text-green-600 flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-green-700 font-medium truncate">
                    {payment.passbook_file_name || 'Bank passbook'}
                  </p>
                  {payment?.updated_at && (
                    <p className="text-xs text-green-500 mt-0.5">
                      Uploaded {format(new Date(payment.updated_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                <button onClick={() => viewDocument(payment.passbook_url)}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium flex-shrink-0">
                  <Eye size={12}/> View
                </button>
                <a href={payment.passbook_url} download={payment.passbook_file_name}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 flex-shrink-0">
                  <Download size={12}/> Download
                </a>
              </div>
            )}

            {/* New upload input — editable only */}
            {isEditable && (
              <>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  ref={fileInputRef}
                  onChange={handlePassbookChange}
                  className="hidden"
                />
                {passbookFile ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <FileText size={14} className="text-blue-500 flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-700 font-medium truncate">{passbookFile.name}</p>
                      <p className="text-xs text-blue-400">{(passbookFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button
                      onClick={() => { setPassbookFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      className="text-xs text-red-400 hover:text-red-600 font-medium flex-shrink-0">
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 p-5 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-colors text-sm">
                    <Upload size={18}/>
                    <span>
                      {payment?.passbook_url ? 'Click to replace passbook' : 'Click to upload bank passbook'}
                    </span>
                    <span className="text-xs text-slate-400">(PDF / JPG / PNG · max 5MB)</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Submit / Resubmit buttons */}
          {isEditable && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary flex-1 py-3.5 text-sm flex items-center justify-center gap-2">
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Submitting…</>
                ) : isResubmission ? (
                  <><RotateCcw size={15}/> Submit Updated Payment Details</>
                ) : (
                  <><CheckCircle size={15}/> Submit Payment Details</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom nav ── */}
      <div className="flex items-center justify-between pt-2">
        <Link to="/student/applications" className="btn-ghost flex items-center gap-1.5 text-sm">
          <ArrowLeft size={14}/> Back to Applications
        </Link>
        {pdStatus === 'Admin Verified' && (
          <span className="text-xs text-green-600 font-semibold flex items-center gap-1.5">
            <CheckCircle size={13}/> Completed
          </span>
        )}
      </div>
    </div>
  )
}