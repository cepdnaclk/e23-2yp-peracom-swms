import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search, Eye, CreditCard, CheckCircle, Clock,
  AlertCircle, Lock, RefreshCw
} from 'lucide-react'
import { StatusBadge } from '../../components/common/StatusBadge'
import api from '../../services/api'

// ── Payment status badge helper
function PaymentBadge({ status }) {
  if (!status || status === 'Locked') {
    return <span className="inline-flex items-center gap-1 badge-grey"><Lock size={10}/> Locked</span>
  }
  const map = {
    Unlocked:                <span className="inline-flex items-center gap-1 badge-blue"><CreditCard size={10}/> Unlocked</span>,
    Submitted:               <span className="inline-flex items-center gap-1 badge-amber"><Clock size={10}/> Submitted</span>,
    'Re-Submitted':          <span className="inline-flex items-center gap-1 badge-amber"><Clock size={10}/> Re-Submitted</span>,
    'Pending Verification':  <span className="inline-flex items-center gap-1 badge-blue"><Clock size={10}/> Pending</span>,
    Verified:                <span className="inline-flex items-center gap-1 badge-green"><CheckCircle size={10}/> Verified ✓</span>,
    'Resubmission Required': <span className="inline-flex items-center gap-1 badge-red"><AlertCircle size={10}/> Correction Needed</span>,
  }
  return map[status] || <span className="badge-grey">{status}</span>
}

// ── Donor decision badge helper
function DecisionBadge({ decision }) {
  if (decision === 'Approved') return <span className="badge-green">Approved ✅</span>
  if (decision === 'Rejected') return <span className="badge-red">Rejected ❌</span>
  if (decision === 'Pending')  return <span className="badge-amber">Pending ⏳</span>
  return <span className="badge-grey">Not Reviewed</span>
}

