import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, BarChart2, Eye } from 'lucide-react'
import { StatCard } from '../../components/common/StatCard'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { format } from 'date-fns'

export default function DonorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [scholarships, setScholarships] = useState([])
  const [progressUpdates, setProgressUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/donor/stats').catch(() => ({ data: {} })),
      api.get('/donor/scholarships').catch(() => ({ data: [] })),
      api.get('/donor/progress-updates').catch(() => ({ data: [] })),
    ]).then(([s, sc, p]) => {
      setStats(s.data)
      setScholarships(sc.data?.slice(0, 5) || [])
      setProgressUpdates(p.data?.slice(0, 5) || [])
    }).finally(() => setLoading(false))
  }, [])

  const firstName = user?.name?.split(' ')[0] || 'Doner'

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-700 to-purple-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome, {firstName}! 👋</h1>
        <p className="text-purple-200 mt-1">Here's an overview of your scholarship support.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Scholarships Supported" value={stats.scholarships_count ?? 0} icon={BookOpen} color="purple" />
        <StatCard title="Students Supported" value={stats.students_count ?? 0} icon={Users} color="blue" />
        <StatCard title="Recent Progress Updates" value={stats.progress_updates ?? 0} icon={BarChart2} color="green" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Scholarships */}
        <div className="card">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">Supported Scholarships</h2>
            <Link to="/donor/scholarships" className="text-xs text-purple-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-6 text-center text-slate-400 text-sm">Loading...</div>
            ) : scholarships.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">No scholarships yet.</div>
            ) : scholarships.map(s => (
              <div key={s.id} className="px-6 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{s.title}</p>
                  <p className="text-xs text-slate-400">{s.students_count ?? 0} students</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={s.status} />
                  <Link to="/donor/students" className="flex items-center gap-1 text-xs text-purple-600 hover:underline">
                    <Eye size={12} /> View Students
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Updates */}
        <div className="card">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700">Recent Progress Updates</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-6 text-center text-slate-400 text-sm">Loading...</div>
            ) : progressUpdates.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">No progress reports yet.</div>
            ) : progressUpdates.map(p => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{p.student_name}</p>
                  <p className="text-xs text-slate-400">{p.scholarship_title} · {p.semester}</p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {p.created_at ? format(new Date(p.created_at), 'MMM d') : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
