import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboard from './pages/StudentDashboard'
import ScholarshipsPage from './pages/ScholarshipsPage'
import ScholarshipDetail from './pages/ScholarshipDetail'
import ApplyPage from './pages/ApplyPage'
import ApplicationsPage from './pages/ApplicationsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/dashboard"        element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/scholarships"     element={<ProtectedRoute allowedRoles={['student']}><ScholarshipsPage /></ProtectedRoute>} />
          <Route path="/scholarships/:id" element={<ProtectedRoute allowedRoles={['student']}><ScholarshipDetail /></ProtectedRoute>} />
          <Route path="/apply/:id"        element={<ProtectedRoute allowedRoles={['student']}><ApplyPage /></ProtectedRoute>} />
          <Route path="/applications"     element={<ProtectedRoute allowedRoles={['student']}><ApplicationsPage /></ProtectedRoute>} />


          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}