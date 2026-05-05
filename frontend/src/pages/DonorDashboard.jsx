import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'
import DonorLayout from '../components/dashboard/DonorLayout'
import styles from './DonorDashboard.module.css'

const STATUS_LABELS = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  published: 'Published',
  rejected: 'Rejected',
}

const STATUS_STYLES = {
  draft: styles.statusDraft,
  pending_review: styles.statusPending,
  published: styles.statusPublished,
  rejected: styles.statusRejected,
}

const EMPTY_FORM = {
  title: '',
  description: '',
  amount: '',
  funding_type: 'full',
  deadline: '',
  slots: '',
  requirements: '',
}

export default function DonorDashboard() {
  const { user, profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState('all')
  const [activeTab, setActiveTab] = useState('scholarships')
  
  // Applications state
  const [applications, setApplications] = useState([])
  const [appsLoading, setAppsLoading] = useState(false)

  useEffect(() => { 
    if (activeTab === 'scholarships') fetchScholarships() 
    else if (activeTab === 'applications') fetchApplications()
  }, [activeTab])

  async function fetchScholarships() {
    setError('')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/scholarships/all', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to load scholarships.')
      
      setItems(payload.scholarships ?? [])
    } catch (err) {
      setError(err.message || 'Failed to load scholarships.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchApplications() {
    setError('')
    setAppsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/donor/applications', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to load applications.')
      
      setApplications(payload.applications ?? [])
    } catch (err) {
      setError(err.message || 'Failed to load applications.')
    } finally {
      setAppsLoading(false)
    }
  }

  async function handleAppStatus(appId, status, feedback = '') {
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/donor/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status, donor_feedback: feedback })
      })
      
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to update application.')
      
      // Update local state without fetching again
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
    } catch (err) {
      setError(err.message || 'Failed to update application.')
    }
  }

  const donorName = useMemo(() => {
    return (
      profile?.org_name ||
      profile?.full_name ||
      user?.user_metadata?.org_name ||
      user?.user_metadata?.full_name ||
      'Donor'
    )
  }, [profile, user])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter(item => {
      if (scope === 'mine' && item.donor_id !== user?.id) return false
      if (!query) return true
      const title = item.title?.toLowerCase() ?? ''
      const desc = item.description?.toLowerCase() ?? ''
      const donor = item.donor_name?.toLowerCase() ?? ''
      return title.includes(query) || desc.includes(query) || donor.includes(query)
    })
  }, [items, scope, search, user])

  function handleChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  function openCreateModal() {
    resetForm()
    setShowModal(true)
  }

  function closeModal() {
    if (saving) return
    setShowModal(false)
    resetForm()
  }

  async function handleSave(e) {
    e.preventDefault()  // 1. Stops the browser from refreshing the page on Submit.
    setError('')        // 2. Clears any old error messages from the screen.
    setSaving(true)     // 3. Turns the "Save" button into a "Saving..." loading button.
    try {
        // 4. Ask Supabase for the logged-in user's Session Token.
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      

      // 5. Gather all the text the user typed into the form.
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        amount: form.amount ? Number(form.amount) : null,
        funding_type: form.funding_type,
        deadline: form.deadline || null,
        slots: form.slots ? Number(form.slots) : null,
        requirements: form.requirements.trim() || null,
        donor_name: donorName,
      }

      if (!payload.title || !payload.description) {
        throw new Error('Title and description are required.')
      }

      if (editingId) {
        const res = await fetch(`/api/scholarships/${editingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update scholarship.')
      } else {
        const res = await fetch('/api/scholarships', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create scholarship.')
      }

      resetForm()
      setShowModal(false)
      fetchScholarships()
    } catch (err) {
      setError(err.message || 'Failed to save scholarship.')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(item) {
    setEditingId(item.id)
    setForm({
      title: item.title ?? '',
      description: item.description ?? '',
      amount: item.amount ?? '',
      funding_type: item.funding_type ?? 'full',
      deadline: item.deadline ? item.deadline.split('T')[0] : '',
      slots: item.slots ?? '',
      requirements: item.requirements ?? '',
    })
    setShowModal(true)
  }

  async function handlePublish(item) {
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/scholarships/${item.id}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to request review.')
      
      fetchScholarships()
    } catch (err) {
      setError(err.message || 'Failed to request review.')
    }
  }

  return (
    <DonorLayout>
      <div className={styles.page}>
        <div className={styles.tabs} style={{ paddingBottom: '1rem' }}>
          <button 
            className={`${styles.tab} ${activeTab === 'scholarships' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('scholarships')}
          >
            My Scholarships
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'applications' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            Review Applications
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        {activeTab === 'scholarships' && (
          <>
            <header className={styles.header}>
              <div>
                <p className={styles.kicker}>Donor Panel</p>
                <h1>Scholarships</h1>
                <p className={styles.sub}>Create a scholarship, then submit it for admin review.</p>
              </div>
              <div className={styles.headerActions}>
                <button className={styles.primaryAction} onClick={openCreateModal}>Add Scholarship</button>
              </div>
              <div className={styles.headerStats}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Total</span>
                  <strong>{items.length}</strong>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Published</span>
                  <strong>{items.filter(i => i.status === 'published').length}</strong>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Pending</span>
                  <strong>{items.filter(i => i.status === 'pending_review').length}</strong>
                </div>
              </div>
            </header>

        <section className={styles.listCard}>
          <div className={styles.listHeader}>
            <h2>All Scholarships</h2>
            <div className={styles.listActions}>
              <div className={styles.filterGroup}>
                <button
                  className={`${styles.filterBtn} ${scope === 'all' ? styles.filterBtnActive : ''}`}
                  onClick={() => setScope('all')}
                  type="button"
                >
                  All
                </button>
                <button
                  className={`${styles.filterBtn} ${scope === 'mine' ? styles.filterBtnActive : ''}`}
                  onClick={() => setScope('mine')}
                  type="button"
                >
                  Mine
                </button>
              </div>
              <div className={styles.searchBox}>
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Search scholarships or donors..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button className={styles.linkBtn} onClick={fetchScholarships}>Refresh</button>
            </div>
          </div>

          {loading ? (
            <p className={styles.empty}>Loading...</p>
          ) : filteredItems.length === 0 ? (
            <p className={styles.empty}>{search.trim() || scope === 'mine' ? 'No matches found.' : 'No scholarships created yet.'}</p>
          ) : (
            <div className={styles.list}>
              {filteredItems.map(item => {
                const statusLabel = STATUS_LABELS[item.status] ?? 'Draft'
                const statusClass = STATUS_STYLES[item.status] ?? styles.statusDraft
                const isOwner = item.donor_id === user?.id
                const canPublish = isOwner && ['draft', 'rejected'].includes(item.status)

                return (
                  <div key={item.id} className={styles.itemCard}>
                    <div className={styles.itemTop}>
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.description?.slice(0, 120)}{item.description?.length > 120 ? '...' : ''}</p>
                      </div>
                      <span className={`${styles.statusPill} ${statusClass}`}>{statusLabel}</span>
                    </div>

                    <div className={styles.itemMeta}>
                      <span>Donor: {item.donor_name || 'Unknown'}</span>
                      <span>Amount: {item.amount ? `₱${Number(item.amount).toLocaleString()}` : '—'}</span>
                      <span>Deadline: {item.deadline ? new Date(item.deadline).toLocaleDateString() : '—'}</span>
                      <span>Slots: {item.slots ?? '—'}</span>
                    </div>

                    {expandedId === item.id && (
                      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#334155' }}>Full Description</h4>
                        <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: '#475569' }}>{item.description || 'No description provided.'}</p>
                        
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#334155' }}>Requirements</h4>
                        <p style={{ margin: '0 0 0', fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: '#475569' }}>{item.requirements || 'No specific requirements.'}</p>
                      </div>
                    )}

                    <div className={styles.itemActions} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
                      <button 
                        className={styles.secondaryBtn} 
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      >
                        {expandedId === item.id ? 'Hide Details' : 'View Full Details'}
                      </button>
                      
                      <div style={{ flex: 1 }}></div>

                      {isOwner && (
                        <>
                          {canPublish && (
                            <button className={styles.secondaryBtn} onClick={() => handleEdit(item)}>Edit</button>
                          )}
                          {canPublish && (
                            <button className={styles.primaryBtnSmall} onClick={() => handlePublish(item)}>
                              Submit for Review
                            </button>
                          )}
                          {!canPublish && item.status !== 'published' && (
                            <button className={styles.secondaryBtn} disabled>Edit Locked</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
          </>
        )}

        {activeTab === 'applications' && (
          <>
            <header className={styles.header}>
              <div>
                <p className={styles.kicker}>Donor Panel</p>
                <h1>Applications to Review</h1>
                <p className={styles.sub}>These applications have passed admin screening and await your final decision.</p>
              </div>
            </header>
            
            <section className={styles.listCard}>
              <div className={styles.listHeader}>
                <h2>Screened Applications</h2>
                <button className={styles.linkBtn} onClick={fetchApplications}>Refresh</button>
              </div>

              {appsLoading ? (
                 <p className={styles.empty}>Loading applications...</p>
              ) : applications.length === 0 ? (
                 <p className={styles.empty}>No applications currently await your review.</p>
              ) : (
                <div className={styles.list}>
                  {applications.map(app => {
                    const student = app.profiles || {}
                    const scholarship = app.scholarships || {}
                    const isPending = app.status === 'admin_approved'

                    return (
                      <div key={app.id} className={styles.itemCard}>
                        <div className={styles.itemTop}>
                          <div>
                            <h3>Applicant: {student.full_name || 'Unknown User'}</h3>
                            <p style={{fontSize: '0.875rem', color: '#64748b'}}>Scholarship: {scholarship.title}</p>
                          </div>
                          <span className={`${styles.statusPill} ${
                            app.status === 'awarded' ? styles.statusPublished :
                            app.status === 'rejected' ? styles.statusRejected :
                            styles.statusPending
                          }`}>
                            {app.status === 'admin_approved' ? 'Awaiting Decision' : 
                             app.status === 'awarded' ? 'Awarded' : 'Rejected'}
                          </span>
                        </div>

                        {app.document_urls && app.document_urls.transcript_url && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <a href={app.document_urls.transcript_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: '500', marginRight: '1rem' }}>
                              View Transcript
                            </a>
                            {app.document_urls.grades_url && (
                              <a href={app.document_urls.grades_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: '500', marginRight: '1rem' }}>
                                View Grades
                              </a>
                            )}
                            {app.document_urls.income_certificate_url && (
                              <a href={app.document_urls.income_certificate_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: '500', marginRight: '1rem' }}>
                                View Income Certificate
                              </a>
                            )}
                            {app.document_urls.essay_url && (
                              <a href={app.document_urls.essay_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: '500' }}>
                                View Essay
                              </a>
                            )}
                          </div>
                        )}
                        
                        {app.academic_info && (
                          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#334155' }}>Academic Info</h4>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#475569' }}>
                              <strong>Full Name:</strong> {app.academic_info.full_name || app.personal_info?.full_name || 'N/A'}<br/>
                              <strong>Student ID:</strong> {app.academic_info.student_id || app.personal_info?.student_id || 'N/A'}<br/>
                              <strong>Department:</strong> {app.academic_info.department || 'N/A'}<br/>
                              <strong>Current Year:</strong> {app.academic_info.current_year || 'N/A'}<br/>
                              <strong>University:</strong> {app.academic_info.university || 'N/A'}<br/>
                              <strong>GPA/Grades:</strong> {app.academic_info.gpa || 'N/A'}
                            </p>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#334155' }}>Financial Info</h4>
                            <p style={{ margin: '0 0 0', fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: '#475569' }}>
                              <strong>Monthly Household Income:</strong> {app.academic_info.monthly_household_income || 'N/A'}<br/>
                              <strong>Parent / Guardian Occupation:</strong> {app.academic_info.parent_occupation || 'N/A'}<br/>
                              <strong>Dependents:</strong> {app.academic_info.dependents || 'N/A'}
                            </p>
                          </div>
                        )}

                        {isPending && (
                          <div className={styles.itemActions} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button 
                              className={styles.primaryBtnSmall} 
                              onClick={() => {
                                if (window.confirm('Award scholarship to this student?')) {
                                  handleAppStatus(app.id, 'awarded')
                                }
                              }}
                            >
                              Award Scholarship
                            </button>
                            <button 
                              className={styles.rejectBtn}
                              style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                              onClick={() => {
                                const feedback = prompt('Provide feedback for rejection (Optional):');
                                if (feedback !== null) handleAppStatus(app.id, 'rejected', feedback)
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'scholarships' && showModal && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{editingId ? 'Edit Scholarship' : 'Create New Scholarship'}</h2>
                <button className={styles.modalClose} onClick={closeModal} aria-label="Close">✕</button>
              </div>

              <form className={styles.formBody} onSubmit={handleSave}>
                <label className={styles.field}>
                  <span>Title</span>
                  <input value={form.title} onChange={e => handleChange('title', e.target.value)} />
                </label>

                <label className={styles.field}>
                  <span>Description</span>
                  <textarea rows={4} value={form.description} onChange={e => handleChange('description', e.target.value)} />
                </label>

                <div className={styles.row}>
                  <label className={styles.field}>
                    <span>Amount (PHP)</span>
                    <input type="number" min="0" value={form.amount} onChange={e => handleChange('amount', e.target.value)} />
                  </label>
                  <label className={styles.field}>
                    <span>Funding Type</span>
                    <select value={form.funding_type} onChange={e => handleChange('funding_type', e.target.value)}>
                      <option value="full">Full Funding</option>
                      <option value="partial">Partial Funding</option>
                    </select>
                  </label>
                </div>

                <div className={styles.row}>
                  <label className={styles.field}>
                    <span>Deadline</span>
                    <input type="date" value={form.deadline} onChange={e => handleChange('deadline', e.target.value)} />
                  </label>
                  <label className={styles.field}>
                    <span>Slots</span>
                    <input type="number" min="1" value={form.slots} onChange={e => handleChange('slots', e.target.value)} />
                  </label>
                </div>

                <label className={styles.field}>
                  <span>Requirements</span>
                  <textarea rows={3} value={form.requirements} onChange={e => handleChange('requirements', e.target.value)} />
                </label>

                <button className={styles.primaryBtn} disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Scholarship' : 'Save Draft'}
                </button>
                <p className={styles.formHint}>Drafts are only visible to you. Submit for review when ready.</p>
              </form>
            </div>
          </div>
        )}
      </div>
    </DonorLayout>
  )
}
