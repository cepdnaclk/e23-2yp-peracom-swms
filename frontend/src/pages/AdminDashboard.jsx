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
  const [announcementItems, setAnnouncementItems] = useState([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false)
  const [announcementsPage, setAnnouncementsPage] = useState(1)
  const [announcementsTotalPages, setAnnouncementsTotalPages] = useState(1)
  const [editingAnnouncementId, setEditingAnnouncementId] = useState('')
  const [editAnnouncementTitle, setEditAnnouncementTitle] = useState('')
  const [editAnnouncementContent, setEditAnnouncementContent] = useState('')
  const [savingAnnouncementId, setSavingAnnouncementId] = useState('')
  
  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectAppId, setRejectAppId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const feedbackTemplates = [
    'Document is not clear/legible',
    'Missing required page(s)',
    'Incorrect document type',
    'Information does not match records',
    'Other (see comments)'
  ]

  useEffect(() => {
    fetchPendingUsers()
    fetchPendingScholarships()
    fetchPendingApplications()
    fetchAnnouncements(1)
  }, [])

  useEffect(() => {
    if (activeTab === 'announcements') {
      fetchAnnouncements(announcementsPage)
    }
  }, [activeTab, announcementsPage])

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

  async function updateApplicationStatus(appId, status, admin_feedback = '', feedback_template = '') {
    setBusyApplicationId(appId)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated. Please log in again.')
      }
      
      const requestBody = { status, admin_feedback, feedback_template }
      console.log('📤 Sending admin request:', { appId, status, admin_feedback, feedback_template })
      
      const res = await fetch(`/api/admin/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody)
      })

      const payload = await res.json()
      
      if (!res.ok) {
        console.error('❌ Admin request failed:', { status: res.status, statusText: res.statusText, payload })
        throw new Error(payload.error || payload.message || 'Failed to update application status')
      }
      console.log('✅ Admin request succeeded:', payload)
      
      // Remove from list if fully processed, otherwise update status
      if (status === 'approved' || status === 'admin_approved' || status === 'rejected') {
        setPendingApplications(prev => prev.filter(a => a.id !== appId))
      } else {
        setPendingApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
      }
      
      setShowRejectModal(false)
      setRejectAppId(null)
      setRejectReason('')
      setSelectedTemplate('')
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
      setAnnouncementItems(prev => [payload.announcement, ...prev].slice(0, 8))
    } catch (err) {
      setError(err.message || 'Failed to publish announcement.')
    } finally {
      setPublishing(false)
    }
  }

  async function fetchAnnouncements(page = 1) {
    setLoadingAnnouncements(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/admin/announcements?page=${page}&limit=8`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to load announcements.')

      setAnnouncementItems(payload.announcements || [])
      setAnnouncementsPage(payload.page || 1)
      setAnnouncementsTotalPages(payload.total_pages || 1)
    } catch (err) {
      setError(err.message || 'Failed to load announcements.')
    } finally {
      setLoadingAnnouncements(false)
    }
  }

  function beginEditAnnouncement(item) {
    setEditingAnnouncementId(item.id)
    setEditAnnouncementTitle(item.title || '')
    setEditAnnouncementContent(item.content || '')
  }

  function cancelEditAnnouncement() {
    setEditingAnnouncementId('')
    setEditAnnouncementTitle('')
    setEditAnnouncementContent('')
  }

  async function saveAnnouncementEdit(id) {
    setSavingAnnouncementId(id)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          title: editAnnouncementTitle,
          content: editAnnouncementContent
        })
      })

      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to update announcement.')

      setAnnouncementItems(prev => prev.map(item => item.id === id ? payload.announcement : item))
      cancelEditAnnouncement()
    } catch (err) {
      setError(err.message || 'Failed to update announcement.')
    } finally {
      setSavingAnnouncementId('')
    }
  }

  async function deleteAnnouncement(id) {
    const confirmed = window.confirm('Delete this announcement?')
    if (!confirmed) return

    setSavingAnnouncementId(id)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })

      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to delete announcement.')

      if (announcementItems.length === 1 && announcementsPage > 1) {
        setAnnouncementsPage(prev => prev - 1)
      } else {
        setAnnouncementItems(prev => prev.filter(item => item.id !== id))
      }
    } catch (err) {
      setError(err.message || 'Failed to delete announcement.')
    } finally {
      setSavingAnnouncementId('')
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
          <button className={styles.secondaryBtn} onClick={() => { fetchPendingUsers(); fetchPendingScholarships(); fetchPendingApplications(); fetchAnnouncements(announcementsPage); }}>Refresh</button>
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
                        {/* Only show current year if needed */}
                        <div className={styles.verifyItem}><span className={styles.verifyLabel}>Current Year</span><span className={styles.verifyValue}>{aInfo.current_year}</span></div>
                        
                        {/* Docs */}
                        <div className={styles.verifyItem} style={{ gridColumn: '1 / -1' }}>
                          <span className={styles.verifyLabel}>Uploaded Documents</span>
                          <ul style={{ margin: 0, paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                            {docs.id_card_url && <li><a href={docs.id_card_url} target="_blank" rel="noreferrer" style={{ color: '#0056b3' }}>ID Card</a></li>}
                            {docs.income_certificate_url && <li><a href={docs.income_certificate_url} target="_blank" rel="noreferrer" style={{ color: '#0056b3' }}>Income Verification Certificate</a></li>}
                            {docs.bank_account_url && <li><a href={docs.bank_account_url} target="_blank" rel="noreferrer" style={{ color: '#0056b3' }}>Bank Account Scan</a></li>}
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
                        setShowRejectModal(true)
                        setRejectAppId(item.id)
                        setRejectReason('')
                        setSelectedTemplate('')
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

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e4e9f5', paddingTop: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.85rem', color: '#1f2a44' }}>Recent Announcements</h3>

            {loadingAnnouncements ? (
              <p className={styles.empty}>Loading announcements...</p>
            ) : announcementItems.length === 0 ? (
              <p className={styles.empty}>No announcements posted yet.</p>
            ) : (
              <div className={styles.list}>
                {announcementItems.map((item) => {
                  const isEditing = editingAnnouncementId === item.id
                  const busy = savingAnnouncementId === item.id

                  return (
                    <article key={item.id} className={styles.userCard}>
                      <div className={styles.meta} style={{ marginBottom: '0.45rem' }}>
                        <span>Published: {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</span>
                      </div>

                      {isEditing ? (
                        <div style={{ display: 'grid', gap: '0.65rem' }}>
                          <input
                            type="text"
                            value={editAnnouncementTitle}
                            onChange={(e) => setEditAnnouncementTitle(e.target.value)}
                            style={{ width: '100%', padding: '0.65rem', borderRadius: '0.45rem', border: '1px solid #ccd6eb' }}
                          />
                          <textarea
                            rows="4"
                            value={editAnnouncementContent}
                            onChange={(e) => setEditAnnouncementContent(e.target.value)}
                            style={{ width: '100%', padding: '0.65rem', borderRadius: '0.45rem', border: '1px solid #ccd6eb', resize: 'vertical' }}
                          />
                          <div className={styles.actions}>
                            <button className={styles.approveBtn} disabled={busy} onClick={() => saveAnnouncementEdit(item.id)}>
                              {busy ? 'Saving...' : 'Save'}
                            </button>
                            <button className={styles.secondaryBtn} type="button" onClick={cancelEditAnnouncement}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 style={{ margin: '0 0 0.35rem' }}>{item.title}</h3>
                          <p style={{ margin: '0 0 0.7rem', color: '#354767', whiteSpace: 'pre-wrap' }}>{item.content}</p>
                          <div className={styles.actions}>
                            <button className={styles.secondaryBtn} onClick={() => beginEditAnnouncement(item)} disabled={busy}>
                              Edit
                            </button>
                            <button className={styles.rejectBtn} onClick={() => deleteAnnouncement(item.id)} disabled={busy}>
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  )
                })}
              </div>
            )}

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className={styles.secondaryBtn}
                disabled={announcementsPage <= 1 || loadingAnnouncements}
                onClick={() => setAnnouncementsPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <span style={{ color: '#566a8f', fontSize: '0.9rem' }}>Page {announcementsPage} of {announcementsTotalPages}</span>
              <button
                className={styles.secondaryBtn}
                disabled={announcementsPage >= announcementsTotalPages || loadingAnnouncements}
                onClick={() => setAnnouncementsPage((prev) => Math.min(prev + 1, announcementsTotalPages))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,41,59,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', padding: '2rem 2.5rem', minWidth: 360, maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ margin: 0, marginBottom: 16, fontSize: '1.3rem', color: '#1f2a44' }}>Reject Application</h3>
            <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.95rem' }}>Please select or provide a reason for rejection:</p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, color: '#475569', marginBottom: 8, display: 'block', fontSize: '0.9rem' }}>📋 Select a Template (Optional)</label>
              <select 
                value={selectedTemplate} 
                onChange={e => setSelectedTemplate(e.target.value)} 
                style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontSize: '0.95rem' }}
              >
                <option value="">-- Choose a template --</option>
                {feedbackTemplates.map((tpl, i) => <option key={i} value={tpl}>{tpl}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, color: '#475569', marginBottom: 8, display: 'block', fontSize: '0.9rem' }}>✍️ Or Write Custom Reason</label>
              <textarea 
                value={rejectReason} 
                onChange={e => setRejectReason(e.target.value)} 
                rows={4} 
                style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '0.95rem', resize: 'vertical' }} 
                placeholder="Explain why you're rejecting this application (at least 3 characters)..."
              />
            </div>

            {!selectedTemplate && rejectReason && (
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 12 }}>
                Characters: {rejectReason.length}/200
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                className={styles.secondaryBtn}
                onClick={() => { 
                  setShowRejectModal(false); 
                  setRejectAppId(null); 
                  setRejectReason(''); 
                  setSelectedTemplate(''); 
                }}
                style={{ minWidth: 100 }}
              >
                Cancel
              </button>
              <button 
                className={styles.rejectBtn}
                onClick={() => {
                  const reason = selectedTemplate || rejectReason
                  if (!reason || reason.trim().length < 3) {
                    setError('Please select a template or provide at least 3 characters')
                    return
                  }
                  updateApplicationStatus(rejectAppId, 'rejected', rejectReason, selectedTemplate)
                }}
                disabled={!selectedTemplate && (!rejectReason || rejectReason.trim().length < 3) || busyApplicationId === rejectAppId}
                style={{ minWidth: 100, opacity: (!selectedTemplate && (!rejectReason || rejectReason.trim().length < 3) || busyApplicationId === rejectAppId) ? 0.6 : 1 }}
              >
                {busyApplicationId === rejectAppId ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
