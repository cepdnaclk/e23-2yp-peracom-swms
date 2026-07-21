import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import api from '../../services/api'
import { format } from 'date-fns'

export default function ApplicationsPage() {
  const [apps, setApps] = useState([])
  const [scholarships, setScholarships] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterScholarship, setFilterScholarship] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/applications'),
      api.get('/scholarships'),
    ]).then(([a, s]) => {
      setApps(a.data)
      setScholarships(s.data)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = apps.filter(a => {
    const matchSearch = !search || a.student_name?.toLowerCase().includes(search.toLowerCase())
    const matchS = !filterScholarship || a.scholarship_id === filterScholarship
    const matchSt = !filterStatus || a.status === filterStatus
    return matchSearch && matchS && matchSt
  })

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Applications' }]} />
      <h1 className="page-title">Applications</h1>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name..." className="input-field pl-9" />
        </div>
        <select value={filterScholarship} onChange={e => setFilterScholarship(e.target.value)} className="input-field sm:w-48">
          <option value="">All Scholarships</option>
          {scholarships.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field sm:w-44">
          <option value="">All Statuses</option>
          {['Pending', 'Approved', 'Rejected', 'Resubmission Requested'].map(s =>
            <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {['Student Name', 'Scholarship', 'Date Submitted', 'Status', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No applications found.</td></tr>
            ) : filtered.map(a => (
              <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{a.student_name}</td>
                <td className="px-4 py-3 text-slate-600">{a.scholarship_title || '—'}</td>
                <td className="px-4 py-3 text-slate-500">
                  {a.created_at ? format(new Date(a.created_at), 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3">
                  <Link to={`/applications/${a.id}`} className="btn-primary text-xs px-3 py-1.5">View Application</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
