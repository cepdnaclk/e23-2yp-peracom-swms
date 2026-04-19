import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles = ['student'] }) {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontFamily: 'Sora, sans-serif', color: '#6b7280',
      flexDirection: 'column', gap: '0.75rem'
    }}>
      <div style={{ fontSize: '2.5rem' }}>🎓</div>
      <p style={{ fontSize: '0.9rem' }}>Loading ScholarBridge...</p>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  const role = profile?.role ?? user?.user_metadata?.role

  if (!role) return <Navigate to="/login" replace />

  if (!allowedRoles.includes(role)) {
    if (role === 'donor') return <Navigate to="/donor/dashboard" replace />
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
    return <Navigate to="/dashboard" replace />
  }

  return children
}
