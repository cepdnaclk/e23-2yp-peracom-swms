import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Clock, AlertCircle, GraduationCap, ArrowRight } from 'lucide-react'
import { StatCard } from '../../components/common/StatCard'
import { StatusBadge } from '../../components/common/StatusBadge'
import api from '../../services/api'
import { format } from 'date-fns'

export default function AdminDashboard() {
  const [stats, setStats] = useState({})
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats').catch(() => ({ data: {} })),
      api.get('/admin/activity').catch(() => ({ data: [] })),
    ]).then(([statsRes, activityRes]) => {
      setStats(statsRes.data)
      setActivity(activityRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const quickActions = [
    { label: 'Review Applications', to: '/applications', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Manage Scholarships', to: '/scholarships', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Manage Issues', to: '/issues', color: 'bg-red-500 hover:bg-red-600' },
    { label: 'Create Announcement', to: '/announcements', color: 'bg-green-600 hover:bg-green-700' },
  ]

  const typeBadge = (type) => {
    const map = {
      Application: 'badge-blue',
      Issue: 'badge-red',
      'Scholarship Request': 'badge-purple',
    }
    return <span className={map[type] || 'badge-grey'}>{type}</span>
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-purple-700 to-purple-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, Admin! 👋</h1>
        <p className="text-purple-200 mt-1">Here is the latest system overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Applications" value={stats.pending_applications ?? 0} icon={FileText} color="amber" />
        <StatCard title="Pending Doc. Verifications" value={stats.pending_docs ?? 0} icon={Clock} color="blue" />
        <StatCard title="Reported Issues" value={stats.open_issues ?? 0} icon={AlertCircle} color="red" />
        <StatCard title="Active Scholarships" value={stats.active_scholarships ?? 0} icon={GraduationCap} color="green" />
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

      {/* Recent Activity */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-700">Recent Activity</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading activity...</div>
          ) : activity.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No recent activity.</div>
          ) : activity.map((item, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {typeBadge(item.type)}
                  <span className="text-sm text-slate-700 truncate">{item.description}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusBadge status={item.status} />
                <span className="text-xs text-slate-400 hidden sm:block">
                  {item.date ? format(new Date(item.date), 'MMM d, yyyy') : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
