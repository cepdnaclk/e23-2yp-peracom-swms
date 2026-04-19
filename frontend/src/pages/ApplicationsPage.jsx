import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/dashboard/Layout'
import { supabase } from '../services/supabaseClient'
import styles from './ApplicationsPage.module.css'

const STATUS_STEPS = ['pending', 'under_review', 'admin_approved', 'awarded']

const STATUS_CONFIG = {
  pending:      { label: 'Submitted',    color: '#d97706', bg: '#fef3c7', icon: '📤' },
  under_review: { label: 'Admin Review', color: '#1a56db', bg: '#e8f0fe', icon: '🔍' },
  admin_approved: { label: 'Donor Review', color: '#0d9488', bg: '#e0f2fe', icon: '⏳' },
  awarded:      { label: 'Awarded',      color: '#059669', bg: '#d1fae5', icon: '🎉' },
  rejected:     { label: 'Rejected',     color: '#dc2626', bg: '#fee2e2', icon: '❌' },
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const statusFilter = searchParams.get('status') || ''
  const targetApplicationId = searchParams.get('applicationId') || ''

  useEffect(() => { fetchApplications() }, [])

  useEffect(() => {
    if (targetApplicationId) {
      setSelected(targetApplicationId)
    }
  }, [targetApplicationId, applications])

  async function fetchApplications() {
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      // Use absolute fallback URL automatically if standard proxy route fails
      const base = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const apiUrl = import.meta.env.DEV ? `${base}/api/applications` : '/api/applications'

      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const payload = await res.json().catch(() => ({}))
      
      if (!res.ok) {
        throw new Error(payload.error || payload.message || `Request failed (${res.status})`)
      }

      setApplications(payload.applications ?? [])
    } catch (err) {
      setError(err?.message || 'Failed to load applications. Please try again.')
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  function getProgressIndex(status) {
    const idx = STATUS_STEPS.indexOf(status)
    return idx === -1 ? 0 : idx
  }

  const visibleApplications = statusFilter
    ? applications.filter(app => app.status === statusFilter)
    : applications

  const activeFilterLabel = statusFilter
    ? STATUS_CONFIG[statusFilter]?.label || statusFilter.replace(/_/g, ' ')
    : ''

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>My Applications</h1>
          <p>{applications.length} application{applications.length !== 1 ? 's' : ''} total</p>
        </div>

        {statusFilter && (
          <div className={styles.feedback} style={{ marginBottom: '1rem' }}>
            <strong>Showing only:</strong> {activeFilterLabel}
            <button
              type="button"
              onClick={() => navigate('/applications')}
              style={{ marginLeft: '1rem', border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
            >
              Clear filter
            </button>
          </div>
        )}

        {error && <div className={styles.errorBox}>{error}</div>}

        {loading ? (
          <p className={styles.empty}>Loading...</p>
        ) : visibleApplications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3>{statusFilter ? 'No applications in this status yet' : 'No applications yet'}</h3>
            <p>{statusFilter ? 'Try another status or clear the filter to view all applications.' : 'Browse available scholarships and submit your first application.'}</p>
          </div>
        ) : (
          <div className={styles.list}>
            {visibleApplications.map(app => {
              const config = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending
              const isRejected = app.status === 'rejected'
              const progressIdx = getProgressIndex(app.status)
              const isSelected = String(selected) === String(app.id)

              return (
                <div key={app.id} className={styles.card} id={`application-${app.id}`} style={isSelected ? { outline: '2px solid #2563eb', outlineOffset: '2px' } : undefined}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h3>{app.scholarships?.title ?? 'Scholarship'}</h3>
                      <p className={styles.donor}>by {app.scholarships?.donor_name ?? 'Anonymous'}</p>
                    </div>
                    <span className={styles.statusBadge}
                      style={{ color: config.color, background: config.bg }}>
                      {config.icon} {config.label}
                    </span>
                  </div>

                  {!isRejected ? (
                    <div className={styles.timeline}>
                      {STATUS_STEPS.map((s, i) => {
                        const done = i <= progressIdx
                        const active = i === progressIdx
                        return (
                          <div key={s} className={styles.timelineStep}>
                            <div className={`${styles.dot} ${done ? styles.dotDone : ''} ${active ? styles.dotActive : ''}`}>
                              {done && i < progressIdx ? '✓' : i + 1}
                            </div>
                            <span className={`${styles.timelineLabel} ${active ? styles.timelineLabelActive : ''}`}>
                              {STATUS_CONFIG[s]?.label}
                            </span>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`${styles.line} ${i < progressIdx ? styles.lineDone : ''}`} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className={styles.rejectedBar}>❌ Application was not approved</div>
                  )}

                  {app.admin_feedback && (
                    <div className={styles.feedback}>
                      <strong>💬 Admin Feedback:</strong>
                      <p>{app.admin_feedback}</p>
                    </div>
                  )}
                  
                  {app.donor_feedback && (
                    <div className={styles.feedback} style={{ marginTop: '0.5rem', background: '#f5f3ff', borderLeftColor: '#8b5cf6' }}>
                      <strong>💬 Donor Feedback:</strong>
                      <p>{app.donor_feedback}</p>
                    </div>
                  )}

                  <div className={styles.cardFooter}>
                    <span className={styles.date}>
                      Applied: {app.created_at
                        ? new Date(app.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'N/A'}
                    </span>
                    <button className={styles.detailBtn}
                      onClick={() => setSelected(String(selected) === String(app.id) ? null : app.id)}>
                      {String(selected) === String(app.id) ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>

                  {String(selected) === String(app.id) && app.personal_info && (
                    <div className={styles.details}>
                      <div className={styles.detailSection}>
                        <h4>Personal Information</h4>
                        {Object.entries(app.personal_info).map(([k, v]) => v && (
                          <div key={k} className={styles.detailRow}>
                            <span>{k.replace(/_/g, ' ')}</span>
                            <strong>{v}</strong>
                          </div>
                        ))}
                      </div>
                      {app.academic_info && (
                        <div className={styles.detailSection}>
                          <h4>Academic Details</h4>
                          {Object.entries(app.academic_info).map(([k, v]) => v && (
                            <div key={k} className={styles.detailRow}>
                              <span>{k.replace(/_/g, ' ')}</span>
                              <strong>{v}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}