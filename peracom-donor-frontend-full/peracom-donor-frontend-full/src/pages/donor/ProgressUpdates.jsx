import { useEffect, useMemo, useState } from 'react';
import donorApi from '../../services/donorApi';
import Navbar from '../../components/donor/Navbar';
import Sidebar from '../../components/donor/Sidebar';
import Footer from '../../components/donor/Footer';
import FormInput from '../../components/donor/FormInput';
import FormSelect from '../../components/donor/FormSelect';
import LoadingSpinner from '../../components/donor/LoadingSpinner';
import EmptyState from '../../components/donor/EmptyState';
import ProgressUpdateCard from '../../components/donor/ProgressUpdateCard';

function ProgressUpdates() {
  const [updates, setUpdates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentFilter, setStudentFilter] = useState('all');
  const [scholarshipFilter, setScholarshipFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [updatesRes, notificationRes, announcementRes] = await Promise.all([
          donorApi.get('/donor/progress-updates'),
          donorApi.get('/donor/notifications').catch(() => ({ data: [] })),
          donorApi.get('/announcements').catch(() => ({ data: [] })),
        ]);
        setUpdates(Array.isArray(updatesRes.data) ? updatesRes.data : []);
        setNotifications(Array.isArray(notificationRes.data) ? notificationRes.data : []);
        setAnnouncements(Array.isArray(announcementRes.data) ? announcementRes.data : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const studentOptions = useMemo(() => {
    const names = [...new Set(updates.map((u) => u.student_name).filter(Boolean))];
    return [{ value: 'all', label: 'All Students' }, ...names.map((name) => ({ value: name, label: name }))];
  }, [updates]);

  const scholarshipOptions = useMemo(() => {
    const names = [...new Set(updates.map((u) => u.scholarship_title || u.scholarship_name).filter(Boolean))];
    return [{ value: 'all', label: 'All Scholarships' }, ...names.map((name) => ({ value: name, label: name }))];
  }, [updates]);

  const filtered = useMemo(() => updates.filter((item) => {
    const matchesStudent = studentFilter === 'all' || item.student_name === studentFilter;
    const scholarship = item.scholarship_title || item.scholarship_name || '';
    const matchesScholarship = scholarshipFilter === 'all' || scholarship === scholarshipFilter;
    const matchesDate = !dateFilter || (item.update_date || item.date || '').startsWith(dateFilter);
    return matchesStudent && matchesScholarship && matchesDate;
  }), [updates, studentFilter, scholarshipFilter, dateFilter]);

  if (loading) return <LoadingSpinner label="Loading progress updates..." />;

  return (
    <div className="app-shell">
      <Navbar notifications={notifications} announcements={announcements} />
      <div className="content-shell">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <div>
              <h1>Progress Updates</h1>
              <p className="muted">Track student progress with filters and full academic update details.</p>
            </div>
          </div>

          <div className="toolbar card toolbar-grid toolbar-grid-3">
            <FormSelect label="Filter by student" value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)} options={studentOptions} />
            <FormSelect label="Filter by scholarship" value={scholarshipFilter} onChange={(e) => setScholarshipFilter(e.target.value)} options={scholarshipOptions} />
            <FormInput label="Filter by date" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          </div>

          {filtered.length ? (
            <div className="stack-gap">
              {filtered.map((item) => (
                <ProgressUpdateCard
                  key={item.id}
                  update={item}
                  isExpanded={expandedId === item.id}
                  onToggle={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No progress reports found" description="Try changing your filters or wait for new progress updates." />
          )}
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default ProgressUpdates;
