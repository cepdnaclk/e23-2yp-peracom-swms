// src/pages/AdminDashboard.jsx
// Shows summary cards, recent activity, and quick actions

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ShieldCheck, AlertCircle, GraduationCap } from 'lucide-react';
import api from '../utils/api';
import { SummaryCard } from '../components/common/SummaryCard';
import { LoadingSpinner } from '../components/common/UIComponents';
import { StatusBadge } from '../components/common/StatusBadge';

export default function AdminDashboard() {
  const [summary, setSummary]   = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, actRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/recent-activity'),
        ]);
        setSummary(sumRes.data);
        setActivity(actRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const quickActions = [
    { label: 'Review Applications', path: '/applications',  color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Manage Scholarships', path: '/scholarships',  color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Manage Issues',       path: '/issues',        color: 'bg-red-500 hover:bg-red-600' },
    { label: 'Create Announcement', path: '/announcements', color: 'bg-green-600 hover:bg-green-700' },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Welcome back, Admin! 👋</h1>
        <p className="text-slate-500 text-sm mt-1">Here is the latest system overview.</p>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard title="Pending Applications"         value={summary?.pendingApplications}         icon={FileText}     color="amber"  />
            <SummaryCard title="Pending Doc. Verifications"   value={summary?.pendingDocumentVerifications} icon={ShieldCheck}  color="blue"   />
            <SummaryCard title="Reported Issues"              value={summary?.reportedIssues}               icon={AlertCircle}  color="red"    />
            <SummaryCard title="Active Scholarships"          value={summary?.activeScholarships}           icon={GraduationCap} color="green" />
          </div>

          {/* Quick Actions */}
          <div className="card mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              {quickActions.map(({ label, path, color }) => (
                <button key={path} onClick={() => navigate(path)}
                  className={`${color} text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Recent Activity</h2>
            {activity.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No recent activity.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {activity.map(item => (
                  <div key={item.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full mr-2">
                        {item.type}
                      </span>
                      <span className="text-sm text-slate-700">{item.description}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-slate-400">
                        {new Date(item.time).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
