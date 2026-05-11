import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashLayout from '../components/dashboard/DashLayout'
import { supabase } from '../services/supabaseClient'
import styles from './AnnouncementsPage.module.css'

export default function AnnouncementsPage() {
  const navigate = useNavigate()
  const { id: selectedId } = useParams()
  const itemRefs = useRef({})
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [titleFilter, setTitleFilter] = useState('')
  const [keywordFilter, setKeywordFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  useEffect(() => {
    if (!selectedId || loading || announcements.length === 0) return

    const target = itemRefs.current[selectedId]
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    void markAnnouncementRead(selectedId)
  }, [selectedId, loading, announcements])

  async function fetchAnnouncements() {
    setError('')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/student/announcements?all=true', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to fetch announcements.')

      setAnnouncements(payload.announcements || [])
    } catch (err) {
      setAnnouncements([])
      setError(err.message || 'Failed to fetch announcements.')
    } finally {
      setLoading(false)
    }
  }

  async function markAnnouncementRead(announcementId) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      await fetch(`/api/student/announcements/${announcementId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch {
      // Non-blocking tracking call.
    }
  }

  const selectedAnnouncement = announcements.find((item) => String(item.id) === String(selectedId))
  const filteredAnnouncements = announcements.filter((item) => {
    const titleText = String(item.title || '').toLowerCase()
    const bodyText = String(item.content || '').toLowerCase()
    const keywordText = `${titleText} ${bodyText}`
    const titleMatches = !titleFilter.trim() || titleText.includes(titleFilter.trim().toLowerCase())
    const keywordMatches = !keywordFilter.trim() || keywordText.includes(keywordFilter.trim().toLowerCase())
    const dateMatches = !dateFilter || new Date(item.created_at).toISOString().slice(0, 10) === dateFilter

    return titleMatches && keywordMatches && dateMatches
  })

  return (
    <DashLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1>Announcements</h1>
            <p>All available updates from administrators.</p>
          </div>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <section className={styles.card}>
          <div className={styles.filters}>
            <label className={styles.filterField}>
              <span>Search title</span>
              <input
                type="text"
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                placeholder="Type a title"
              />
            </label>
            <label className={styles.filterField}>
              <span>Keywords</span>
              <input
                type="text"
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
                placeholder="Search title or body"
              />
            </label>
            <label className={styles.filterField}>
              <span>Date</span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </label>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => {
                setTitleFilter('')
                setKeywordFilter('')
                setDateFilter('')
              }}
            >
              Clear filters
            </button>
          </div>

          {selectedAnnouncement && (
            <div className={styles.featured}>
              <div className={styles.featuredHeader}>
                <div>
                  <p className={styles.featuredKicker}>Selected announcement</p>
                  <h2>{selectedAnnouncement.title}</h2>
                </div>
                <button className={styles.backBtn} onClick={() => navigate('/announcements')}>
                  Clear focus
                </button>
              </div>
              <div className={styles.badgeRow}>
                {selectedAnnouncement.is_pinned && <span className={styles.badgePrimary}>Pinned</span>}
                {selectedAnnouncement.priority && selectedAnnouncement.priority !== 'normal' && (
                  <span className={selectedAnnouncement.priority === 'urgent' ? styles.badgeUrgent : styles.badgeWarning}>
                    {selectedAnnouncement.priority}
                  </span>
                )}
                <span className={selectedAnnouncement.is_read ? styles.badgeRead : styles.badgeUnread}>
                  {selectedAnnouncement.is_read ? 'Read' : 'Unread'}
                </span>
              </div>
              <div className={styles.featuredDate}>{new Date(selectedAnnouncement.created_at).toLocaleDateString('en-GB')}</div>
              <p className={styles.featuredBody}>{selectedAnnouncement.content}</p>
              <div className={styles.featuredMeta}>
                <div>
                  <span>Published on</span>
                  <strong>{new Date(selectedAnnouncement.created_at).toLocaleString('en-GB')}</strong>
                </div>
                <div>
                  <span>Content length</span>
                  <strong>{selectedAnnouncement.content?.length || 0} characters</strong>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <p className={styles.empty}>Loading announcements...</p>
          ) : filteredAnnouncements.length === 0 ? (
            <p className={styles.empty}>No announcements yet.</p>
          ) : (
            <div className={styles.list}>
              {filteredAnnouncements.map((item) => (
                <article
                  key={item.id}
                  ref={(node) => { if (node) itemRefs.current[item.id] = node }}
                  className={`${styles.item} ${String(selectedId) === String(item.id) ? styles.itemSelected : ''}`}
                  tabIndex={0}
                  role="button"
                  onClick={() => navigate(`/announcements/${item.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/announcements/${item.id}`)
                    }
                  }}
                >
                  <div className={styles.itemTop}>
                    <div>
                      <h3>{item.title}</h3>
                      <div className={styles.badgeRow} style={{ marginTop: '0.35rem' }}>
                        {item.is_pinned && <span className={styles.badgePrimary}>Pinned</span>}
                        {item.priority && item.priority !== 'normal' && (
                          <span className={item.priority === 'urgent' ? styles.badgeUrgent : styles.badgeWarning}>{item.priority}</span>
                        )}
                        <span className={item.is_read ? styles.badgeRead : styles.badgeUnread}>
                          {item.is_read ? 'Read' : 'Unread'}
                        </span>
                      </div>
                    </div>
                    <span>{new Date(item.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                  <p>{item.content}</p>
                  <div className={styles.itemFooter}>
                    <span>{item.content?.slice(0, 120)}{item.content?.length > 120 ? '...' : ''}</span>
                    <strong>Click to expand</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashLayout>
  )
}
