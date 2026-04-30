import { useEffect, useMemo, useState } from 'react';
import donorApi from '../../services/donorApi';
import Navbar from '../../components/donor/Navbar';
import Sidebar from '../../components/donor/Sidebar';
import Footer from '../../components/donor/Footer';
import FormInput from '../../components/donor/FormInput';
import FormSelect from '../../components/donor/FormSelect';
import LoadingSpinner from '../../components/donor/LoadingSpinner';
import EmptyState from '../../components/donor/EmptyState';
import StudentTable from '../../components/donor/StudentTable';

function ApprovedStudents() {
  const [students, setStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('all');
  const [scholarshipFilter, setScholarshipFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const [studentRes, notificationRes, announcementRes] = await Promise.all([
          donorApi.get('/donor/approved-students'),
          donorApi.get('/donor/notifications').catch(() => ({ data: [] })),
          donorApi.get('/announcements').catch(() => ({ data: [] })),
        ]);
        setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
        setNotifications(Array.isArray(notificationRes.data) ? notificationRes.data : []);
        setAnnouncements(Array.isArray(announcementRes.data) ? announcementRes.data : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const scholarshipOptions = useMemo(() => {
    const names = [...new Set(students.map((s) => s.scholarship_title || s.scholarship_name).filter(Boolean))];
    return [{ value: 'all', label: 'All Scholarships' }, ...names.map((n) => ({ value: n, label: n }))];
  }, [students]);

  const batchOptions = useMemo(() => {
    const batches = [...new Set(students.map((s) => s.batch).filter(Boolean))];
    return [{ value: 'all', label: 'All Batches' }, ...batches.map((b) => ({ value: b, label: b }))];
  }, [students]);

  const filtered = useMemo(() => students.filter((student) => {
    const name = (student.student_name || student.full_name || '').toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || (student.registration_no || '').toLowerCase().includes(search.toLowerCase());
    const matchesBatch = batchFilter === 'all' || student.batch === batchFilter;
    const scholarship = student.scholarship_title || student.scholarship_name || '';
    const matchesScholarship = scholarshipFilter === 'all' || scholarship === scholarshipFilter;
    return matchesSearch && matchesBatch && matchesScholarship;
  }), [students, search, batchFilter, scholarshipFilter]);

  if (loading) return <LoadingSpinner label="Loading approved students..." />;

  return (
    <div className="app-shell">
      <Navbar notifications={notifications} announcements={announcements} />
      <div className="content-shell">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <div>
              <h1>Approved Students</h1>
              <p className="muted">View students funded by you and open their donor profile view.</p>
            </div>
          </div>

          <div className="toolbar card toolbar-grid toolbar-grid-3">
            <FormInput label="Search by student name or registration" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." />
            <FormSelect label="Filter by scholarship" value={scholarshipFilter} onChange={(e) => setScholarshipFilter(e.target.value)} options={scholarshipOptions} />
            <FormSelect label="Filter by batch" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} options={batchOptions} />
          </div>

          {filtered.length ? (
            <StudentTable students={filtered} />
          ) : (
            <EmptyState title="No approved students found" description="Try changing the filters or wait until students are assigned to you." />
          )}
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default ApprovedStudents;
