import { useState, useEffect } from 'react'
import { Clock, UserCheck, UserX } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatCard } from '../../components/common/StatCard'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import api from '../../services/api'
import { format } from 'date-fns'

export default function UserApprovalPage() {
  const [users, setUsers] = useState([])
  const [tab, setTab] = useState('All')
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({})

  const load = () => {
    Promise.all([
      api.get('/admin/pending-users'),
      api.get('/admin/user-counts').catch(() => ({ data: {} })),
    ]).then(([u, c]) => {
      setUsers(u.data)
      setCounts(c.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleAction = async (id, action) => {
    await api.post(`/admin/users/${id}/${action}`)
    toast.success(`User ${action}d`)
    load()
  }

  const tabs = ['All', 'Pending', 'Approved', 'Rejected']
  const filtered = tab === 'All' ? users : users.filter(u => {
    const map = { Pending: 'pending_approval', Approved: 'approved', Rejected: 'rejected' }
    return u.status === map[tab]
  })

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'User Approval' }]} />
      <h1 className="page-title">User Approval</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Pending" value={counts.pending ?? 0} icon={Clock} color="amber" />
        <StatCard title="Approved" value={counts.approved ?? 0} icon={UserCheck} color="green" />
        <StatCard title="Rejected" value={counts.rejected ?? 0} icon={UserX} color="red" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300'}`}>
            {t} {counts[t.toLowerCase()] ? `(${counts[t.toLowerCase()]})` : ''}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {['Name', 'Email', 'Role', 'Status', 'Registered', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No users in this category.</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={u.role === 'donor' ? 'badge-purple' : 'badge-blue'}>
                    {u.role?.charAt(0).toUpperCase() + u.role?.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {u.status === 'pending_approval' && <>
                      <button onClick={() => handleAction(u.id, 'approve')}
                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">Approve</button>
                      <button onClick={() => handleAction(u.id, 'reject')}
                        className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">Reject</button>
                    </>}
                    {u.status === 'approved' && (
                      <button onClick={() => handleAction(u.id, 'suspend')}
                        className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors">Suspend</button>
                    )}
                    {(u.status === 'rejected' || u.status === 'suspended') && (
                      <button onClick={() => handleAction(u.id, 'approve')}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">Approve</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
