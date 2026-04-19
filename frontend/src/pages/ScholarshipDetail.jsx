import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/dashboard/Layout'
import { supabase } from '../services/supabaseClient'
import styles from './ScholarshipDetail.module.css'

export default function ScholarshipDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [scholarship, setScholarship] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}

        const res = await fetch(`/api/scholarships/${id}`, { headers })
        const payload = await res.json()

        if (res.ok) {
          setScholarship(payload.scholarship)
        }

        // We can fetch applications explicitly if they are logged in, 
        // but for now let's just do a basic check if they have a session.
        if (session?.user) {
          const appRes = await fetch(`/api/applications/has-applied/${id}`, { headers })
          if (appRes.ok) {
            const appPayload = await appRes.json()
            setHasApplied(appPayload.hasApplied || false)
          }
        }
        
      } catch (err) {
        console.error("Failed to load scholarship details", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  if (loading) return <Layout><div style={{ padding: '2rem' }}>Loading...</div></Layout>
  if (!scholarship) return <Layout><div style={{ padding: '2rem' }}>Scholarship not found.</div></Layout>

  return (
    <Layout>
      <div className={styles.page}>
        <button className={styles.back} onClick={() => navigate('/scholarships')}>← Back to list</button>

        <div className={styles.hero}>
          <div className={styles.heroMeta}>
            <span className={`${styles.badge} ${scholarship.funding_type === 'full' ? styles.full : styles.partial}`}>
              {scholarship.funding_type === 'full' ? 'Full Funding' : 'Partial Funding'}
            </span>
            {scholarship.deadline && (
              <span className={styles.deadline}>
                Deadline: {new Date(scholarship.deadline).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
          </div>
          <h1>{scholarship.title}</h1>
          <p className={styles.donor}>Offered by: <strong>{scholarship.donor_name ?? 'Anonymous Donor'}</strong></p>
          {scholarship.amount && (
            <div className={styles.amount}>
              ₱{Number(scholarship.amount).toLocaleString()} <span>/ recipient</span>
            </div>
          )}
        </div>

        <div className={styles.grid}>
          <div className={styles.main}>
            <section className={styles.section}>
              <h2>About this Scholarship</h2>
              <p>{scholarship.description}</p>
            </section>
            {scholarship.requirements && (
              <section className={styles.section}>
                <h2>Requirements</h2>
                <p style={{ whiteSpace: 'pre-line' }}>{scholarship.requirements}</p>
              </section>
            )}
          </div>

          <div className={styles.sidebar}>
            <div className={styles.sideCard}>
              <div className={styles.infoRow}>
                <span>Available slots</span>
                <strong>{scholarship.slots ?? '—'}</strong>
              </div>
              <div className={styles.infoRow}>
                <span>Funding type</span>
                <strong style={{ textTransform: 'capitalize' }}>{scholarship.funding_type}</strong>
              </div>
              <div className={styles.infoRow}>
                <span>Status</span>
                <strong style={{ color: 'var(--success)' }}>Open</strong>
              </div>
              {scholarship.deadline && (
                <div className={styles.infoRow}>
                  <span>Deadline</span>
                  <strong>{new Date(scholarship.deadline).toLocaleDateString()}</strong>
                </div>
              )}
              <div style={{ marginTop: '1.5rem' }}>
                {hasApplied ? (
                  <div className={styles.alreadyApplied}> You have already applied</div>
                ) : (
                  <button className={styles.applyBtn} onClick={() => navigate(`/apply/${scholarship.id}`)}>
                    Apply Now →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}