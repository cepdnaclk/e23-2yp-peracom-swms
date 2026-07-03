import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import StudentRegisterPage from './pages/auth/StudentRegisterPage'
import DonorRegisterPage from './pages/auth/DonorRegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Public
import HomePage from './pages/HomePage'

// Admin Pages
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import ScholarshipsPage from './pages/admin/ScholarshipsPage'
import ScholarshipRequestReview from './pages/admin/ScholarshipRequestReview'
import ApplicationsPage from './pages/admin/ApplicationsPage'
import ApplicationDetailPage from './pages/admin/ApplicationDetailPage'
import AssignStudentsPage from './pages/admin/AssignStudentsPage'
import StudentsPage from './pages/admin/StudentsPage'
import StudentDetailPage from './pages/admin/StudentDetailPage'
import DonorsPage from './pages/admin/DonorsPage'
import DonorDetailPage from './pages/admin/DonorDetailPage'
import AnnouncementsPage from './pages/admin/AnnouncementsPage'
import IssuesPage from './pages/admin/IssuesPage'
import UserApprovalPage from './pages/admin/UserApprovalPage'

// Student Pages
import StudentLayout from './components/student/StudentLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentScholarships from './pages/student/StudentScholarships'
import ScholarshipDetail from './pages/student/ScholarshipDetail'
import MyApplications from './pages/student/MyApplications'
import StudentProfile from './pages/student/StudentProfile'
import ProgressReports from './pages/student/ProgressReports'

// Donor Pages
import DonorLayout from './components/donor/DonorLayout'
import DonorDashboard from './pages/donor/DonorDashboard'
import DonorScholarships from './pages/donor/DonorScholarships'
import DonorStudents from './pages/donor/DonorStudents'
import DonorApplicationReview from './pages/donor/DonorApplicationReview'
import DonorAnnouncements from './pages/donor/DonorAnnouncements'
import DonorProfile from './pages/donor/DonorProfile'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <LoginPage />} />
      <Route path="/register/student" element={<StudentRegisterPage />} />
      <Route path="/register/donor" element={<DonorRegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Admin */}
      <Route path="/dashboard" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
      </Route>
      <Route path="/scholarships" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<ScholarshipsPage />} />
        <Route path="requests/:id" element={<ScholarshipRequestReview />} />
        <Route path=":id/assign" element={<AssignStudentsPage />} />
      </Route>
      <Route path="/applications" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<ApplicationsPage />} />
        <Route path=":id" element={<ApplicationDetailPage />} />
      </Route>
      <Route path="/students" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<StudentsPage />} />
        <Route path=":id" element={<StudentDetailPage />} />
      </Route>
      <Route path="/donors" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<DonorsPage />} />
        <Route path=":id" element={<DonorDetailPage />} />
      </Route>
      <Route path="/announcements" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AnnouncementsPage />} />
      </Route>
      <Route path="/issues" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<IssuesPage />} />
      </Route>
      <Route path="/user-approval" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<UserApprovalPage />} />
      </Route>

      {/* Student */}
      <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="scholarships" element={<StudentScholarships />} />
        <Route path="scholarships/:id" element={<ScholarshipDetail />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="progress" element={<ProgressReports />} />
      </Route>

      {/* Donor */}
      <Route path="/donor" element={<ProtectedRoute role="donor"><DonorLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DonorDashboard />} />
        <Route path="scholarships" element={<DonorScholarships />} />
        <Route path="students" element={<DonorStudents />} />
        <Route path="students/:id/review" element={<DonorApplicationReview />} />
        <Route path="announcements" element={<DonorAnnouncements />} />
        <Route path="profile" element={<DonorProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ className: 'text-sm font-medium' }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}