// src/pages/ApplicationReview.jsx
// Lists all student applications with search and filter

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../utils/api';
import { PageHeader, LoadingSpinner, EmptyState } from '../components/common/UIComponents';
import { StatusBadge } from '../components/common/StatusBadge';

const STATUSES = ['', 'Pending', 'Approved', 'Rejected', 'Resubmission Requested'];

export default function ApplicationReview() {
  const [applications, setApplications] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scholarshipFilter, setScholarshipFilter] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)           params.student_name   = search;
      if (statusFilter)     params.status         = statusFilter;
      if (scholarshipFilter) params.scholarship_id = scholarshipFilter;

      const [appRes, schRes] = await Promise.all([
        api.get('/applications', { params }),
        api.get('/scholarships'),
      ]);
      setApplications(appRes.data);
      setScholarships(schRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, statusFilter, scholarshipFilter]);

  return (
    <div>
      <PageHeader title="Application Review" breadcrumb="Dashboard > Applications" />

      {/* Search & Filters */}
      <div className="card mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field pl-8"
            placeholder="Search by student name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="select-field" value={scholarshipFilter} onChange={e => setScholarshipFilter(e.target.value)}>
          <option value="">All Scholarships</option>
          {scholarships.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <select className="select-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <LoadingSpinner /> : applications.length === 0 ? <EmptyState message="No applications found." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  {['Student Name', 'Scholarship', 'Date Submitted', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id} className="table-row">
                    <td className="px-3 py-3 font-medium text-slate-800">{app.student_name}</td>
                    <td className="px-3 py-3 text-slate-600">{app.scholarship_title}</td>
                    <td className="px-3 py-3 text-slate-500">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-3"><StatusBadge status={app.status} /></td>
                    <td className="px-3 py-3">
                      <button onClick={() => navigate(`/applications/${app.id}`)} className="btn-secondary text-xs">
                        View Application
                      </button>
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
