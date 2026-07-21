import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import donorApi from '../../services/donorApi';
import Navbar from '../../components/donor/Navbar';
import Sidebar from '../../components/donor/Sidebar';
import Footer from '../../components/donor/Footer';
import ScholarshipCard from '../../components/donor/ScholarshipCard';
import FormInput from '../../components/donor/FormInput';
import FormSelect from '../../components/donor/FormSelect';
import LoadingSpinner from '../../components/donor/LoadingSpinner';
import EmptyState from '../../components/donor/EmptyState';

function Scholarships() {
  const navigate = useNavigate();
  const [scholarships, setScholarships] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [scholarshipRes, requestRes, notificationRes, announcementRes] = await Promise.all([
          donorApi.get('/donor/scholarships').catch(() => ({ data: [] })),
          donorApi.get('/donor/scholarship-requests'),
          donorApi.get('/donor/notifications').catch(() => ({ data: [] })),
          donorApi.get('/announcements').catch(() => ({ data: [] })),
        ]);

        const scholarshipData = Array.isArray(scholarshipRes.data) ? scholarshipRes.data : [];
        const requestData = Array.isArray(requestRes.data) ? requestRes.data : [];
        setScholarships(scholarshipData);
        setRequests(requestData);
        setNotifications(Array.isArray(notificationRes.data) ? notificationRes.data : []);
        setAnnouncements(Array.isArray(announcementRes.data) ? announcementRes.data : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const supportedScholarships = scholarships.length ? scholarships : requests;

  const filteredScholarships = useMemo(() => {
    return supportedScholarships.filter((item) => {
      const title = (item.title || item.name || '').toLowerCase();
      const matchesSearch = title.includes(search.toLowerCase());
      const matchesStatus = status === 'all' || (item.status || '').toLowerCase() === status;
      return matchesSearch && matchesStatus;
    });
  }, [supportedScholarships, search, status]);

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const matchesSearch = title.includes(search.toLowerCase());
      const matchesStatus = status === 'all' || (item.status || '').toLowerCase() === status;
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, status]);

  if (loading) return <LoadingSpinner label="Loading scholarships..." />;

  return (
    <div className="app-shell">
      <Navbar notifications={notifications} announcements={announcements} />
      <div className="content-shell">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <div>
              <h1>Scholarships</h1>
              <p className="muted">View supported scholarships and manage your scholarship requests.</p>
            </div>
            <Link className="btn btn-primary" to="/request-scholarship">Request New Scholarship</Link>
          </div>

          <div className="toolbar card toolbar-grid">
            <FormInput label="Search by scholarship name" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search scholarships..." />
            <FormSelect
              label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'draft', label: 'Draft' },
              ]}
            />
          </div>

          <section>
            <h2>Supported Scholarships</h2>
            {filteredScholarships.length ? (
              <div className="card-grid">
                {filteredScholarships.map((item) => (
                  <ScholarshipCard
                    key={item.id}
                    scholarship={item}
                    onViewStudents={() => navigate('/approved-students')}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No scholarships found" description="Try changing your search or filters." />
            )}
          </section>

          <section>
            <h2>My Scholarship Requests</h2>
            {filteredRequests.length ? (
              <div className="table-wrap card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Funding Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((item) => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.funding_amount ?? 'N/A'}</td>
                        <td>
                          <span className={`status-badge status-${(item.status || 'pending').toLowerCase()}`}>
                            {item.status || 'Pending'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-link" onClick={() => navigate(`/request-scholarship`, { state: { existingRequest: item } })}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No scholarship requests yet" description="Use the button above to request a new scholarship." />
            )}
          </section>
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default Scholarships;
