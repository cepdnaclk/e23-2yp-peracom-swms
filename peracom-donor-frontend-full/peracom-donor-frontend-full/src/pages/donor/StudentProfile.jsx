import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import donorApi from '../../services/donorApi';
import Navbar from '../../components/donor/Navbar';
import Sidebar from '../../components/donor/Sidebar';
import Footer from '../../components/donor/Footer';
import LoadingSpinner from '../../components/donor/LoadingSpinner';
import EmptyState from '../../components/donor/EmptyState';

function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [studentRes, notificationRes, announcementRes] = await Promise.all([
          donorApi.get(`/donor/students/${id}`),
          donorApi.get('/donor/notifications').catch(() => ({ data: [] })),
          donorApi.get('/announcements').catch(() => ({ data: [] })),
        ]);
        setStudent(studentRes.data);
        setNotifications(Array.isArray(notificationRes.data) ? notificationRes.data : []);
        setAnnouncements(Array.isArray(announcementRes.data) ? announcementRes.data : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load student profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <LoadingSpinner label="Loading student profile..." />;

  return (
    <div className="app-shell">
      <Navbar notifications={notifications} announcements={announcements} />
      <div className="content-shell">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <div>
              <h1>Student Profile</h1>
              <p className="muted">View verified student details, scholarship details, and verified documents.</p>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {!student ? (
            <EmptyState title="Student not found" description="This profile is unavailable or you do not have access." />
          ) : (
            <div className="stack-gap">
              <div className="card">
                <h2>Student Information</h2>
                <p><strong>Name:</strong> {student.student_name || student.full_name || 'N/A'}</p>
                <p><strong>Registration No:</strong> {student.registration_no || 'N/A'}</p>
                <p><strong>Batch:</strong> {student.batch || 'N/A'}</p>
                <p><strong>Email:</strong> {student.email || 'Hidden / Not available'}</p>
                <p><strong>Phone:</strong> {student.phone ? 'Hidden for privacy' : 'Hidden for privacy'}</p>
              </div>

              <div className="card">
                <h2>Scholarship Details</h2>
                <p><strong>Scholarship:</strong> {student.scholarship_title || student.scholarship_name || 'N/A'}</p>
                <p><strong>Status:</strong> {student.status || 'Approved'}</p>
                <p><strong>Start Date:</strong> {student.start_date || 'N/A'}</p>
                <p><strong>Donor Support Info:</strong> {student.donor_support_info || 'Supported through donor module'}</p>
              </div>

              <div className="card">
                <h2>Verified Documents</h2>
                {student.verified_documents?.length ? (
                  student.verified_documents.map((doc, index) => (
                    <div key={doc.id || index} className="list-item">
                      <div>
                        <strong>{doc.name || doc.document_name || 'Document'}</strong>
                        <p>Status: {doc.status || 'Verified'}</p>
                      </div>
                      {doc.url && (
                        <div className="inline-actions">
                          <a className="btn btn-secondary" href={doc.url} target="_blank" rel="noreferrer">View</a>
                          <a className="btn btn-secondary" href={doc.url} download>Download</a>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <EmptyState title="No verified documents available" description="Verified documents will appear here once supported by the backend." />
                )}
              </div>
            </div>
          )}
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default StudentProfile;
