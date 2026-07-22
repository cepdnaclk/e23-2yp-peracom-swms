import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users, UserCheck, BookOpen, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../../components/common/StatusBadge'
import { StatCard } from '../../components/common/StatCard'
import { Breadcrumb } from '../../components/common/Breadcrumb'
import api from '../../services/api'

export default function DonorsPage() {
  const [donors, setDonors] = useState([])
  const [stats, setStats] = useState({})
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([
      api.get('/admin/donors'),
      api.get('/admin/donor-stats').catch(() => ({ data: {} })),
    ]).then(([d, s]) => {
      setDonors(d.data)
      setStats(s.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleAction = async (id, action) => {
    await api.post(`/admin/donors/${id}/${action}`)
    toast.success(`Donor ${action}d`)
    load()
  }

  const filtered = donors.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !search || d.name?.toLowerCase().includes(q) || d.organization?.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q)
    const matchStatus = !filterStatus || d.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Donors' }]} />
      <h1 className="page-title">Donor Management</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Donors" value={stats.total_donors ?? 0} icon={Users} color="purple" />
        <StatCard title="Active Donors" value={stats.active_donors ?? 0} icon={UserCheck} color="green" />
        <StatCard title="Funded Scholarships" value={stats.funded_scholarships ?? 0} icon={BookOpen} color="blue" />
        <StatCard title="Total Available Funds" value={stats.total_funds ? `LKR ${Number(stats.total_funds).toLocaleString()}` : 'LKR 0'} icon={DollarSign} color="amber" />
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, organization, email..." className="input-field pl-8" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field sm:w-48">
          <option value="">All Statuses</option>
          {['Active', 'Pending Approval', 'Suspended', 'Inactive'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {['Donor Name', 'Organization', 'Email', 'Phone', 'Available Fund', 'Scholarships', 'Status', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No donors found.</td></tr>
            ) : filtered.map(d => (
              <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{d.organization || '—'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{d.email}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{d.phone || '—'}</td>
                <td className="px-4 py-3 text-slate-700 text-xs">{d.available_fund ? `LKR ${Number(d.available_fund).toLocaleString()}` : '—'}</td>
                <td className="px-4 py-3 text-slate-600">{d.scholarship_count ?? 0}</td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link to={`/donors/${d.id}`} className="btn-primary text-xs px-3 py-1.5">View</Link>
                    {d.status === 'Pending Approval' && (
                      <button onClick={() => handleAction(d.id, 'approve')}
                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">Approve</button>
                    )}
                    {d.status === 'Active' && (
                      <button onClick={() => handleAction(d.id, 'suspend')}
                        className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">Suspend</button>
                    )}
                    {d.status === 'Suspended' && (
                      <button onClick={() => handleAction(d.id, 'activate')}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">Activate</button>
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
