import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Eye, Download, CheckCircle, XCircle, ArrowLeft,
  User, BookOpen, DollarSign, FileText, Users, GraduationCap,
  MapPin, Phone, Mail, CreditCard, Clock, Building, Calendar,
  Home, Hash, Briefcase, Star, Info, ChevronDown, ChevronUp,
  Lock, AlertCircle, RotateCcw, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import { viewDocument } from '../../utils/viewDocument'
import api from '../../services/api'
import { format } from 'date-fns'

const parseExtra = (raw) => { try { return raw ? JSON.parse(raw) : {} } catch { return {} } }
const COMMON_REQUIRED_DOCS = [
  'NIC Copy',
  'Academic Transcript',
  'Faculty Acceptance Letter',
  'Student Request Letter',
  'University ID Copy'
]

// ── Collapsible Section (reused pattern from admin review page)
function Section({ title, icon: Icon, color = 'purple', children, collapsible = false, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  const colors = {
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    blue:   'bg-blue-50   text-blue-700   border-blue-100',
    green:  'bg-green-50  text-green-700  border-green-100',
    amber:  'bg-amber-50  text-amber-700  border-amber-100',
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
  const hc = highlight==='green' ? 'text-green-600' : highlight==='red' ? 'text-red-600' : highlight==='amber' ? 'text-amber-600' : 'text-slate-800'
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

// ── Document Row — View opens new tab via Google Docs Viewer
function DocRow({ name, doc }) {
  const dot = !doc ? 'bg-red-400' : doc.status === 'Verified' ? 'bg-green-500' : 'bg-blue-400'
  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="px-4 py-3 w-8"><span className={`w-2.5 h-2.5 rounded-full inline-block ${dot}`}/></td>
      <td className="px-4 py-3">
        <p className="font-medium text-slate-800 text-sm">{name}</p>
        {doc?.file_name && <p className="text-xs text-slate-400 font-mono truncate max-w-[180px]">{doc.file_name}</p>}
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">
        {doc?.created_at ? format(new Date(doc.created_at),'MMM d, yyyy') : '—'}
      </td>
      <td className="px-4 py-3"><StatusBadge status={doc?.status || 'Missing'}/></td>
      <td className="px-4 py-3">
        {doc?.file_url ? (
          <div className="flex items-center gap-2">
            <button onClick={() => viewDocument(doc.file_url)}
              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium">
              <Eye size={12}/> View
            </button>
            <span className="text-slate-200">|</span>
            <a href={doc.file_url} download={doc.file_name}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
              <Download size={12}/> Download
            </a>
          </div>
        ) : (
          <span className="text-xs text-slate-300">Not uploaded</span>
        )}
      </td>
    </tr>
  )
}

// ══════════════════════════════════════════════════════════
export default function DonorApplicationReview() {
  const { id } = useParams()  // donor_students.id
  const navigate = useNavigate()

  const [assignment, setAssignment] = useState(null)
  const [app, setApp]               = useState(null)
  const [docs, setDocs]             = useState([])
  const [payment, setPayment]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [action, setAction]         = useState(null)
  const [comment, setComment]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [refreshingPayment, setRefreshingPayment] = useState(false)

  const loadPayment = async (applicationId) => {
    if (!applicationId) return
    try {
      const r = await api.get(`/payment/${applicationId}`)
      setPayment(r.data)
    } catch { setPayment(null) }
  }

  const load = () => {
    setLoading(true)
    api.get('/donor/students')
      .then(r => {
        const found = r.data.find(s => s.id === id)
        setAssignment(found || null)
        if (found?.application_id) {
          return Promise.all([
            api.get(`/applications/${found.application_id}`).catch(() => ({ data: {} })),
            api.get(`/applications/${found.application_id}/documents`).catch(() => ({ data: [] })),
            api.get(`/payment/${found.application_id}`).catch(() => ({ data: null })),
          ]).then(([a, d, p]) => {
            setApp(a.data)
            setDocs(d.data)
            setPayment(p.data)
          })
        }
      })
      .catch(() => toast.error('Could not load application'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [id])

  // Auto-refresh payment status every 20 seconds
  useEffect(() => {
    if (!assignment?.application_id) return
    const interval = setInterval(async () => {
      setRefreshingPayment(true)
      await loadPayment(assignment.application_id)
      setRefreshingPayment(false)
    }, 20000)
    return () => clearInterval(interval)
  }, [assignment?.application_id])

  const handleSubmit = async () => {
    if (!action) return
    if (action === 'Rejected' && !comment.trim()) { toast.error('Please provide a rejection reason'); return }
    setSubmitting(true)
    try {
      await api.post(`/donor/students/${id}/decision`, { decision: action, comment })
      toast.success(action === 'Approved' ? '✅ Student approved!' : '❌ Student rejected')
      navigate('/donor/students')
    } catch { toast.error('Action failed') }
    finally { setSubmitting(false) }
  }

  const decisionBadge = (d) => {
    if (d === 'Approved') return <span className="badge-green">Approved ✅</span>
    if (d === 'Rejected') return <span className="badge-red">Rejected ❌</span>
    if (d === 'Pending')  return <span className="badge-amber">Pending ⏳</span>
    return <span className="badge-grey">Not Reviewed</span>
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Loading application...</div>
  if (!assignment) return (
    <div className="p-8 text-center text-slate-400">
      Assignment not found.
      <div className="mt-4">
        <button onClick={() => navigate('/donor/students')} className="btn-primary">Back to Assigned Students</button>
      </div>
    </div>
  )

  
  const extra = parseExtra(app?.extra_data)

const supplementaryDocuments = Array.isArray(
  app?.supplementary_documents
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

const alreadyDecided =
  assignment.donor_decision === 'Approved' ||
  assignment.donor_decision === 'Rejected'

  return (
    <div className="space-y-5 max-w-4xl pb-32">
      <Breadcrumb items={[{label:'Assigned Students',href:'/donor/students'},{label:'Application Review'}]}/>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-purple-600 font-semibold mb-1">
            Scholarship: {assignment.scholarship_title || 'Unknown'}
          </p>
          <h1 className="page-title">{assignment.student_name}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Reg. No. {assignment.registration_number} · Batch {assignment.batch}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {decisionBadge(assignment.donor_decision)}
          <button onClick={() => navigate('/donor/students')} className="btn-ghost flex items-center gap-1.5 text-sm">
            <ArrowLeft size={14}/> Back
          </button>
        </div>
      </div>

      {/* Quick summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Batch',       value: assignment.batch,                       icon: Calendar,   color: 'bg-purple-50 text-purple-600' },
          { label: 'Department',  value: assignment.department,                  icon: Building,   color: 'bg-blue-50 text-blue-600' },
          { label: 'GPA',         value: assignment.gpa ? `${parseFloat(assignment.gpa).toFixed(2)} / 4.00` : '—', icon: Star, color: 'bg-amber-50 text-amber-600' },
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
          <InfoItem label="Full Name"            value={app?.student_name || assignment.student_name} icon={User}/>
          <InfoItem label="Registration Number"  value={assignment.registration_number} icon={Hash} mono/>
          <InfoItem label="NIC Number"           value={extra.nic_number}         icon={CreditCard} mono/>
          <InfoItem label="Mobile Number"        value={app?.phone}               icon={Phone}/>
          <InfoItem label="Email Address"        value={app?.email}               icon={Mail}/>
          <InfoItem label="Batch"                value={assignment.batch}         icon={Calendar}/>
          <InfoItem label="District"             value={extra.district}           icon={MapPin}/>
          <InfoItem label="Department"           value={assignment.department}    icon={Building}/>
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
                { label:'Total Monthly Income', value: app?.monthly_income ? `LKR ${Number(app.monthly_income).toLocaleString()}` : '—', color:'bg-purple-50 text-purple-700' },
                { label:'Family Members',       value: extra.num_family_members || '—',    color:'bg-blue-50 text-blue-700' },
                { label:'Dependents',           value: app?.num_dependents || '—',         color:'bg-amber-50 text-amber-700' },
                { label:'School Children',      value: extra.school_children_count || '—', color:'bg-green-50 text-green-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
                  <p className="text-xs font-medium opacity-70">{label}</p>
                  <p className="text-base font-bold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <NeedIndicator income={parseFloat(app?.monthly_income)} dependents={parseInt(app?.num_dependents)}/>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Existing Financial Aid</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: 'Mahapola',           value: extra.receiving_mahapola },
                { label: 'Bursary',            value: extra.receiving_bursary },
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
            { label:'Current Year',  value: app?.current_year || extra.current_year },
            { label:'Semester',      value: extra.semester },
            { label:'Department',    value: assignment.department },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-base font-bold text-slate-800 mt-1">{value || '—'}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1">GPA / CGPA</p>
          <GPABar gpa={assignment.gpa}/>
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
          "View" opens the document in a new tab. Only the latest upload is shown per document type.
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
              {requiredDocs.map(name => (
                <DocRow key={name} name={name} doc={docs.find(d => d.document_name === name)}/>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 6. Timeline ── */}
      {app?.created_at && (
        <Section title="Application Timeline" icon={Clock} color="slate" collapsible defaultOpen={false}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0"/>
              <div className="flex items-center justify-between flex-1 gap-4">
                <span className="text-sm text-slate-700">Application Submitted</span>
                <span className="text-xs text-slate-400">{format(new Date(app.created_at),'MMM d, yyyy · h:mm a')}</span>
              </div>
            </div>
            {assignment.donor_decision && assignment.donor_decision !== 'Not Reviewed' && (
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${assignment.donor_decision==='Approved' ? 'bg-green-500' : assignment.donor_decision==='Rejected' ? 'bg-red-500' : 'bg-amber-400'}`}/>
                <div className="flex items-center justify-between flex-1 gap-4">
                  <span className="text-sm text-slate-700">Donor Decision: {assignment.donor_decision}</span>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── 7. Payment Details ── */}
      {assignment.donor_decision === 'Approved' && (
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-purple-50 border-purple-100">
            <div className="flex items-center gap-2">
              <CreditCard size={17} className="text-purple-700"/>
              <h2 className="font-semibold text-sm text-purple-700">Payment Details</h2>
              {payment?.payment_details_status && (
                <StatusBadge status={payment.payment_details_status}/>
              )}
            </div>
            <button
              onClick={async () => {
                setRefreshingPayment(true)
                await loadPayment(assignment.application_id)
                setRefreshingPayment(false)
              }}
              disabled={refreshingPayment}
              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 disabled:opacity-50">
              <RefreshCw size={12} className={refreshingPayment ? 'animate-spin' : ''}/>
              {refreshingPayment ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div className="p-6">
            {/* No payment submitted yet */}
            {(!payment || payment.payment_details_status === 'Locked') && (
              <div className="flex items-center gap-3 py-4 text-slate-400">
                <Lock size={18} className="flex-shrink-0"/>
                <div>
                  <p className="text-sm font-medium text-slate-600">Payment details not yet submitted</p>
                  <p className="text-xs mt-0.5">The student will be able to submit payment details once both approvals are complete.</p>
                </div>
              </div>
            )}

            {/* Unlocked but not yet submitted */}
            {payment?.payment_details_status === 'Unlocked' && (
              <div className="flex items-center gap-3 py-4 text-blue-600 bg-blue-50 rounded-xl px-4">
                <CreditCard size={18} className="flex-shrink-0"/>
                <div>
                  <p className="text-sm font-semibold">Payment section is unlocked</p>
                  <p className="text-xs mt-0.5 text-blue-500">Waiting for the student to fill in their bank details.</p>
                </div>
              </div>
            )}

            {/* Payment submitted / under review / resubmission */}
            {payment && !['Locked','Unlocked'].includes(payment.payment_details_status) && (
              <div className="space-y-5">

                {/* Resubmission required alert */}
                {payment.payment_details_status === 'Resubmission Required' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                      <AlertCircle size={15}/> Resubmission Requested
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-red-500 font-medium">Reason</p>
                        <p className="text-red-700 font-semibold mt-0.5">{payment.resubmission_reason}</p>
                      </div>
                      {payment.donor_payment_comments && (
                        <div>
                          <p className="text-red-500 font-medium">Your Comments</p>
                          <p className="text-red-700 mt-0.5">{payment.donor_payment_comments}</p>
                        </div>
                      )}
                    </div>
                    {payment.payment_resubmission_count > 0 && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <RotateCcw size={10}/> Resubmission #{payment.payment_resubmission_count}
                      </p>
                    )}
                  </div>
                )}

                {/* Verified banner */}
                {payment.payment_details_status === 'Verified' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0"/>
                    <div>
                      <p className="font-semibold text-green-700 text-sm">Payment Details Verified ✓</p>
                      {payment.payment_verified_date && (
                        <p className="text-xs text-green-500 mt-0.5">
                          Verified on {format(new Date(payment.payment_verified_date), 'MMM d, yyyy · h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Bank details grid */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Bank Account Information</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { label: 'Account Holder Name', value: payment.account_holder_name, icon: User },
                      { label: 'Bank Name',           value: payment.bank_name,           icon: Building },
                      { label: 'Branch Name',         value: payment.branch_name,         icon: Building },
                      { label: 'Account Number',      value: payment.account_number,      icon: Hash },
                      { label: 'Account Type',        value: payment.account_type,        icon: CreditCard },
                      { label: 'Contact Number',      value: payment.contact_number,      icon: Phone },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-3.5">
                        <p className="text-xs text-slate-400 flex items-center gap-1 mb-0.5">
                          <Icon size={10}/>{label}
                        </p>
                        <p className="text-sm font-semibold text-slate-800">{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Passbook */}
                {payment.passbook_url && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Bank Passbook</p>
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <FileText size={14} className="text-green-600 flex-shrink-0"/>
                      <p className="text-xs text-green-700 font-medium flex-1 truncate">
                        {payment.passbook_file_name || 'Bank passbook document'}
                      </p>
                      <button onClick={() => viewDocument(payment.passbook_url)}
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium flex-shrink-0">
                        <Eye size={12}/> View
                      </button>
                      <a href={payment.passbook_url} download={payment.passbook_file_name}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 flex-shrink-0">
                        <Download size={12}/> Download
                      </a>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 border-t border-slate-100">
                  {payment.updated_at && (
                    <span className="flex items-center gap-1">
                      <Clock size={11}/>
                      Last updated {format(new Date(payment.updated_at), 'MMM d, yyyy · h:mm a')}
                    </span>
                  )}
                  {payment.payment_resubmission_count > 0 && (
                    <span className="flex items-center gap-1">
                      <RotateCcw size={11}/>
                      {payment.payment_resubmission_count} resubmission{payment.payment_resubmission_count > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Payment action buttons — only when submitted/re-submitted */}
                {['Submitted','Re-Submitted','Pending Verification'].includes(payment.payment_details_status) && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Payment Verification</p>
                    <div className="flex flex-wrap gap-3">
                      <Link to="/donor/payments"
                        className="btn-primary flex items-center gap-2">
                        <CheckCircle size={15}/> Review & Verify Payment
                      </Link>
                      <p className="text-xs text-slate-400 self-center">
                        Go to the Payments page to verify or request correction.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 8. Decision Panel (sticky bottom bar) ── */}
      {!alreadyDecided ? (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {action === 'Rejected' ? 'Rejection Reason *' : 'Comment (optional)'}
                </label>
                <textarea value={comment} onChange={e => setComment(e.target.value)}
                  rows={2} placeholder={action === 'Rejected' ? 'Why are you rejecting this student?' : 'Add a comment (optional)...'}
                  className="input-field resize-none text-sm"/>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setAction(a => a === 'Approved' ? null : 'Approved')}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors
                    ${action==='Approved' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                  <CheckCircle size={15}/> Approve
                </button>
                <button onClick={() => setAction(a => a === 'Rejected' ? null : 'Rejected')}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors
                    ${action==='Rejected' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                  <XCircle size={15}/> Reject
                </button>
                <button onClick={handleSubmit}
                  disabled={!action || submitting || (action==='Rejected' && !comment.trim())}
                  className="btn-primary px-6 disabled:opacity-40 disabled:cursor-not-allowed">
                  {submitting
                    ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Submitting...</span>
                    : 'Confirm Decision'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`card p-5 border-l-4
          ${assignment.donor_decision==='Approved' ? 'border-green-500 bg-green-50/50' : 'border-red-500 bg-red-50/50'}`}>
          <div className="flex items-center gap-2">
            {assignment.donor_decision==='Approved'
              ? <CheckCircle size={16} className="text-green-600"/>
              : <XCircle    size={16} className="text-red-600"/>}
            <p className="font-semibold text-slate-800">
              You have {assignment.donor_decision === 'Approved' ? 'approved' : 'rejected'} this student.
            </p>
          </div>
          {assignment.comment && <p className="text-sm italic text-slate-600 mt-1 ml-6">{assignment.comment}</p>}
        </div>
      )}
    </div>
  )
}