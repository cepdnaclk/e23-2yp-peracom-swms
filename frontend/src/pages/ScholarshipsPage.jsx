import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashLayout from '../components/dashboard/DashLayout'
import { supabase } from '../services/supabaseClient'
import styles from './ScholarshipsPage.module.css'

export default function ScholarshipsPage() {
  const navigate = useNavigate()
  const [scholarships, setScholarships] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchScholarships()
  }, [])
  // The empty brackets mean: "Only run this ONCE when the page first opens."

  async function fetchScholarships() {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const res = await fetch('/api/scholarships', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
      })
       // 2. It converts the backend's response into a JavaScript object:
      const payload = await res.json()
      
      if (!res.ok) throw new Error(payload.error || 'Failed to load scholarships.')

       // 3. It takes the giant list of scholarships from the payload 
  // and saves it directly into the master `scholarships` variable!  
      setScholarships(payload.scholarships || [])

    } catch (err) {
      setError(err.message)
      setScholarships([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let result = [...scholarships]

    
  // 1. If they typed a search, filter by Title or Donor Name
    if (search) result = result.filter(s =>
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.donor_name?.toLowerCase().includes(search.toLowerCase())
    )
    
    if (filterType !== 'all') result = result.filter(s => s.funding_type === filterType)
    
      // 3. Sort the final remaining cards (by new, deadline, or money)
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (sortBy === 'deadline') result.sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0))
    if (sortBy === 'amount') result.sort((a, b) => (b.amount || 0) - (a.amount || 0))
    setFiltered(result)
  }, [search, filterType, sortBy, scholarships])

// ^ The brackets mean: "Run this AGAIN every single time the user types a 'search', 
// clicks a 'filterType', or when 'scholarships' finish downloading."
  

function getDaysLeft(deadline) {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
    if (days < 0) return { text: 'Closed', urgent: true }
    if (days === 0) return { text: 'Last day!', urgent: true }
    if (days <= 7) return { text: `${days}d left`, urgent: true }
    return { text: `${days}d left`, urgent: false }
  }

  return (
    <DashLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1>Browse Scholarships</h1>
            <p>{filtered.length} scholarships available</p>
          </div>
        </div>

        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search scholarships or donors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="full">Full Funding</option>
            <option value="partial">Partial Funding</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="deadline">By Deadline</option>
            <option value="amount">Highest Amount</option>
          </select>
        </div>

        {loading ? (
          <div className={styles.loadingGrid}>
            {[...Array(6)].map((_, i) => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : error ? (
          <div className={styles.empty}>
            <p style={{ color: 'red' }}>Error: {error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🎓</div>
            <p>No scholarships found matching your search.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(s => {
              const deadline = s.deadline ? getDaysLeft(s.deadline) : null
              return (
                <div key={s.id} className={styles.card} onClick={() => navigate(`/scholarships/${s.id}`)}>
                  <div className={styles.cardTop}>
                    <span className={`${styles.badge} ${s.funding_type === 'full' ? styles.badgeFull : styles.badgePartial}`}>
                      {s.funding_type === 'full' ? 'Full Funding' : 'Partial'}
                    </span>
                    {deadline && (
                      <span className={`${styles.deadline} ${deadline.urgent ? styles.deadlineUrgent : ''}`}>
                        {deadline.text}
                      </span>
                    )}
                  </div>
                  <h3 className={styles.cardTitle}>{s.title}</h3>
                  <p className={styles.cardDonor}>by {s.donor_name ?? 'Anonymous Donor'}</p>
                  {s.amount && (
                    <div className={styles.cardAmount}>
                      ₱{Number(s.amount).toLocaleString()}
                    </div>
                  )}
                  <p className={styles.cardDesc}>{s.description?.slice(0, 110)}...</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.slots}>{s.slots ?? '?'} slots</span>
                    <button className={styles.viewBtn}>View Details →</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashLayout>
  )
}