import { useEffect, useState } from 'react';
import Navbar from '../../components/donor/Navbar';
import Sidebar from '../../components/donor/Sidebar';
import Footer from '../../components/donor/Footer';
import SummaryCard from '../../components/donor/SummaryCard';
import ProgressUpdateCard from '../../components/donor/ProgressUpdateCard';
import LoadingSpinner from '../../components/donor/LoadingSpinner';
import EmptyState from '../../components/donor/EmptyState';
import donorApi from '../../services/donorApi';

function Dashboard() {
  const [data, setData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardRes, announcementsRes] = await Promise.all([
          donorApi.get('/donor/dashboard'),
          donorApi.get('/announcements').catch(() => ({ data: [] })),
        ]);
        setData(dashboardRes.data);
        setAnnouncements(Array.isArray(announcementsRes.data) ? announcementsRes.data : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;

  return (
    <div className="app-shell">
      <Navbar notifications={data?.notifications || []} announcements={announcements} />
      <div className="content-shell">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <div>
              <h1>Donor Dashboard</h1>
              <p className="muted">Monitor your scholarships, students, updates, and notifications.</p>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {data && (
            <>
              <section className="summary-grid">
                <SummaryCard title="Scholarships Supported" value={data.counts?.supported_scholarships ?? 0} />
                <SummaryCard title="Students Supported" value={data.counts?.supported_students ?? 0} />
                <SummaryCard title="Recent Progress Updates" value={(data.latest_progress_updates || []).length} />
                <SummaryCard title="Notifications" value={(data.notifications || []).length} />
              </section>

              <section className="section-grid">
                <div className="card">
                  <h2>Donor Information</h2>
                  <p><strong>Organization:</strong> {data.donor?.organization_name || 'N/A'}</p>
                  <p><strong>Phone:</strong> {data.donor?.phone || 'N/A'}</p>
                  <p><strong>Address:</strong> {data.donor?.address || 'N/A'}</p>
                </div>

                <div className="card">
                  <h2>Notifications</h2>
                  {data.notifications?.length ? data.notifications.map((item) => (
                    <div key={item.id} className="list-item compact">
                      <strong>{item.title}</strong>
                      <p>{item.message}</p>
                    </div>
                  )) : <EmptyState title="No notifications yet" description="New notifications will appear here." />}
                </div>
              </section>

              <section>
                <h2>Recent Progress Updates</h2>
                {data.latest_progress_updates?.length ? (
                  <div className="stack-gap">
                    {data.latest_progress_updates.map((update) => (
                      <ProgressUpdateCard
                        key={update.id}
                        update={update}
                        isExpanded={expandedId === update.id}
                        onToggle={() => setExpandedId((prev) => prev === update.id ? null : update.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No progress updates yet" description="Progress updates will appear once supported students submit progress data." />
                )}
              </section>
            </>
          )}
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
