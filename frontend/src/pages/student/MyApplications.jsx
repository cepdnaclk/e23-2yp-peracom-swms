import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, AlertCircle, Eye, Download, X, User, DollarSign,
  Users, GraduationCap, MapPin, Phone, Mail, CreditCard, Clock,
  Shield, Building, Calendar, Home, Hash, Briefcase, Star, Info,
  CheckCircle, XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../../components/common/StatusBadge'
import { viewDocument } from '../../utils/viewDocument'
import api from '../../services/api'
import { format } from 'date-fns'

const TABS = ['All', 'Pending', 'Approved', 'Awarded', 'Rejected', 'Resubmission Requested']

const REQUIRED_DOCS = [
  'NIC Copy',
  'Academic Transcript',
  'Income Certificate',
  'Recommendation Letter',
]

// ── Progress bar
function ProgressBar({ status }) {
  const config = {
    Pending: { width: '25%', color: 'bg-amber-400' },
    'Under Review': { width: '40%', color: 'bg-blue-400' },
    'Resubmission Requested': { width: '50%', color: 'bg-orange-400' },
    Approved: { width: '65%', color: 'bg-green-400' },
    'Fully Approved': { width: '75%', color: 'bg-green-500' },
    'Payment Details Submitted': { width: '85%', color: 'bg-purple-400' },
    'Resubmission Required': { width: '80%', color: 'bg-red-400' },
    'Payment Verified': { width: '95%', color: 'bg-green-500' },
    Rejected: { width: '100%', color: 'bg-red-400' },
    Completed: { width: '100%', color: 'bg-green-600' },
  }
  const c = config[status] || { width: '10%', color: 'bg-slate-300' }
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${c.color}`} style={{ width: c.width }} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function MyApplications() {
  const [apps, setApps] = useState([])
  const [tab, setTab] = useState('All')
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState(null)

  const loadApps = () => {
    api.get('/student/applications')
      .then(r => setApps(r.data))
      .catch(() => { })
      .finally(() => setLoading(false))
  }
  useEffect(() => { loadApps() }, [])

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? apps.length : apps.filter(a => a.status === t).length
    return acc
  }, {})

  const filtered = tab === 'All' ? apps : apps.filter(a => a.status === tab)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My Applications</h1>
        <p className="text-slate-500 text-sm mt-1">
          Track your scholarship applications.
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors
              ${tab === t
                ? 'bg-purple-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300'}`}>
            {t} {counts[t] > 0 ? `(${counts[t]})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading applications...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <FileText size={40} className="text-slate-200 mx-auto" />
          <p className="text-slate-400">No applications found.</p>
          <Link to="/student/scholarships" className="btn-primary inline-block">
            Browse Scholarships
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(app => (
            <div key={app.id} className="card hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-purple-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-slate-800">{app.scholarship_title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Applied {app.created_at ? format(new Date(app.created_at), 'MMM d, yyyy') : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {app.funding_amount && (
                          <span className="text-sm font-bold text-green-600">
                            LKR {Number(app.funding_amount).toLocaleString()}
                          </span>
                        )}
                        <StatusBadge status={app.status} />
                      </div>
                    </div>

                    {/* Admin note */}
                    {app.admin_reason && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 flex items-start gap-1.5">
                        <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                        <span><span className="font-semibold">Admin note:</span> {app.admin_reason}</span>
                      </div>
                    )}

                    {/* Payment CTA — shown when Fully Approved or Resubmission Required */}
                    {['Fully Approved', 'Resubmission Required'].includes(app.status) && (
                      <Link to={`/student/payment/${app.id}`}
                        className="mt-3 flex items-center justify-between gap-2 bg-gradient-to-r from-purple-700 to-purple-500 rounded-xl px-4 py-3 text-white text-xs font-semibold hover:opacity-90 transition-opacity">
                        <span>
                          {app.status === 'Resubmission Required'
                            ? '⚠️ Payment details need correction. Click to update.'
                            : '🎉 Fully approved! Click to submit your payment details.'}
                        </span>
                        <span className="underline whitespace-nowrap flex-shrink-0">Open →</span>
                      </Link>
                    )}

                    {/* Payment submitted banner */}
                    {app.status === 'Payment Details Submitted' && (
                      <Link to={`/student/payment/${app.id}`}
                        className="mt-3 flex items-center justify-between gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
                        <span>💳 Payment details submitted — awaiting donor verification.</span>
                        <span className="underline whitespace-nowrap flex-shrink-0">View →</span>
                      </Link>
                    )}

                    {/* Payment verified banner */}
                    {app.status === 'Payment Verified' && (
                      <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-green-700 text-xs font-semibold">
                        ✅ Payment details verified. Scholarship funds will be disbursed shortly.
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Application Progress</span>
                        <span>{app.status}</span>
                      </div>
                      <ProgressBar status={app.status} />
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100/50 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors">
                        <Eye size={14} />
                        View Application
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedApp && (
        <ApplicationDetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  )
}

// ── Application Detail Modal (Read-only for Student)
function ApplicationDetailModal({ app, onClose }) {
  const [docs, setDocs] = useState([])
  const [payment, setPayment] = useState(null)
  const [donorDecision, setDonorDecision] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!app) return
    setLoading(true)
    Promise.all([
      api.get(`/applications/${app.id}/documents`).catch(() => ({ data: [] })),
      api.get(`/payment/${app.id}`).catch(() => ({ data: null })),
      api.get(`/applications/${app.id}/donor-decision`).catch(() => ({ data: null }))
    ]).then(([docsRes, payRes, donorRes]) => {
      setDocs(docsRes.data || [])
      setPayment(payRes.data || null)
      setDonorDecision(donorRes.data || null)
    }).finally(() => setLoading(false))
  }, [app])

  if (!app) return null

  const extra = (() => {
    try {
      return app.extra_data ? JSON.parse(app.extra_data) : {}
    } catch {
      return {}
    }
  })()

  const parseNum = (val) => val ? Number(val).toLocaleString() : '—'

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Application Details</h2>
            <p className="text-xs text-purple-600 font-medium mt-0.5">{app.scholarship_title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading application details...</span>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
            {/* Status Summary Widget */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatusCard label="Application Status" value={app.status} type="status" />
              <StatusCard label="Admin Approval" value={
                app.status === 'Rejected' ? 'Rejected' :
                  ['Approved', 'Fully Approved', 'Payment Details Submitted', 'Payment Verified', 'Completed'].includes(app.status) ? 'Approved' : 'Pending'
              } />
              <StatusCard label="Donor Approval" value={donorDecision?.donor_decision || 'Pending'} />
              <StatusCard label="Payment Verification" value={payment?.payment_details_status || 'Pending'} />
            </div>

            {/* admin note if any */}
            {app.admin_reason && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Administrator Note:</span> {app.admin_reason}
                </div>
              </div>
            )}

            {/* Sections */}
            <div className="space-y-4">
              {/* Personal Information */}
              <DetailSection title="Personal Information" icon={User}>
                <InfoGrid>
                  <InfoItem label="Full Name" value={app.student_name} />
                  <InfoItem label="Registration Number" value={app.registration_number} mono />
                  <InfoItem label="NIC Number" value={extra.nic_number} mono />
                  <InfoItem label="Mobile Number" value={app.phone} />
                  <InfoItem label="Email Address" value={app.email} />
                  <InfoItem label="Batch" value={app.batch} />
                  <InfoItem label="District" value={extra.district} />
                  <InfoItem label="Department" value={app.department} />
                  <InfoItem label="Postal Address" value={extra.postal_address} fullWidth />
                </InfoGrid>
              </DetailSection>

              {/* Family Details */}
              <DetailSection title="Family Details" icon={Users}>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">School-going Sibling(s)</h4>
                    {extra.school_siblings?.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">Date of Birth</th>
                              <th className="px-3 py-2">School</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {extra.school_siblings.map((s, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                                <td className="px-3 py-2">{s.dob ? format(new Date(s.dob), 'MMM d, yyyy') : '—'}</td>
                                <td className="px-3 py-2">{s.school}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No school-going siblings listed.</p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">University / Higher Education Sibling(s)</h4>
                    {extra.uni_siblings?.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">University / Institute</th>
                              <th className="px-3 py-2">Course</th>
                              <th className="px-3 py-2">A/L Year</th>
                              <th className="px-3 py-2">Mahapola</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {extra.uni_siblings.map((s, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                                <td className="px-3 py-2">{s.university}</td>
                                <td className="px-3 py-2">{s.course}</td>
                                <td className="px-3 py-2">{s.al_year}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.mahapola === 'Yes' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{s.mahapola || 'No'}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No university siblings listed.</p>
                    )}
                  </div>
                </div>
              </DetailSection>

              {/* Financial Details */}
              <DetailSection title="Financial Details" icon={DollarSign}>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Father / Guardian</h4>
                      <InfoGrid>
                        <InfoItem label="Name" value={extra.father_name} />
                        <InfoItem label="Occupation" value={extra.father_occupation} />
                        <InfoItem label="Monthly Income" value={extra.father_income ? `LKR ${Number(extra.father_income).toLocaleString()}` : '—'} />
                        <InfoItem label="Employer" value={extra.father_employer} />
                        <InfoItem label="Contact" value={extra.father_contact} />
                      </InfoGrid>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mother / Guardian</h4>
                      <InfoGrid>
                        <InfoItem label="Name" value={extra.mother_name} />
                        <InfoItem label="Occupation" value={extra.mother_occupation} />
                        <InfoItem label="Monthly Income" value={extra.mother_income ? `LKR ${Number(extra.mother_income).toLocaleString()}` : '—'} />
                        <InfoItem label="Employer" value={extra.mother_employer} />
                        <InfoItem label="Contact" value={extra.mother_contact} />
                      </InfoGrid>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Income & Support Summary</h4>
                    <InfoGrid>
                      <InfoItem label="Total Monthly Family Income" value={`LKR ${parseNum(app.monthly_income)}`} />
                      <InfoItem label="Family Members Count" value={extra.num_family_members} />
                      <InfoItem label="Number of Dependents" value={app.num_dependents} />
                      <InfoItem label="School Children Count" value={extra.school_children_count} />
                      <InfoItem label="University Students Count" value={extra.uni_students_count} />
                      <InfoItem label="Receiving Mahapola" value={extra.receiving_mahapola || '—'} />
                      <InfoItem label="Receiving Bursary" value={extra.receiving_bursary || '—'} />
                      <InfoItem label="Other Scholarships" value={extra.other_scholarships || '—'} />
                      <InfoItem label="Total Other Scholarship Amount" value={extra.other_scholarship_amount ? `LKR ${Number(extra.other_scholarship_amount).toLocaleString()}` : '—'} />
                    </InfoGrid>
                  </div>
                </div>
              </DetailSection>

              {/* Academic Details */}
              <DetailSection title="Academic Details" icon={GraduationCap}>
                <InfoGrid>
                  <InfoItem label="Current Year of Study" value={app.current_year} />
                  <InfoItem label="Semester" value={extra.semester} />
                  <InfoItem label="GPA / CGPA" value={app.gpa ? parseFloat(app.gpa).toFixed(2) : '—'} />
                </InfoGrid>
              </DetailSection>

              {/* Uploaded Documents */}
              <DetailSection title="Uploaded Documents" icon={FileText}>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                        <th className="px-4 py-3">Document Name</th>
                        <th className="px-4 py-3">Uploaded File</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {REQUIRED_DOCS.map(name => {
                        const doc = docs.find(d => d.document_name === name)
                        return (
                          <tr key={name} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-slate-700">{name}</td>
                            <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{doc ? doc.file_name : '—'}</td>
                            <td className="px-4 py-3">
                              {doc ? <StatusBadge status={doc.status} /> : <span className="badge-red">Missing</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {doc?.file_url ? (
                                <div className="inline-flex items-center gap-2">
                                  <button onClick={() => viewDocument(doc.file_url)} className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors" title="View">
                                    <Eye size={14} />
                                  </button>
                                  <a href={doc.file_url} download className="p-1 text-slate-400 hover:bg-slate-100 rounded transition-colors" title="Download">
                                    <Download size={14} />
                                  </a>
                                </div>
                              ) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </DetailSection>

              {/* Payment Details if submitted */}
              {payment && (
                <DetailSection title="Payment Details" icon={CreditCard}>
                  <InfoGrid>
                    <InfoItem label="Bank Name" value={payment.bank_name} />
                    <InfoItem label="Branch Name" value={payment.branch_name} />
                    <InfoItem label="Account Number" value={payment.account_number} mono />
                    <InfoItem label="Account Holder Name" value={payment.account_holder_name} />
                    <InfoItem label="Account Type" value={payment.account_type} />
                    <InfoItem label="Contact Number" value={payment.contact_number} />
                    {payment.passbook_file_url && (
                      <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Bank Passbook / Statement Copy</span>
                        <div className="inline-flex gap-2">
                          <button onClick={() => viewDocument(payment.passbook_file_url)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                            <Eye size={12} /> View
                          </button>
                          <a href={payment.passbook_file_url} download className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1 border border-slate-200 rounded-lg">
                            <Download size={12} /> Download
                          </a>
                        </div>
                      </div>
                    )}
                  </InfoGrid>
                </DetailSection>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-white">
          <button onClick={onClose} className="btn-secondary px-6 py-2">Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Status Card Helper
function StatusCard({ label, value, type = 'badge' }) {
  const getBadgeClass = (val) => {
    if (!val) return 'badge-slate'
    const clean = val.toLowerCase()
    if (clean.includes('approved') || clean === 'verified' || clean === 'completed') return 'badge-green'
    if (clean.includes('pending') || clean === 'submitted' || clean === 're-submitted' || clean === 'pending verification') return 'badge-blue'
    if (clean.includes('rejected') || clean === 'missing') return 'badge-red'
    if (clean.includes('resubmission') || clean.includes('review')) return 'badge-amber'
    return 'badge-slate'
  }

  return (
    <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100/50">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex justify-center">
        {type === 'status' ? (
          <StatusBadge status={value} />
        ) : (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getBadgeClass(value)}`}>
            {value || 'Pending'}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Detail Section Wrapper
function DetailSection({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-3.5">
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
        {Icon && <Icon size={15} className="text-purple-600" />}
        <h3 className="font-bold text-sm text-slate-800">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  )
}

// ── Info Grid Wrapper
function InfoGrid({ children }) {
  return <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">{children}</div>
}

// ── Info Item Wrapper
function InfoItem({ label, value, mono, fullWidth }) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-semibold text-slate-700 ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-slate-300 font-normal">—</span>}
      </p>
    </div>
  )
}