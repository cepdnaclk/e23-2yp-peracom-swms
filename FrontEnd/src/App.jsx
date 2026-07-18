// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ViewAnnouncementsPage from './pages/ViewAnnouncementsPage'; // IMPORTED THE NEW PAGE
import IssueManagementPage from './pages/IssueManagementPage';
import IssueReportingPage from './pages/IssueReportingPage';
import './App.css'; 

// ==========================================
// 1. ADMIN LAYOUT & SIDEBAR
// ==========================================
const AdminLayout = ({ children }) => {
  const location = useLocation();
  return (
    <div className="app-container">
      <aside className="sidebar admin-sidebar">
        <div className="sidebar-header">
          <h2>PeraCom Admin</h2>
          <span className="role-badge">Admin Role</span>
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin" className={location.pathname === '/admin' ? 'active-link' : ''}>Dashboard</Link>
          <div className="nav-divider">System Control</div>
          <Link to="/admin/announcements" className={location.pathname === '/admin/announcements' ? 'active-link' : ''}>Manage Announcements</Link>
          <Link to="/admin/issues" className={location.pathname === '/admin/issues' ? 'active-link' : ''}>Issue Management</Link>
        </nav>
        <Link to="/" className="logout-btn">Log Out</Link>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
};

// ==========================================
// 2. STUDENT LAYOUT & SIDEBAR
// ==========================================
const StudentLayout = ({ children }) => {
  const location = useLocation();
  return (
    <div className="app-container">
      <aside className="sidebar student-sidebar">
        <div className="sidebar-header">
          <h2>PeraCom Student</h2>
          <span className="role-badge">Student Role</span>
        </div>
        <nav className="sidebar-nav">
          <Link to="/student" className={location.pathname === '/student' ? 'active-link' : ''}>My Profile</Link>
          <div className="nav-divider">Updates & Support</div>
          
          {/* NEW LINK ADDED HERE */}
          <Link to="/student/announcements" className={location.pathname === '/student/announcements' ? 'active-link' : ''}>View Announcements</Link>
          <Link to="/student/report-issue" className={location.pathname === '/student/report-issue' ? 'active-link' : ''}>Report an Issue</Link>
        </nav>
        <Link to="/" className="logout-btn">Log Out</Link>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
};

// ==========================================
// 3. DONOR LAYOUT & SIDEBAR
// ==========================================
const DonorLayout = ({ children }) => {
  const location = useLocation();
  return (
    <div className="app-container">
      <aside className="sidebar donor-sidebar">
        <div className="sidebar-header">
          <h2>PeraCom Donor</h2>
          <span className="role-badge">Donor Role</span>
        </div>
        <nav className="sidebar-nav">
          <Link to="/donor" className={location.pathname === '/donor' ? 'active-link' : ''}>My Dashboard</Link>
          <div className="nav-divider">Updates & Support</div>
          
          {/* NEW LINK ADDED HERE */}
          <Link to="/donor/announcements" className={location.pathname === '/donor/announcements' ? 'active-link' : ''}>View Announcements</Link>
          <Link to="/donor/report-issue" className={location.pathname === '/donor/report-issue' ? 'active-link' : ''}>Report an Issue</Link>
        </nav>
        <Link to="/" className="logout-btn">Log Out</Link>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
};

// ==========================================
// 4. LANDING PAGE (Role Selector)
// ==========================================
const RoleSelector = () => {
  const navigate = useNavigate();
  return (
    <div className="role-selector-page">
      <h1>Welcome to PeraCom System</h1>
      <p>Select a role to test the different dashboards and routing:</p>
      <div className="role-cards">
        <button onClick={() => navigate('/admin/announcements')} className="role-btn admin-btn">Login as Admin</button>
        <button onClick={() => navigate('/student/announcements')} className="role-btn student-btn">Login as Student</button>
        <button onClick={() => navigate('/donor/announcements')} className="role-btn donor-btn">Login as Donor</button>
      </div>
    </div>
  );
};

// ==========================================
// 5. MAIN APP ROUTER
// ==========================================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelector />} />

        {/* Admin Routes */}
        <Route path="/admin/announcements" element={<AdminLayout><AnnouncementsPage /></AdminLayout>} />
        <Route path="/admin/issues" element={<AdminLayout><IssueManagementPage /></AdminLayout>} />
        <Route path="/admin/*" element={<AdminLayout><h2>Admin Dashboard Placeholder</h2></AdminLayout>} />

        {/* Student Routes */}
        <Route path="/student/announcements" element={<StudentLayout><ViewAnnouncementsPage /></StudentLayout>} />
        <Route path="/student/report-issue" element={<StudentLayout><IssueReportingPage /></StudentLayout>} />
        <Route path="/student/*" element={<StudentLayout><h2>Student Dashboard Placeholder</h2></StudentLayout>} />

        {/* Donor Routes */}
        <Route path="/donor/announcements" element={<DonorLayout><ViewAnnouncementsPage /></DonorLayout>} />
        <Route path="/donor/report-issue" element={<DonorLayout><IssueReportingPage /></DonorLayout>} />
        <Route path="/donor/*" element={<DonorLayout><h2>Donor Dashboard Placeholder</h2></DonorLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;