export default function DonorStudents() {
  const navigate = useNavigate()
  const [students, setStudents]         = useState([])
  const [scholarships, setScholarships] = useState([])
  const [paymentMap, setPaymentMap]     = useState({})  // applicationId → payment_details_status
  const [search, setSearch]             = useState('')
  const [filterScholarship, setFilterScholarship] = useState('')
  const [filterBatch, setFilterBatch]   = useState('')
  const [filterDecision, setFilterDecision] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [loading, setLoading]           = useState(true)
  const [refreshing, setRefreshing]     = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [studentsRes, scholarshipsRes] = await Promise.all([
        api.get('/donor/students').catch(() => ({ data: [] })),
        api.get('/donor/scholarships').catch(() => ({ data: [] })),
      ])
      const studs = studentsRes.data || []
      setStudents(studs)
      setScholarships(scholarshipsRes.data || [])

      // Fetch payment status for all approved students in parallel
      const approvedApps = studs.filter(s =>
        s.donor_decision === 'Approved' && s.application_id
      )
      const paymentResults = await Promise.allSettled(
        approvedApps.map(s =>
          api.get(`/payment/${s.application_id}`)
            .then(r => ({ appId: s.application_id, status: r.data?.payment_details_status || 'Locked' }))
            .catch(() => ({ appId: s.application_id, status: 'Locked' }))
        )
      )
      const map = {}
      paymentResults.forEach(r => {
        if (r.status === 'fulfilled') map[r.value.appId] = r.value.status
      })
      setPaymentMap(map)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 30 seconds to catch payment updates
  useEffect(() => {
    const interval = setInterval(() => load(true), 30000)
    return () => clearInterval(interval)
  }, [load])

  const filtered = students.filter(s => {
    const matchSearch   = !search           || s.student_name?.toLowerCase().includes(search.toLowerCase())
    const matchSc       = !filterScholarship|| s.scholarship_id === filterScholarship
    const matchBatch    = !filterBatch      || s.batch?.includes(filterBatch)
    const matchDecision = !filterDecision   || (s.donor_decision || 'Not Reviewed') === filterDecision
    const payStatus     = paymentMap[s.application_id] || 'Locked'
    const matchPayment  = !filterPayment    || payStatus === filterPayment
    return matchSearch && matchSc && matchBatch && matchDecision && matchPayment
  })

  // Summary counts
  const counts = {
    total:           students.length,
    approved:        students.filter(s => s.donor_decision === 'Approved').length,
    rejected:        students.filter(s => s.donor_decision === 'Rejected').length,
    pending:         students.filter(s => !s.donor_decision || s.donor_decision === 'Not Reviewed' || s.donor_decision === 'Pending').length,
    paymentVerified: Object.values(paymentMap).filter(v => v === 'Verified').length,
    paymentPending:  Object.values(paymentMap).filter(v => ['Submitted','Re-Submitted','Pending Verification'].includes(v)).length,
  }

  // Row left-border color based on payment status for approved students
  const rowBorder = (s) => {
    if (s.donor_decision === 'Rejected') return 'border-l-2 border-l-red-400'
    const pay = paymentMap[s.application_id]
    if (pay === 'Verified')              return 'border-l-2 border-l-green-500'
    if (pay === 'Resubmission Required') return 'border-l-2 border-l-red-400'
    if (['Submitted','Re-Submitted','Pending Verification'].includes(pay))
                                         return 'border-l-2 border-l-amber-400'
    if (s.donor_decision === 'Approved') return 'border-l-2 border-l-blue-400'
    return 'border-l-2 border-l-transparent'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Assigned Students</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review applications and track payment verification status.
          </p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          className="btn-ghost flex items-center gap-1.5 text-sm disabled:opacity-50">
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',             value: counts.total,           color: 'bg-purple-50 text-purple-700' },
          { label: 'Approved',          value: counts.approved,        color: 'bg-green-50 text-green-700' },
          { label: 'Rejected',          value: counts.rejected,        color: 'bg-red-50 text-red-700' },
          { label: 'Pending Review',    value: counts.pending,         color: 'bg-amber-50 text-amber-700' },
          { label: 'Payment Submitted', value: counts.paymentPending,  color: 'bg-blue-50 text-blue-700' },
          { label: 'Payment Verified',  value: counts.paymentVerified, color: 'bg-green-50 text-green-800' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`card p-3 text-center ${color}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-xl font-extrabold mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Payment review shortcut */}
      {counts.paymentPending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CreditCard size={18} className="text-amber-600 flex-shrink-0"/>
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                {counts.paymentPending} student{counts.paymentPending > 1 ? 's have' : ' has'} submitted payment details awaiting your verification.
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Review and verify bank details to release scholarship funds.
              </p>
            </div>
          </div>
          <Link to="/donor/payments"
            className="btn-primary text-sm flex-shrink-0 flex items-center gap-1.5">
            <CreditCard size={14}/> Review Payments
          </Link>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search student name..." className="input-field pl-8"/>
        </div>
        <select value={filterScholarship} onChange={e => setFilterScholarship(e.target.value)} className="input-field">
          <option value="">All Scholarships</option>
          {scholarships.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <select value={filterDecision} onChange={e => setFilterDecision(e.target.value)} className="input-field">
          <option value="">All Decisions</option>
          {['Not Reviewed','Pending','Approved','Rejected'].map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)} className="input-field">
          <option value="">All Payment Statuses</option>
          {['Locked','Unlocked','Submitted','Re-Submitted','Pending Verification','Resubmission Required','Verified'].map(p => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {['Student Name','Scholarship','Batch','GPA','Decision','Payment Status','Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No students found.</td></tr>
            ) : filtered.map(s => {
              const payStatus = paymentMap[s.application_id] || 'Locked'
              const needsPaymentReview = ['Submitted','Re-Submitted','Pending Verification'].includes(payStatus)
              return (
                <tr key={s.id}
                  className={`transition-colors hover:bg-slate-50/60 ${rowBorder(s)}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{s.student_name}</p>
                    <p className="text-xs text-slate-400 font-mono">{s.registration_number}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[130px]">
                    <p className="truncate">{s.scholarship_title}</p>
                  </td>
                  <td className="px-4 py-3"><span className="badge-purple">{s.batch}</span></td>
                  <td className="px-4 py-3">
                    <span className={`font-bold text-sm ${parseFloat(s.gpa) >= 3.5 ? 'text-green-600' : 'text-slate-700'}`}>
                      {s.gpa ? parseFloat(s.gpa).toFixed(2) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DecisionBadge decision={s.donor_decision}/>
                  </td>
                  <td className="px-4 py-3">
                    <PaymentBadge status={payStatus}/>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/donor/students/${s.id}/review`)}
                        className="flex items-center gap-1.5 btn-primary text-xs px-3 py-1.5">
                        <Eye size={12}/> Review
                      </button>
                      {needsPaymentReview && (
                        <Link to="/donor/payments"
                          className="flex items-center gap-1.5 text-xs bg-amber-100 text-amber-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors">
                          <CreditCard size={12}/> Payment
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-50 text-xs text-slate-400">
            Showing {filtered.length} of {students.length} students
            {refreshing && <span className="ml-2 text-purple-500">• Refreshing…</span>}
          </div>
        )}
      </div>
    </div>
  )
}