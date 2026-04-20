// src/pages/DonorManagement.jsx
// Shows summary cards, donor list with search/filter, status actions

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, UserCheck, BookOpen, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { SummaryCard } from '../components/common/SummaryCard';
import { PageHeader, LoadingSpinner, EmptyState } from '../components/common/UIComponents';
import { StatusBadge } from '../components/common/StatusBadge';

const STATUSES = ['', 'Active', 'Pending Approval', 'Suspended', 'Inactive'];

export default function DonorManagement() {
  const [donors, setDonors]     = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)       params.name   = search;
      if (statusFilter) params.status = statusFilter;
      const [dRes, sRes] = await Promise.all([
        api.get('/donors', { params }),
        api.get('/donors/summary'),
      ]);
      setDonors(dRes.data);
      setSummary(sRes.data);
    } catch { toast.error('Failed to load donors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const updateStatus = async (donorId, status) => {
    try {
      await api.put(`/donors/${donorId}/status`, { status });
      toast.success(`Donor ${status.toLowerCase()}`);
      load();
    } catch { toast.error('Status update failed'); }
  };

  const statusActions = (donor) => {
    switch (donor.status) {
      case 'Pending Approval': return [{ label: 'Approve',  newStatus: 'Active',     cls: 'text-green-600 hover:bg-green-50' }];
      case 'Active':           return [{ label: 'Suspend',  newStatus: 'Suspended',  cls: 'text-red-500 hover:bg-red-50'   }];
      case 'Suspended':        return [{ label: 'Activate', newStatus: 'Active',     cls: 'text-blue-600 hover:bg-blue-50' }];
      default:                 return [];
    }
  };

  return (
    <div>
      <PageHeader title="Donor Management" breadcrumb="Dashboard > Donors" />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard title="Total Donors"        value={summary.totalDonors}       icon={Users}     color="purple" />
          <SummaryCard title="Active Donors"       value={summary.activeDonors}      icon={UserCheck} color="green"  />
          <SummaryCard title="Funded Scholarships" value={summary.fundedScholarships} icon={BookOpen}  color="blue"   />
          <SummaryCard title="Total Available Funds"
            value={`LKR ${(summary.totalAvailableFunds || 0).toLocaleString()}`}
            icon={Banknote} color="amber" />
        </div>
      )}

      {/* Search & Filter */}
      <div className="card mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-8" placeholder="Search by name, org, or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      {/* Donor Table */}
      <div className="card">
        {loading ? <LoadingSpinner /> : donors.length === 0 ? <EmptyState message="No donors found." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  {['Donor Name', 'Organization', 'Email', 'Phone', 'Available Fund', 'Scholarships', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donors.map(d => (
                  <tr key={d.id} className="table-row">
                    <td className="px-3 py-3 font-medium text-slate-800">{d.name}</td>
                    <td className="px-3 py-3 text-slate-500">{d.organization || '—'}</td>
                    <td className="px-3 py-3 text-slate-500">{d.email}</td>
                    <td className="px-3 py-3 text-slate-500">{d.phone || '—'}</td>
                    <td className="px-3 py-3 text-slate-700">LKR {d.available_fund?.toLocaleString() || '0'}</td>
                    <td className="px-3 py-3 text-center">{d.supported_scholarships ?? '—'}</td>
                    <td className="px-3 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/donors/${d.id}`)}
                          className="text-xs btn-secondary">View</button>
                        {statusActions(d).map(({ label, newStatus, cls }) => (
                          <button key={label} onClick={() => updateStatus(d.id, newStatus)}
                            className={`text-xs px-2 py-1 rounded-lg transition-colors ${cls}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
