import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Download, Eye, CheckCircle, XCircle, RotateCcw, ArrowLeft,
  User, BookOpen, DollarSign, FileText, Users, GraduationCap,
  MapPin, Phone, Mail, CreditCard, Clock, Shield, TrendingUp,
  ChevronDown, ChevronUp, AlertCircle, Building, Calendar,
  Home, Hash, Briefcase, Star, Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { viewDocument } from '../../utils/viewDocument'
import api from '../../services/api'
import { format } from 'date-fns'

const parseExtra = (raw) => { try { return raw ? JSON.parse(raw) : {} } catch { return {} } }

// ── Collapsible Section
function Section({ title, icon: Icon, color = 'purple', children, collapsible = false, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  const colors = {
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    blue:   'bg-blue-50   text-blue-700   border-blue-100',
    green:  'bg-green-50  text-green-700  border-green-100',
    amber:  'bg-amber-50  text-amber-700  border-amber-100',
    red:    'bg-red-50    text-red-700    border-red-100',
    slate:  'bg-slate-50  text-slate-700  border-slate-100',
  }
  return (
    <div className="card overflow-hidden">
      <button onClick={() => collapsible && setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-6 py-4 border-b ${colors[color]} ${collapsible ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}>
        <div className="flex items-center gap-2">
          {Icon && <Icon size={17}/>}
          <h2 className="font-semibold text-sm">{title}</h2>
          {badge && <span className="ml-2 badge-purple text-xs">{badge}</span>}
        </div>
        {collapsible && (open ? <ChevronUp size={15}/> : <ChevronDown size={15}/>)}
      </button>
      {open && <div className="p-6">{children}</div>}
    </div>
  )
}

function InfoGrid({ children }) {
  return <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">{children}</div>
}

function InfoItem({ label, value, icon: Icon, mono, highlight, fullWidth }) {
  const hc = highlight === 'green' ? 'text-green-600' : highlight === 'red' ? 'text-red-600' : highlight === 'amber' ? 'text-amber-600' : 'text-slate-800'
  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <p className="text-xs font-medium text-slate-400 flex items-center gap-1 mb-0.5">
        {Icon && <Icon size={11}/>}{label}
      </p>
      <p className={`text-sm font-semibold ${hc} ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-slate-300 font-normal">—</span>}
      </p>
    </div>
  )
}

function GPABar({ gpa }) {
  if (!gpa) return null
  const v = parseFloat(gpa)
  const pct = (v / 4) * 100
  const color = v >= 3.5 ? 'bg-green-500' : v >= 3.0 ? 'bg-blue-500' : v >= 2.5 ? 'bg-amber-400' : 'bg-red-400'
  const textColor = v >= 3.5 ? 'text-green-600' : v >= 3.0 ? 'text-blue-600' : v >= 2.5 ? 'text-amber-600' : 'text-red-500'
  const label = v >= 3.5 ? '⭐ Excellent' : v >= 3.0 ? '✓ Good' : v >= 2.5 ? '~ Average' : '⚠ Below Average'
  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-xl">
      <div className="flex justify-between text-xs text-slate-400 mb-1.5"><span>0.00</span><span>4.00</span></div>
      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }}/>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className={`text-xs font-bold ${textColor}`}>{label}</span>
        <span className="text-xs font-mono text-slate-500 font-semibold">{v.toFixed(2)} / 4.00</span>
      </div>
    </div>
  )
}

function NeedIndicator({ income, dependents }) {
  if (!income) return null
  const perPerson = dependents > 0 ? income / dependents : income
  const level = perPerson < 5000
    ? { label: '🔴 High Need', color: 'bg-red-100 text-red-700 border-red-200' }
    : perPerson < 15000
    ? { label: '🟡 Moderate Need', color: 'bg-amber-100 text-amber-700 border-amber-200' }
    : { label: '🟢 Low Need', color: 'bg-green-100 text-green-700 border-green-200' }
  return <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${level.color}`}>{level.label}</span>
}

function SchoolSiblingTable({ siblings = [] }) {
  if (!siblings.length) return <p className="text-sm text-slate-400 italic py-2">No school-going siblings listed.</p>
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {['Name','Date of Birth','Age','School'].map(h =>
              <th key={h} className="px-3 py-2.5 text-left text-slate-500 font-semibold uppercase tracking-wide">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {siblings.map((s, i) => {
            const age = s.dob ? Math.floor((Date.now() - new Date(s.dob).getTime()) / (1000*60*60*24*365.25)) : null
            return (
              <tr key={i} className="hover:bg-slate-50/60">
                <td className="px-3 py-2.5 font-medium text-slate-700">{s.name || '—'}</td>
                <td className="px-3 py-2.5 text-slate-500">{s.dob ? format(new Date(s.dob),'MMM d, yyyy') : '—'}</td>
                <td className="px-3 py-2.5">
                  {age !== null
                    ? <span className={`font-bold ${age <= 19 ? 'text-green-600' : 'text-red-500'}`}>{age} yrs</span>
                    : '—'}
                </td>
                <td className="px-3 py-2.5 text-slate-600">{s.school || '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function UniSiblingTable({ siblings = [] }) {
  if (!siblings.length) return <p className="text-sm text-slate-400 italic py-2">No university siblings listed.</p>
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {['Name','University / Institute','Course','A/L Year','A/L Index','Mahapola'].map(h =>
              <th key={h} className="px-3 py-2.5 text-left text-slate-500 font-semibold uppercase tracking-wide">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {siblings.map((s, i) => (
            <tr key={i} className="hover:bg-slate-50/60">
              <td className="px-3 py-2.5 font-medium text-slate-700">{s.name || '—'}</td>
              <td className="px-3 py-2.5 text-slate-600">{s.university || '—'}</td>
              <td className="px-3 py-2.5 text-slate-600">{s.course || '—'}</td>
              <td className="px-3 py-2.5 text-slate-500">{s.al_year || '—'}</td>
              <td className="px-3 py-2.5 font-mono text-slate-500">{s.al_index || '—'}</td>
              <td className="px-3 py-2.5">
                {s.mahapola === 'Yes'
                  ? <span className="badge-green">Yes</span>
                  : s.mahapola === 'No'
                  ? <span className="badge-grey">No</span>
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Document Row — View opens new tab via Google Docs Viewer, no modal
function DocRow({ doc, onVerify }) {
  const [verifying, setVerifying] = useState(false)
  const dot = { Verified:'bg-green-500', Submitted:'bg-blue-400', Missing:'bg-red-400' }

  const handleVerify = async () => {
    setVerifying(true)
    await onVerify(doc.id)
    setVerifying(false)
  }

  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="px-4 py-3 w-8">
        <span className={`w-2.5 h-2.5 rounded-full inline-block ${dot[doc.status] || 'bg-slate-300'}`}/>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-slate-800 text-sm">{doc.document_name}</p>
        {doc.file_name && <p className="text-xs text-slate-400 font-mono truncate max-w-[180px]">{doc.file_name}</p>}
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">
        {doc.created_at ? format(new Date(doc.created_at),'MMM d, yyyy') : '—'}
      </td>
      <td className="px-4 py-3"><StatusBadge status={doc.status || 'Submitted'}/></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          {doc.file_url ? (
            <button onClick={() => viewDocument(doc.file_url)}
              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium">
              <Eye size={12}/> View
            </button>
          ) : (
            <span className="text-xs text-slate-300">No file</span>
          )}
          {doc.file_url && (
            <>
              <span className="text-slate-200">|</span>
              <a href={doc.file_url} download={doc.file_name}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                <Download size={12}/> Download
              </a>
            </>
          )}
          {doc.status !== 'Verified' && onVerify && (
            <>
              <span className="text-slate-200">|</span>
              <button onClick={handleVerify} disabled={verifying}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium disabled:opacity-50">
                {verifying
                  ? <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin"/>
                  : <CheckCircle size={12}/>}
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </>
          )}
          {doc.status === 'Verified' && (
            <span className="text-xs text-green-600 font-semibold">✓ Verified</span>
          )}
        </div>
      </td>
    </tr>
  )
}

const COMMON_REQUIRED_DOCS = [
  'NIC Copy',
  'Academic Transcript',
  'Faculty Acceptance Letter',
  'Student Request Letter',
  'University ID Copy'
]

// ══════════════════════════════════════════════════════════
export default function ApplicationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [app, setApp]       = useState(null)
  const [docs, setDocs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [decision, setDecision] = useState(null)
  const [reason, setReason]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    Promise.all([
      api.get(`/applications/${id}`),
      api.get(`/applications/${id}/documents`).catch(() => ({ data: [] })),
    ]).then(([a, d]) => {
      setApp(a.data)
      setDocs(d.data)
    }).catch(() => toast.error('Application not found'))
    .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [id])

  const handleDecision = async (action) => {
    if ((action === 'reject' || action === 'resubmit') && !reason.trim()) {
      return toast.error('Please provide a reason')
    }
    setSubmitting(true)
    try {
      const map = { approve:'approve', reject:'reject', resubmit:'resubmit' }
      await api.post(`/applications/${id}/${map[action]}`, { admin_reason: reason })
      toast.success(
  action === 'approve'
    ? '✅ Application approved. Payment details requested from the student.'
    : action === 'reject'
    ? '❌ Application rejected'
    : '↩ Resubmission requested'
)
      setDecision(null); setReason('')
      load()
    } catch { toast.error('Action failed') }
    finally { setSubmitting(false) }
  }

  const handleVerifyDoc = async (docId) => {
    await api.patch(`/applications/${id}/documents/${docId}/verify`).catch(() => {})
    toast.success('Document verified')
    load()
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Loading application...</div>
  if (!app)    return <div className="p-8 text-center text-slate-400">Application not found.</div>

  const extra = parseExtra(app.extra_data)

const supplementaryDocuments = Array.isArray(
  app.supplementary_documents
)
  ? app.supplementary_documents
      .map(documentName => String(documentName).trim())
      .filter(documentName => documentName !== '')
  : []

const requiredDocs = [
  ...COMMON_REQUIRED_DOCS,
  ...supplementaryDocuments
]

const verifiedDocs = requiredDocs.filter(documentName =>
  docs.some(
    document =>
      document.document_name === documentName &&
      document.status === 'Verified'
  )
).length

const submittedDocs = requiredDocs.filter(documentName =>
  docs.some(
    document =>
      document.document_name === documentName &&
      document.status === 'Submitted'
  )
).length

const missingDocs = requiredDocs.filter(documentName =>
  !docs.some(document => document.document_name === documentName)
).length

const docScore = Math.round(
  (verifiedDocs / requiredDocs.length) * 100
)

  return (
    <div className="space-y-5 max-w-4xl">
      <Breadcrumb items={[{label:'Applications',href:'/applications'},{label:'Review'},{label:'Detail'}]}/>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-purple-600 font-semibold mb-1">
            Scholarship: {app.scholarship_title || 'Unknown'}
          </p>
          <h1 className="page-title">Application Review</h1>
          <p className="text-xs text-slate-400 mt-1">
            Submitted {app.created_at ? format(new Date(app.created_at),'MMM d, yyyy · h:mm a') : '—'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={app.status}/>
          <button onClick={() => navigate('/applications')} className="btn-ghost flex items-center gap-1.5 text-sm">
            <ArrowLeft size={14}/> Back
          </button>
        </div>
      </div>

      {/* Quick summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Student',     value: app.student_name,       icon: User,         color: 'bg-purple-50 text-purple-600' },
          { label: 'Department',  value: app.department,          icon: Building,     color: 'bg-blue-50 text-blue-600' },
          { label: 'GPA',         value: app.gpa ? `${parseFloat(app.gpa).toFixed(2)} / 4.00` : '—', icon: Star, color: 'bg-amber-50 text-amber-600' },
          { label: 'Docs Verified', value: `${verifiedDocs} / ${requiredDocs.length}`, icon: FileText, color: 'bg-green-50 text-green-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={16}/>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-sm font-bold text-slate-800 truncate">{value || '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 1. Personal Information ── */}
      <Section title="Personal Information" icon={User} color="purple">
        <InfoGrid>
          <InfoItem label="Full Name"            value={app.student_name}         icon={User}/>
          <InfoItem label="Registration Number"  value={app.registration_number}  icon={Hash} mono/>
          <InfoItem label="NIC Number"           value={extra.nic_number}         icon={CreditCard} mono/>
          <InfoItem label="Mobile Number"        value={app.phone}                icon={Phone}/>
          <InfoItem label="Email Address"        value={app.email}                icon={Mail}/>
          <InfoItem label="Batch"                value={app.batch}                icon={Calendar}/>
          <InfoItem label="District"             value={extra.district}           icon={MapPin}/>
          <InfoItem label="Department"           value={app.department}           icon={Building}/>
          <InfoItem label="Postal Address"       value={extra.postal_address}     icon={Home} fullWidth/>
        </InfoGrid>
      </Section>

      {/* ── 2. Family Details ── */}
      <Section title="Family Details" icon={Users} color="blue" collapsible defaultOpen={true}
        badge={`${(extra.school_siblings?.length||0) + (extra.uni_siblings?.length||0)} siblings`}>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <GraduationCap size={13}/> School-going Brothers / Sisters
              <span className="badge-blue ml-2">{extra.school_siblings?.length || 0}</span>
            </p>
            <SchoolSiblingTable siblings={extra.school_siblings || []}/>
          </div>
          <div className="border-t border-slate-100 pt-5">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <BookOpen size={13}/> Brothers / Sisters in University or Higher Education
              <span className="badge-blue ml-2">{extra.uni_siblings?.length || 0}</span>
            </p>
            <UniSiblingTable siblings={extra.uni_siblings || []}/>
          </div>
        </div>
      </Section>

      {/* ── 3. Financial Details ── */}
      <Section title="Financial Details" icon={DollarSign} color="amber" collapsible defaultOpen={true}>
        <div className="space-y-6">

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Father / Guardian</p>
              <InfoGrid>
                <InfoItem label="Name"       value={extra.father_name}/>
                <InfoItem label="Occupation" value={extra.father_occupation} icon={Briefcase}/>
                <InfoItem label="Monthly Income" value={extra.father_income ? `LKR ${Number(extra.father_income).toLocaleString()}` : null}
                  icon={DollarSign} highlight={extra.father_income < 10000 ? 'red' : 'green'}/>
                <InfoItem label="Employer"   value={extra.father_employer}/>
                <InfoItem label="Contact"    value={extra.father_contact} icon={Phone}/>
              </InfoGrid>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Mother / Guardian</p>
              <InfoGrid>
                <InfoItem label="Name"       value={extra.mother_name}/>
                <InfoItem label="Occupation" value={extra.mother_occupation} icon={Briefcase}/>
                <InfoItem label="Monthly Income" value={extra.mother_income ? `LKR ${Number(extra.mother_income).toLocaleString()}` : null}
                  icon={DollarSign} highlight={extra.mother_income < 10000 ? 'red' : 'green'}/>
                <InfoItem label="Employer"   value={extra.mother_employer}/>
                <InfoItem label="Contact"    value={extra.mother_contact} icon={Phone}/>
              </InfoGrid>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Family Income Summary</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {[
                { label:'Total Monthly Income', value: app.monthly_income ? `LKR ${Number(app.monthly_income).toLocaleString()}` : '—', color:'bg-purple-50 text-purple-700' },
                { label:'Family Members',       value: extra.num_family_members || '—',    color:'bg-blue-50 text-blue-700' },
                { label:'Dependents',           value: app.num_dependents || '—',          color:'bg-amber-50 text-amber-700' },
                { label:'School Children',      value: extra.school_children_count || '—', color:'bg-green-50 text-green-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
                  <p className="text-xs font-medium opacity-70">{label}</p>
                  <p className="text-base font-bold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <NeedIndicator income={parseFloat(app.monthly_income)} dependents={parseInt(app.num_dependents)}/>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Existing Financial Aid</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: 'Mahapola',         value: extra.receiving_mahapola },
                { label: 'Bursary',          value: extra.receiving_bursary },
                { label: 'Other Scholarships', value: extra.other_scholarships || 'None' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                  <p className={`text-sm font-bold mt-0.5 ${value === 'Yes' ? 'text-amber-600' : 'text-slate-700'}`}>{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── 4. Academic Details ── */}
      <Section title="Academic Details" icon={GraduationCap} color="green">
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          {[
            { label:'Current Year',  value: app.current_year  || extra.current_year },
            { label:'Semester',      value: extra.semester },
            { label:'Department',    value: app.department },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-base font-bold text-slate-800 mt-1">{value || '—'}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1">GPA / CGPA</p>
          <GPABar gpa={app.gpa}/>
        </div>
      </Section>

      {/* ── 5. Documents ── */}
      <Section title="Required Documents" icon={FileText} color="slate">
        <div className="flex flex-wrap items-center gap-4 mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="badge-green">{verifiedDocs} Verified</span>
            <span className="badge-blue">{submittedDocs} Submitted</span>
            {missingDocs > 0 && <span className="badge-red">{missingDocs} Missing</span>}
          </div>
          <div className="flex-1 min-w-[140px]">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width:`${docScore}%` }}/>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{docScore}% verified</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-700 mb-4 flex items-start gap-2">
          <Info size={13} className="mt-0.5 flex-shrink-0"/>
          Only the latest uploaded document is shown per type. "View" opens the document in a new tab. Click "Verify" after reviewing each document.
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['','Document','Uploaded','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requiredDocs.map(name => {
                const doc = docs.find(d => d.document_name === name)
                if (doc) return <DocRow key={name} doc={doc} onVerify={handleVerifyDoc}/>
                return (
                  <tr key={name} className="bg-red-50/20">
                    <td className="px-4 py-3 w-8"><span className="w-2.5 h-2.5 rounded-full inline-block bg-red-300"/></td>
                    <td className="px-4 py-3 font-medium text-slate-500 text-sm">{name}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">—</td>
                    <td className="px-4 py-3"><StatusBadge status="Missing"/></td>
                    <td className="px-4 py-3 text-xs text-slate-300">Not uploaded</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 6. Timeline ── */}
      <Section title="Application Timeline" icon={Clock} color="slate" collapsible defaultOpen={false}>
        <div className="space-y-3">
          {[
            { label:'Application Submitted', date: app.created_at,  color:'bg-purple-500' },
            { label:`Status: ${app.status}`, date: app.updated_at,  color:
                app.status==='Awaiting Payment Details' ? 'bg-green-500' :
                app.status==='Rejected' ? 'bg-red-500' : 'bg-amber-400' },
          ].filter(e => e.date).map(({ label, date, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${color} flex-shrink-0`}/>
              <div className="flex items-center justify-between flex-1 gap-4">
                <span className="text-sm text-slate-700">{label}</span>
                <span className="text-xs text-slate-400">{format(new Date(date),'MMM d, yyyy · h:mm a')}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 7. Admin Decision ── */}
      {app.status === 'Pending' && (
        <div className="card p-6 border-2 border-purple-100">
          <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <Shield size={16} className="text-purple-600"/> Admin Decision
          </h2>

          {!decision ? (
            <div className="space-y-4">
              {verifiedDocs < requiredDocs.length && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-center gap-2">
                  <AlertCircle size={13}/> {missingDocs > 0 ? `${missingDocs} document(s) missing.` : `${submittedDocs} document(s) not yet verified.`} Review documents before approving.
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button
  onClick={() => handleDecision('approve')}
  disabled={submitting || verifiedDocs < requiredDocs.length}
  title={
    verifiedDocs < requiredDocs.length
      ? 'Verify all required documents before requesting payment details'
      : 'Approve application and request student payment details'
  }
  className="btn-primary flex items-center gap-2 flex-1 sm:flex-none justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {submitting ? (
    <>
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      Processing...
    </>
  ) : (
    <>
      <CheckCircle size={16} />
      Approve & Request Payment Details
    </>
  )}
</button>
                <button onClick={() => setDecision('reject')}
                  className="btn-danger flex items-center gap-2 flex-1 sm:flex-none justify-center py-3">
                  <XCircle size={16}/> Reject Application
                </button>
                <button onClick={() => setDecision('resubmit')}
                  className="bg-amber-100 text-amber-700 font-semibold px-6 py-3 rounded-xl hover:bg-amber-200 transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center">
                  <RotateCcw size={16}/> Request Resubmission
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`flex items-center gap-2 text-sm font-semibold
                ${decision==='reject' ? 'text-red-600' : 'text-amber-600'}`}>
                {decision==='reject' ? <><XCircle size={15}/> Rejecting Application</> : <><RotateCcw size={15}/> Requesting Resubmission</>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {decision==='reject' ? 'Rejection Reason *' : 'Resubmission Notes *'}
                </label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
                  placeholder={decision==='reject'
                    ? 'Explain why this application is being rejected...'
                    : 'Explain what needs to be corrected or resubmitted...'}
                  className="input-field resize-none"/>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleDecision(decision)}
                  disabled={submitting || !reason.trim()}
                  className={`flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50
                    ${decision==='reject' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
                  {submitting
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Processing...</>
                    : 'Confirm'}
                </button>
                <button onClick={() => { setDecision(null); setReason('') }} className="btn-ghost">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Already decided */}
      {app.status !== 'Pending' && (
        <div className={`card p-5 border-l-4
          ${app.status==='Awaiting Payment Details' ? 'border-green-500 bg-green-50/50'  :
            app.status==='Rejected'               ? 'border-red-500   bg-red-50/50'    :
            app.status==='Resubmission Requested' ? 'border-amber-500 bg-amber-50/50'  :
                                                    'border-slate-300'}`}>
          <div className="flex items-center gap-2 mb-1">
            {app.status==='Awaiting Payment Details' ? <CheckCircle size={16} className="text-green-600"/>  :
             app.status==='Rejected'               ? <XCircle    size={16} className="text-red-600"/>    :
             <RotateCcw  size={16} className="text-amber-600"/>}
            <p className="font-semibold text-slate-800">
  {app.status === 'Awaiting Payment Details'
    ? 'Application approved. Waiting for the student to submit payment details.'
    : (
      <>
        This application has been{' '}
        <span className="capitalize">{app.status}</span>
      </>
    )}
</p>
          </div>
          {app.admin_reason && <p className="text-sm italic text-slate-600 mt-1 ml-6">{app.admin_reason}</p>}
        </div>
      )}
    </div>
  )
}