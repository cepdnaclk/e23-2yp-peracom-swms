import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'
import DashLayout from '../components/dashboard/DashLayout'
import styles from './StudentDashboard.module.css'

const STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Submitted',
  under_review: 'Under Review',
  admin_approved: 'Forwarded to Donor',
  awarded: 'Awarded',
  rejected: 'Rejected',
}

const STATUS_ACTIONS = {
  draft: 'Complete application',
  pending: 'Awaiting admin review',
  under_review: 'Undergoing admin screening',
  admin_approved: 'Awaiting donor selection',
  awarded: 'Accept your award!',
  rejected: 'Review feedback',
}

export default function StudentDashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [statusCounts, setStatusCounts] = useState({
    draft: 0,
    pending: 0,
    under_review: 0,
    admin_approved: 0,
    awarded: 0,
    rejected: 0,
  })
  const [openScholarshipsCount, setOpenScholarshipsCount] = useState(0)
  const [announcements, setAnnouncements] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [openScholarships, setOpenScholarships] = useState([])

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      const res = await fetch('/api/student/dashboard', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
      })
      const payload = await res.json()

      if (!res.ok) throw new Error(payload.error || 'Failed to fetch dashboard data')

      setApplications(payload.latest_applications || [])
      setStatusCounts({
        draft: payload.application_summary.draft,
        pending: payload.application_summary.pending,
        under_review: payload.application_summary.under_review,
        admin_approved: payload.application_summary.admin_approved,
        awarded: payload.application_summary.awarded,
        rejected: payload.application_summary.rejected,
      })
      setOpenScholarshipsCount(payload.open_scholarships_count || 0)
      setOpenScholarships(payload.open_scholarships || [])
      setAnnouncements(payload.announcements || [])
      setNotifications(payload.notifications || [])
    } catch (e) {
      console.error('Failed to load dashboard:', e)
    } finally {
      setLoading(false)
    }
  }

  function timeAgo(date) {
    const d = Math.floor((Date.now() - new Date(date)) / 86400000)
    if (d <= 1) return '1 day ago'
    return `${d} days ago`
  }

  function openApplications(filterKey) {
    navigate(`/applications?status=${encodeURIComponent(filterKey)}`)
  }

  const fullName = profile?.full_name ?? user?.user_metadata?.full_name ?? ''
  const firstName = fullName.split(' ')[0] || 'Student'

  return (
    <DashLayout>
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <h1 className={styles.welcome}>Welcome, {firstName}!</h1>
          {openScholarshipsCount > 0 && (
            <button className={styles.applyNow} onClick={() => navigate('/scholarships')}>
              Apply Now
            </button>
          )}
        </div>

        <div className={styles.summaryPanel}>
          <div className={styles.summaryHeader}>
            <div>
              <h2>Application Summary</h2>
              <p className={styles.summarySub}>Status breakdown and latest applications</p>
            </div>
            <button className={styles.viewAllApps} onClick={() => navigate('/applications')}>
              View all
            </button>
          </div>

          <div className={styles.breakdownGrid}>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={styles.breakdownCard}
                onClick={() => openApplications(key)}
                title={`View ${label.toLowerCase()} applications`}
              >
                <div className={styles.breakdownNum}>{loading ? '—' : statusCounts[key]}</div>
                <div className={styles.breakdownLabel}>{label}</div>
              </button>
            ))}
          </div>

          <div className={styles.appList}>
            {loading ? (
              <p className={styles.empty}>Loading...</p>
            ) : applications.length === 0 ? (
              <p className={styles.empty}>No applications yet.</p>
            ) : (
              applications.slice(0, 4).map(app => {
                const statusKey = app.status ?? 'draft'
                const statusLabel = STATUS_LABELS[statusKey] ?? 'Submitted'
                const actionLabel = STATUS_ACTIONS[statusKey] ?? 'Check details'
                const submitted = app.created_at ? new Date(app.created_at).toLocaleDateString('en-GB') : '—'
                const updated = app.updated_at ? new Date(app.updated_at).toLocaleDateString('en-GB') : submitted

                return (
                  <div key={app.id} className={styles.appItem}>
                    <div className={styles.appMain}>
                      <div>
                        <div className={styles.appTitle}>{app.scholarships?.title ?? 'Scholarship'}</div>
                        <div className={styles.appMeta}>Submitted: {submitted} · Updated: {updated}</div>
                      </div>
                      <div className={styles.appStatusWrap}>
                        <span className={styles.statusBadge}>{statusLabel}</span>
                        <span className={styles.actionBadge}>{actionLabel}</span>
                      </div>
                    </div>
                    <button className={styles.appDetailBtn} onClick={() => navigate(`/applications?applicationId=${app.id}`)}>
                      View Details
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className={styles.bottomGrid}>
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Available Scholarships</h2>
            <div className={styles.annList}>
              {loading ? <p className={styles.empty}>Loading...</p> :
                openScholarships.length === 0 ? <p className={styles.empty}>No open scholarships at the moment.</p> :
                  openScholarships.map(s => (
                    <div 
                      key={s.id} 
                      className={styles.annItem} 
                      style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer' }}
                      onClick={() => navigate(`/scholarships/${s.id}`)}
                    >
                      <div className={styles.annName}>{s.title}</div>
                      <div className={styles.annDate}>Deadline: {s.deadline ? new Date(s.deadline).toLocaleDateString('en-GB') : 'No deadline'}</div>
                      <button 
                        className={styles.applyNow} 
                        style={{ width: 'fit-content', padding: '0.4rem 1rem', fontSize: '0.85rem' }} 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/apply/${s.id}`);
                        }}
                      >
                        Apply Now
                      </button>
                    </div>
                  ))
              }
              <button className={styles.viewAll} onClick={() => navigate('/scholarships')}>
                Browse all scholarships <span>›</span>
              </button>
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Latest Announcements</h2>
            <div className={styles.annList}>
              {loading ? <p className={styles.empty}>Loading...</p> :
                announcements.length === 0 ? <p className={styles.empty}>No announcements yet.</p> :
                  announcements.map(a => (
                    <div key={a.id} className={styles.annItem}>
                      <div className={styles.annName}>{a.title}</div>
                      <div className={styles.annDate}>{new Date(a.created_at).toLocaleDateString('en-GB')}</div>
                      <div className={styles.annBody}>{a.content}</div>
                    </div>
                  ))
              }
              <button className={styles.viewAll} onClick={() => navigate('/announcements')}>
                View all <span>›</span>
              </button>
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Notifications</h2>
            <div className={styles.notifList}>
              {loading ? <p className={styles.empty}>Loading...</p> :
                notifications.length === 0 ? <p className={styles.empty}>No notifications yet.</p> :
                  notifications.map(n => (
                    <div key={n.id} className={styles.notifItem} style={{ fontWeight: n.is_read ? 'normal' : 'bold' }}>
                      <span className={styles.notifIcon}>{n.is_read ? '🔕' : '🔔'}</span>
                      <div className={styles.notifContent}>
                        <p className={styles.notifMsg}>{n.message}</p>
                        <span className={styles.notifTime}>{timeAgo(n.created_at)}</span>
                      </div>
                      {!n.is_read && <span style={{ color: 'red', fontSize: '20px', marginLeft: 'auto' }}>•</span>}
                    </div>
                  ))
              }
              <button className={styles.viewAllLink} onClick={() => navigate('/notifications')}>
                View all notifications
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashLayout>
  )
}
