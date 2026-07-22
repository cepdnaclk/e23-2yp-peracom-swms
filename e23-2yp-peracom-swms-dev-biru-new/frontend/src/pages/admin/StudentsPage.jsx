import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users, Award, DollarSign, TrendingUp, FileText } from 'lucide-react'
import { StatusBadge } from '../../components/common/StatusBadge'
import { StatCard } from '../../components/common/StatCard'
import api from '../../services/api'

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [stats, setStats] = useState({})
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedBatch) params.set('batch', selectedBatch)
    if (search) params.set('search', search)
    if (filterStatus) params.set('status', filterStatus)

    Promise.all([
      api.get(`/admin/students?${params}`),
      api.get('/admin/batches').catch(() => ({ data: [] })),
      api.get(`/admin/student-stats?batch=${selectedBatch}`).catch(() => ({ data: {} })),
    ]).then(([st, b, s]) => {
      setStudents(st.data)
      setBatches(b.data)
      setStats(s.data)
    }).finally(() => setLoading(false))
  }, [selectedBatch, search, filterStatus])

  useEffect(() => { load() }, [load])

  const statusBreakdown = stats.status_breakdown || {}
  const total = Object.values(statusBreakdown).reduce((a, b) => a + b, 0)

  const segColors = { Approved: 'bg-green-400', Pending: 'bg-amber-400', Rejected: 'bg-red-400', 'Resubmission Requested': 'bg-orange-400' }

  return (
    <div className="space-y-8">
      <h1 className="page-title">Students</h1>

      {/* Batch Overview */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Batch Overview</h2>
          <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} className="input-field w-40">
            <option value="">All Batches</option>
            {batches.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard title="Total Students" value={stats.total_students ?? 0} icon={Users} color="blue" />
          <StatCard title="Awarded Students" value={stats.awarded_students ?? 0} icon={Award} color="green" />
          <StatCard title="Total Funds" value={stats.total_funds ? `LKR ${Number(stats.total_funds).toLocaleString()}` : 'LKR 0'} icon={DollarSign} color="purple" />
          <StatCard title="Success Rate" value={stats.success_rate ? `${stats.success_rate}%` : '0%'} icon={TrendingUp} color="amber" />
          <StatCard title="Total Applications" value={stats.total_applications ?? 0} icon={FileText} color="grey" />
        </div>

        {total > 0 && (
          <div>
            <div className="flex h-3 rounded-full overflow-hidden">
              {Object.entries(statusBreakdown).map(([st, cnt]) => (
                <div key={st} style={{ width: `${(cnt / total) * 100}%` }} className={`${segColors[st] || 'bg-slate-300'}`} />
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              {Object.entries(statusBreakdown).map(([st, cnt]) => (
                <span key={st} className="text-xs text-slate-500 flex items-center gap-1">
                  <span className={`w-2.5 h-2.5 rounded-sm ${segColors[st] || 'bg-slate-300'}`} />
                  {st}: {cnt}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Student List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-semibold text-slate-700">
            Student List {selectedBatch && `— Batch ${selectedBatch}`}
            <span className="badge-purple ml-2">{students.length}</span>
          </h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..." className="input-field pl-8 text-xs h-9 w-48" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field text-xs h-9 w-40">
              <option value="">All Statuses</option>
              {['Pending', 'Approved', 'Rejected', 'Resubmission Requested'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Student Name', 'Reg. Number', 'Batch', 'Email', 'Department', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No students found.</td></tr>
              ) : students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.registration_number}</td>
                  <td className="px-4 py-3"><span className="badge-purple">{s.batch}</span></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.email}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.department}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.application_status || 'No Application'} /></td>
                  <td className="px-4 py-3">
                    <Link to={`/students/${s.id}`} className="btn-primary text-xs px-3 py-1.5">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
