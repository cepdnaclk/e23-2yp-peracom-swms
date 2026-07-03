import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye } from 'lucide-react'
import { StatusBadge } from '../../components/common/StatusBadge'
import api from '../../services/api'

export default function DonorStudents() {
  const navigate = useNavigate()
  const [students, setStudents]       = useState([])
  const [scholarships, setScholarships] = useState([])
  const [search, setSearch]           = useState('')
  const [filterScholarship, setFilterScholarship] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [filterDecision, setFilterDecision] = useState('')
  const [loading, setLoading]         = useState(true)

  const load = () => {
    Promise.all([
      api.get('/donor/students').catch(() => ({ data: [] })),
      api.get('/donor/scholarships').catch(() => ({ data: [] })),
    ]).then(([s, sc]) => {
      setStudents(s.data)
      setScholarships(sc.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const decisionBadge = (d) => {
    if (d === 'Approved') return <span className="badge-green">Approved ✅</span>
    if (d === 'Rejected') return <span className="badge-red">Rejected ❌</span>
    if (d === 'Pending')  return <span className="badge-amber">Pending ⏳</span>
    return <span className="badge-grey">Not Reviewed</span>
  }

  const filtered = students.filter(s => {
    const matchSearch   = !search           || s.student_name?.toLowerCase().includes(search.toLowerCase())
    const matchSc       = !filterScholarship|| s.scholarship_id === filterScholarship
    const matchBatch    = !filterBatch      || s.batch?.includes(filterBatch)
    const matchDecision = !filterDecision   || (s.donor_decision || 'Not Reviewed') === filterDecision
    return matchSearch && matchSc && matchBatch && matchDecision
  })

  const counts = {
    total:    students.length,
    approved: students.filter(s => s.donor_decision === 'Approved').length,
    rejected: students.filter(s => s.donor_decision === 'Rejected').length,
    pending:  students.filter(s => s.donor_decision === 'Pending' || !s.donor_decision || s.donor_decision === 'Not Reviewed').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Assigned Students</h1>
        <p className="text-slate-500 text-sm mt-1">Review full applications and approve or reject each student.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Total Assigned', value: counts.total,    color:'bg-purple-50 text-purple-700' },
          { label:'Approved',       value: counts.approved, color:'bg-green-50  text-green-700' },
          { label:'Rejected',       value: counts.rejected, color:'bg-red-50    text-red-700' },
          { label:'Pending Review', value: counts.pending,  color:'bg-amber-50  text-amber-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`card p-4 text-center ${color}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-2xl font-extrabold mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search student name..." className="input-field pl-8"/>
        </div>
        <select value={filterScholarship} onChange={e => setFilterScholarship(e.target.value)} className="input-field">
          <option value="">All Scholarships</option>
          {scholarships.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <input value={filterBatch} onChange={e => setFilterBatch(e.target.value)}
          placeholder="Filter by batch..." className="input-field"/>
        <select value={filterDecision} onChange={e => setFilterDecision(e.target.value)} className="input-field">
          <option value="">All Decisions</option>
          {['Not Reviewed','Pending','Approved','Rejected'].map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {['Student Name','Scholarship','Batch','GPA','Department','Your Decision','Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No students found.</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id}
                className={`transition-colors hover:bg-slate-50/60
                  ${s.donor_decision==='Approved' ? 'border-l-2 border-l-green-400' :
                    s.donor_decision==='Rejected' ? 'border-l-2 border-l-red-400' :
                    'border-l-2 border-l-transparent'}`}>
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
                <td className="px-4 py-3 text-xs text-slate-500">{s.department}</td>
                <td className="px-4 py-3">{decisionBadge(s.donor_decision || 'Not Reviewed')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => navigate(`/donor/students/${s.id}/review`)}
                    className="flex items-center gap-1.5 btn-primary text-xs px-3 py-1.5">
                    <Eye size={12}/> Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-50 text-xs text-slate-400">
            Showing {filtered.length} of {students.length} students
          </div>
        )}
      </div>
    </div>
  )
}