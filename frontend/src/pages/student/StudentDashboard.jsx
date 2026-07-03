import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, FileText, CheckCircle, BarChart2, ArrowRight } from 'lucide-react'
import { StatCard } from '../../components/common/StatCard'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { format } from 'date-fns'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [recentApps, setRecentApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/student/stats').catch(() => ({ data: {} })),
      api.get('/student/applications?limit=5').catch(() => ({ data: [] })),
    ]).then(([s, a]) => {
      setStats(s.data)
      setRecentApps(a.data?.slice(0, 5) || [])
    }).finally(() => setLoading(false))
  }, [])

  const firstName = user?.name?.split(' ')[0] || 'Student'

  const quickActions = [
    { label: 'Browse Scholarships', to: '/student/scholarships', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'My Applications', to: '/student/applications', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Upload Documents', to: '/student/applications', color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Submit Progress', to: '/student/progress', color: 'bg-amber-500 hover:bg-amber-600' },
  ]

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-700 to-purple-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {firstName}! 👋</h1>
        <p className="text-purple-200 mt-1">Here's your scholarship overview.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/student/scholarships">
          <StatCard title="Available Scholarships" value={stats.available_scholarships ?? 0} icon={BookOpen} color="purple" />
        </Link>
        <Link to="/student/applications">
          <StatCard title="Active Applications" value={stats.active_applications ?? 0} icon={FileText} color="blue" />
        </Link>
        <Link to="/student/applications">
          <StatCard title="Approved Scholarships" value={stats.approved_scholarships ?? 0} icon={CheckCircle} color="green" />
        </Link>
        <Link to="/student/progress">
          <StatCard title="Progress Reports" value={stats.progress_reports ?? 0} icon={BarChart2} color="amber" />
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(({ label, to, color }) => (
            <Link key={to} to={to}
              className={`${color} text-white text-sm font-medium px-4 py-3 rounded-xl text-center transition-colors flex items-center justify-center gap-2`}>
              {label} <ArrowRight size={14} />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Recent Applications</h2>
          <Link to="/student/applications" className="text-xs text-purple-600 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
          ) : recentApps.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-slate-400 text-sm">No applications yet. Browse scholarships to apply!</p>
              <Link to="/student/scholarships" className="btn-primary text-sm inline-block">Browse Scholarships</Link>
            </div>
          ) : recentApps.map(app => (
            <div key={app.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <FileText size={15} className="text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{app.scholarship_title}</p>
                  <p className="text-xs text-slate-400">{app.created_at ? format(new Date(app.created_at), 'MMM d, yyyy') : '—'}</p>
                </div>
              </div>
              <StatusBadge status={app.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
