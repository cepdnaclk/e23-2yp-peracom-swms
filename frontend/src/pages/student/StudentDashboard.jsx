import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, FileText, CheckCircle, BarChart2, ArrowRight,
  CreditCard, Bell, AlertCircle, Lock, Unlock
} from 'lucide-react'
import { StatCard } from '../../components/common/StatCard'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { format } from 'date-fns'

// ── Notification banner
function NotificationBanner({ notif, paymentAppId, onDismiss }) {
  const config = {
    payment_unlocked: {
      bg: 'bg-green-50 border-green-200',
      icon: Unlock,
      iconColor: 'text-green-600',
      titleColor: 'text-green-800',
      textColor: 'text-green-700',
    },
    payment_resubmission: {
      bg: 'bg-red-50 border-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-500',
      titleColor: 'text-red-800',
      textColor: 'text-red-700',
    },
    payment_verified: {
      bg: 'bg-purple-50 border-purple-200',
      icon: CheckCircle,
      iconColor: 'text-purple-600',
      titleColor: 'text-purple-800',
      textColor: 'text-purple-700',
    },
  }
  const c = config[notif.type] || config.payment_unlocked
  const Icon = c.icon

  // Build the correct link: payment page if we have an app ID, else applications list
  const paymentLink = paymentAppId
    ? `/student/payment/${paymentAppId}`
    : '/student/applications'

  return (
    <div className={`border rounded-xl p-4 flex items-start gap-3 ${c.bg}`}>
      <Icon size={18} className={`${c.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${c.titleColor}`}>{notif.title}</p>
        <p className={`text-xs mt-0.5 ${c.textColor}`}>{notif.message}</p>
        <Link to={paymentLink}
          className={`inline-flex items-center gap-1 text-xs font-semibold mt-2 hover:underline ${c.titleColor}`}>
          {notif.type === 'payment_unlocked'
            ? <><CreditCard size={12}/> Complete Payment Details</>
            : notif.type === 'payment_resubmission'
            ? <><AlertCircle size={12}/> Update Payment Details</>
            : <><CheckCircle size={12}/> View Application</>
          }
          <ArrowRight size={12}/>
        </Link>
      </div>
      <button onClick={() => onDismiss(notif.id)}
        className="text-slate-400 hover:text-slate-600 text-xs flex-shrink-0 mt-0.5">✕</button>
    </div>
  )
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [stats, setStats]           = useState({})
  const [recentApps, setRecentApps] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/student/stats').catch(() => ({ data: {} })),
      api.get('/student/applications?limit=5').catch(() => ({ data: [] })),
      user?.id
        ? api.get(`/payment/notifications/${user.id}`).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
    ]).then(([s, a, n]) => {
      setStats(s.data)
      setRecentApps(a.data?.slice(0, 5) || [])
      setNotifications((n.data || []).filter(notif => !notif.is_read))
    }).finally(() => setLoading(false))
  }, [user?.id])

  const dismissNotification = async (id) => {
    await api.post(`/payment/notifications/${id}/read`).catch(() => {})
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const firstName = user?.name?.split(' ')[0] || 'Student'

  // Find the most recent fully-approved application for payment link
  const fullyApprovedApp = recentApps.find(a =>
    ['Fully Approved','Payment Details Submitted','Resubmission Required'].includes(a.status)
  )
  const paymentLink = fullyApprovedApp
    ? `/student/payment/${fullyApprovedApp.id}`
    : '/student/applications'
  const hasPaymentPending = !!fullyApprovedApp

  const quickActions = [
    { label: 'Browse Scholarships', to: '/student/scholarships', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'My Applications',     to: '/student/applications', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Upload Documents',    to: '/student/applications', color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Submit Progress',     to: '/student/progress',     color: 'bg-amber-500 hover:bg-amber-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-purple-700 to-purple-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {firstName}! 👋</h1>
        <p className="text-purple-200 mt-1">Here's your scholarship overview.</p>
      </div>

      {/* Unread notifications */}
      {notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map(n => (
            <NotificationBanner key={n.id} notif={n}
              paymentAppId={fullyApprovedApp?.id}
              onDismiss={dismissNotification}/>
          ))}
        </div>
      )}

      {/* Payment action banner — shown when Fully Approved */}
      {hasPaymentPending && notifications.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <Unlock size={18} className="text-green-600 flex-shrink-0 mt-0.5"/>
          <div className="flex-1">
            <p className="font-semibold text-green-800 text-sm">
              Congratulations! Your application has been approved.
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              Please complete your Payment Details to receive scholarship funds.
            </p>
            <Link to={paymentLink}
              className="inline-flex items-center gap-1.5 text-xs font-semibold mt-2 text-green-800 hover:underline">
              <CreditCard size={12}/> Complete Payment Details <ArrowRight size={12}/>
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
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
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${app.status === 'Fully Approved' ? 'bg-green-50' :
                    app.status === 'Payment Details Submitted' ? 'bg-purple-50' : 'bg-purple-50'}`}>
                  {app.status === 'Fully Approved'
                    ? <Unlock size={15} className="text-green-600"/>
                    : app.status === 'Payment Details Submitted'
                    ? <CreditCard size={15} className="text-purple-600"/>
                    : <FileText size={15} className="text-purple-600"/>}
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