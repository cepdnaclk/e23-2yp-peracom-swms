import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'
import styles from './AdminDashboard.module.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { signOut, profile, user } = useAuth()
  const [pendingUsers, setPendingUsers] = useState([])
  const [pendingScholarships, setPendingScholarships] = useState([])
  
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingScholarships, setLoadingScholarships] = useState(true)
  
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [busyScholarshipId, setBusyScholarshipId] = useState('')
  const [expandedScholarshipId, setExpandedScholarshipId] = useState(null)

  // FR3 - Admin Applications & Announcements State
  const [activeTab, setActiveTab] = useState('users') // 'users', 'scholarships', 'applications', 'announcements'
  const [pendingApplications, setPendingApplications] = useState([])
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [busyApplicationId, setBusyApplicationId] = useState('')
  const [expandedApplicationId, setExpandedApplicationId] = useState(null)
  
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementContent, setAnnouncementContent] = useState('')
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    fetchPendingUsers()
    fetchPendingScholarships()
    fetchPendingApplications()
  }, [])

  async function fetchPendingUsers() {
    setError('')
    setLoadingUsers(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/users/pending', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to load pending users.')
      
      setPendingUsers(payload.users || [])
    } catch (err) {
      setError(err.message || 'Failed to load pending users.')
    } finally {
      setLoadingUsers(false)
    }
  }

  async function fetchPendingScholarships() {
    setError('')
    setLoadingScholarships(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/scholarships/pending', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to load pending scholarships.')
      
      setPendingScholarships(payload.scholarships || [])
    } catch (err) {
      setError(err.message || 'Failed to load pending scholarships.')
    } finally {
      setLoadingScholarships(false)
    }
  }

  // Fetch pending applications for review
  async function fetchPendingApplications() {
    setError('')
    setLoadingApplications(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/applications/pending', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to load pending applications.')
      
      setPendingApplications(payload.applications || [])
    } catch (err) {
      setError(err.message || 'Failed to load pending applications.')
    } finally {
      setLoadingApplications(false)
    }
  }

  async function updateApplicationStatus(appId, status, admin_feedback = '') {
    setBusyApplicationId(appId)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/admin/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status, admin_feedback })
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to update application status.')
      
      // Remove from list if fully processed, otherwise update status
      if (status === 'approved' || status === 'admin_approved' || status === 'rejected') {
        setPendingApplications(prev => prev.filter(a => a.id !== appId))
      } else {
        setPendingApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
      }
    } catch (err) {
      setError(err.message || 'Failed to update application.')
    } finally {
      setBusyApplicationId('')
    }
  }

  async function handlePublishAnnouncement(e) {
    e.preventDefault()
    setError('')
    setPublishing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ title: announcementTitle, content: announcementContent })
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to publish announcement.')
      
      setAnnouncementTitle('')
      setAnnouncementContent('')
      alert('Announcement published successfully!')
    } catch (err) {
      setError(err.message || 'Failed to publish announcement.')
    } finally {
      setPublishing(false)
    }
  }

  async function updateStatus(userId, status) {
    setBusyId(userId)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status })
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to update user status.')
      
      setPendingUsers(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      setError(err.message || 'Failed to update user status.')
    } finally {
      setBusyId('')
    }
  }

  async function updateScholarshipStatus(scholarshipId, status) {
    setBusyScholarshipId(scholarshipId)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/admin/scholarships/${scholarshipId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status })
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to update scholarship status.')
      
      setPendingScholarships(prev => prev.filter(s => s.id !== scholarshipId))
    } catch (err) {
      setError(err.message || 'Failed to update scholarship status.')
    } finally {
      setBusyScholarshipId('')
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function getVisibleVerificationFields(item) {
    const extra = item?.extra_info && typeof item.extra_info === 'object' ? item.extra_info : {}
    const role = (item?.role || '').toLowerCase()

    if (role === 'student') {
      return [
        { label: 'Registration No', value: extra.registration_no },
        { label: 'Batch', value: extra.batch },
        { label: 'Phone', value: extra.phone }
      ]
    }

    if (role === 'donor') {
      return [
        { label: 'Organization', value: extra.org_name },
        { label: 'Address', value: extra.address },
        { label: 'Phone', value: extra.phone }
      ]
    }

    if (role === 'admin') {
      return [
        { label: 'Staff ID', value: extra.staff_id },
        { label: 'Department', value: extra.department }
      ]
    }

    return []
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Admin Panel</p>
          <h1>User Verification Queue</h1>
          <p className={styles.sub}>Review all newly registered users and approve only genuine accounts.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.adminEmail}>{profile?.email || user?.email}</span>
          <button className={styles.secondaryBtn} onClick={() => { fetchPendingUsers(); fetchPendingScholarships(); fetchPendingApplications(); }}>Refresh</button>
          <button className={styles.secondaryBtn} onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      {/* Tabs navigation */}
      <div className={styles.tabsContainer} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #eee', paddingBottom: '1rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('users')}
          style={{ fontWeight: activeTab === 'users' ? 'bold' : 'normal', padding: '0.5rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: activeTab === 'users' ? '2px solid #0056b3' : 'none' }}>
          User Approvals ({pendingUsers.length})
        </button>
        <button 
          onClick={() => setActiveTab('scholarships')}
          style={{ fontWeight: activeTab === 'scholarships' ? 'bold' : 'normal', padding: '0.5rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: activeTab === 'scholarships' ? '2px solid #0056b3' : 'none' }}>
          Scholarship Reviews ({pendingScholarships.length})
        </button>
        <button 
          onClick={() => setActiveTab('applications')}
          style={{ fontWeight: activeTab === 'applications' ? 'bold' : 'normal', padding: '0.5rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: activeTab === 'applications' ? '2px solid #0056b3' : 'none' }}>
          Pending Applications ({pendingApplications.length})
        </button>
        <button 
          onClick={() => setActiveTab('announcements')}
          style={{ fontWeight: activeTab === 'announcements' ? 'bold' : 'normal', padding: '0.5rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: activeTab === 'announcements' ? '2px solid #0056b3' : 'none' }}>
          Broadcast Announcements
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {activeTab === 'users' && (
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Pending User Approvals</h2>
          <span className={styles.count}>{pendingUsers.length}</span>
        </div>

        {loadingUsers ? (
          <p className={styles.empty}>Loading pending users...</p>
        ) : pendingUsers.length === 0 ? (
          <p className={styles.empty}>No pending users right now.</p>
        ) : (
          <div className={styles.list}>
            {pendingUsers.map(item => (
              <article key={item.id} className={styles.userCard}>
                <div className={styles.userTop}>
                  <div>
                    <h3>{item.full_name || 'Unnamed user'}</h3>
                    <p>{item.email}</p>
                  </div>
                  <span className={styles.role}>{item.role}</span>
                </div>

                <div className={styles.meta}>
                  <span>Registered: {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</span>
                  <span>Status: {item.status}</span>
                </div>

                {getVisibleVerificationFields(item).some(field => field.value) && (
                  <div className={styles.verifyBox}>
                    <p className={styles.verifyTitle}>Verification Details</p>
                    <div className={styles.verifyGrid}>
                      {getVisibleVerificationFields(item)
                        .filter(field => field.value)
                        .map(field => (
                          <div key={`${item.id}-${field.label}`} className={styles.verifyItem}>
                            <span className={styles.verifyLabel}>{field.label}</span>
                            <span className={styles.verifyValue}>{field.value}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className={styles.actions}>
                  <button
                    className={styles.approveBtn}
                    disabled={busyId === item.id}
                    onClick={() => updateStatus(item.id, 'approved')}
                  >
                    {busyId === item.id ? 'Saving...' : 'Approve'}
                  </button>
                  <button
                    className={styles.rejectBtn}
                    disabled={busyId === item.id}
                    onClick={() => updateStatus(item.id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      )}

      {activeTab === 'scholarships' && (
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Pending Scholarship Reviews</h2>
          <span className={styles.count}>{pendingScholarships.length}</span>
        </div>

        {loadingScholarships ? (
          <p className={styles.empty}>Loading pending scholarships...</p>
        ) : pendingScholarships.length === 0 ? (
          <p className={styles.empty}>No pending scholarships right now.</p>
        ) : (
          <div className={styles.list}>
            {pendingScholarships.map(item => (
              <article key={item.id} className={styles.userCard}>
                <div className={styles.userTop}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>By: {item.donor_name || 'Anonymous Donor'}</p>
                  </div>
                  <span className={styles.role}>{item.amount ? `₱${Number(item.amount).toLocaleString()}` : 'Amount TBD'}</span>
                </div>

                <div className={styles.meta}>
                  <span>Submitted: {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</span>
                  <span>Type: {item.funding_type === 'full' ? 'Full Funding' : 'Partial Funding'}</span>
                  <span>Deadline: {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'N/A'}</span>
                </div>

                {expandedScholarshipId === item.id && (
                  <div className={styles.verifyBox}>
                    <p className={styles.verifyTitle}>Full Scholarship Details</p>
                    <div className={styles.verifyGrid}>
                      <div className={styles.verifyItem} style={{ gridColumn: '1 / -1' }}>
                        <span className={styles.verifyLabel}>Description</span>
                        <span className={styles.verifyValue}>{item.description || 'No description provided.'}</span>
                      </div>
                      <div className={styles.verifyItem} style={{ gridColumn: '1 / -1' }}>
                        <span className={styles.verifyLabel}>Requirements</span>
                        <span className={styles.verifyValue}>{item.requirements || 'No specific requirements.'}</span>
                      </div>
                      <div className={styles.verifyItem}>
                        <span className={styles.verifyLabel}>Available Slots</span>
                        <span className={styles.verifyValue}>{item.slots || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className={styles.actions}>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => setExpandedScholarshipId(expandedScholarshipId === item.id ? null : item.id)}
                  >
                    {expandedScholarshipId === item.id ? 'Hide Details' : 'View Full Details'}
                  </button>
                  <div style={{ flex: 1 }}></div>
                  <button
                    className={styles.approveBtn}
                    disabled={busyScholarshipId === item.id}
                    onClick={() => updateScholarshipStatus(item.id, 'published')}
                  >
                    {busyScholarshipId === item.id ? '...Saving' : 'Approve & Publish'}
                  </button>
                  <button
                    className={styles.rejectBtn}
                    disabled={busyScholarshipId === item.id}
                    onClick={() => updateScholarshipStatus(item.id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      )}

      {activeTab === 'applications' && (
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Pending Student Applications</h2>
          <span className={styles.count}>{pendingApplications.length}</span>
        </div>

        {loadingApplications ? (
          <p className={styles.empty}>Loading pending applications...</p>
        ) : pendingApplications.length === 0 ? (
          <p className={styles.empty}>No student applications needing review right now.</p>
        ) : (
          <div className={styles.list}>
            {pendingApplications.map(item => {
              const pInfo = item.personal_info || {}
              const aInfo = item.academic_info || {}
              const docs = item.document_urls || {}

              return (
                <article key={item.id} className={styles.userCard}>
                  <div className={styles.userTop}>
                    <div>
                      <h3>{pInfo.fullName || item.profiles?.full_name || 'Unnamed Student'}</h3>
                      <p>Applying for: <strong>{item.scholarships?.title}</strong></p>
                    </div>
                    <span className={styles.role}>{item.status.replace('_', ' ')}</span>
                  </div>

                  <div className={styles.meta}>
                    <span>Submitted: {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</span>
                    <span>Email: {item.profiles?.email}</span>
                  </div>

                  {expandedApplicationId === item.id && (
                    <div className={styles.verifyBox}>
                      <p className={styles.verifyTitle}>Application Details</p>
                      <div className={styles.verifyGrid}>
                        {/* Personal Info */}
                        <div className={styles.verifyItem}><span className={styles.verifyLabel}>DOB</span><span className={styles.verifyValue}>{pInfo.dob}</span></div>
                        <div className={styles.verifyItem}><span className={styles.verifyLabel}>Gender</span><span className={styles.verifyValue}>{pInfo.gender}</span></div>
                        <div className={styles.verifyItem} style={{ gridColumn: '1 / -1' }}><span className={styles.verifyLabel}>Address</span><span className={styles.verifyValue}>{pInfo.address}</span></div>
                        
                        {/* Academic Info */}
                        <div className={styles.verifyItem}><span className={styles.verifyLabel}>University</span><span className={styles.verifyValue}>{aInfo.university}</span></div>
                        <div className={styles.verifyItem}><span className={styles.verifyLabel}>GPA/CGPA</span><span className={styles.verifyValue}>{aInfo.gpa}</span></div>
                        
                        {/* Docs */}
                        <div className={styles.verifyItem} style={{ gridColumn: '1 / -1' }}>
                          <span className={styles.verifyLabel}>Uploaded Documents</span>
                          <ul style={{ margin: 0, paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                            {docs.grades_url && <li><a href={docs.grades_url} target="_blank" rel="noreferrer" style={{ color: '#0056b3' }}>O-Level/A-Level Grades</a></li>}
                            {docs.id_card_url && <li><a href={docs.id_card_url} target="_blank" rel="noreferrer" style={{ color: '#0056b3' }}>ID Card</a></li>}
                            {docs.essay_url && <li><a href={docs.essay_url} target="_blank" rel="noreferrer" style={{ color: '#0056b3' }}>Essay</a></li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={styles.actions}>
                    <button
                      className={styles.secondaryBtn}
                      onClick={() => setExpandedApplicationId(expandedApplicationId === item.id ? null : item.id)}
                    >
                      {expandedApplicationId === item.id ? 'Hide Portfolio' : 'Review Portfolio'}
                    </button>
                    <div style={{ flex: 1 }}></div>

                    {item.status === 'pending' && (
                      <button
                        className={styles.secondaryBtn}
                        style={{ backgroundColor: '#ffc107', color: 'white', border: 'none' }}
                        disabled={busyApplicationId === item.id}
                        onClick={() => updateApplicationStatus(item.id, 'under_review')}
                      >
                        {busyApplicationId === item.id ? '...' : 'Mark Under Review'}
                      </button>
                    )}

                    <button
                      className={styles.approveBtn}
                      disabled={busyApplicationId === item.id}
                      onClick={() => updateApplicationStatus(item.id, 'admin_approved')}
                      title="This forwards it to the Donor for final approval."
                    >
                      Forward to Donor
                    </button>
                    <button
                      className={styles.rejectBtn}
                      disabled={busyApplicationId === item.id}
                      onClick={() => {
                        const reason = prompt('Reason for rejection (Optional):');
                        if (reason !== null) updateApplicationStatus(item.id, 'rejected', reason);
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
      )}

      {activeTab === 'announcements' && (
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Broadcast Global Announcement</h2>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <form onSubmit={handlePublishAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Announcement Title</label>
              <input 
                type="text" 
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
                placeholder="e.g. System Maintenance, New Mega-Scholarship..."
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Message Content</label>
              <textarea 
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                required
                rows="5"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                placeholder="Write your announcement here..."
              ></textarea>
            </div>
            <button 
              type="submit" 
              className={styles.approveBtn} 
              style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
              disabled={publishing}
            >
              {publishing ? 'Publishing...' : 'Publish Announcement Now'}
            </button>
          </form>
        </div>
      </section>
      )}
    </div>
  )
}
