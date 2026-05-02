import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/donor/Login';
import Register from './pages/donor/Register';
import Dashboard from './pages/donor/Dashboard';
import Scholarships from './pages/donor/Scholarships';
import ApprovedStudents from './pages/donor/ApprovedStudents';
import StudentProfile from './pages/donor/StudentProfile';
import ProgressUpdates from './pages/donor/ProgressUpdates';
import ReportIssue from './pages/donor/ReportIssue';
import RequestScholarship from './pages/donor/RequestScholarship';
import ProtectedRoute from './routes/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/scholarships" element={<ProtectedRoute><Scholarships /></ProtectedRoute>} />
        <Route path="/approved-students" element={<ProtectedRoute><ApprovedStudents /></ProtectedRoute>} />
        <Route path="/students/:id" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
        <Route path="/progress-updates" element={<ProtectedRoute><ProgressUpdates /></ProtectedRoute>} />
        <Route path="/report-issue" element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
        <Route path="/request-scholarship" element={<ProtectedRoute><RequestScholarship /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
