// src/App.jsx
// Root component — sets up all page routes

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import AdminLayout from './components/common/AdminLayout';

import AdminDashboard          from './pages/AdminDashboard';
import ScholarshipManagement   from './pages/ScholarshipManagement';
import ScholarshipRequestReview from './pages/ScholarshipRequestReview';
import ApplicationReview       from './pages/ApplicationReview';
import ApplicationDetails      from './pages/ApplicationDetails';
import AssignStudentsToDonor   from './pages/AssignStudentsToDonor';
import DonorManagement         from './pages/DonorManagement';
import DonorDetails            from './pages/DonorDetails';
import AnnouncementManagement  from './pages/AnnouncementManagement';
import IssueManagement         from './pages/IssueManagement';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"                      element={<AdminDashboard />} />
          <Route path="scholarships"                   element={<ScholarshipManagement />} />
          <Route path="scholarships/requests/:id"      element={<ScholarshipRequestReview />} />
          <Route path="applications"                   element={<ApplicationReview />} />
          <Route path="applications/:id"               element={<ApplicationDetails />} />
          <Route path="scholarships/:id/assign"        element={<AssignStudentsToDonor />} />
          <Route path="donors"                         element={<DonorManagement />} />
          <Route path="donors/:id"                     element={<DonorDetails />} />
          <Route path="announcements"                  element={<AnnouncementManagement />} />
          <Route path="issues"                         element={<IssueManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
