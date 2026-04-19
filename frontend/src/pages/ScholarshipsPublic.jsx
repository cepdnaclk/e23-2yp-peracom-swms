import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PublicNav from '../components/PublicNav'
import Footer from '../components/Footer'
import { supabase } from '../services/supabaseClient'
import styles from './ScholarshipsPublic.module.css'

const SAMPLES = [
  { id: 's1', title: 'Merit Fund', eligibility: 'Batch 20/21', deadline: '30/06/2025', description: 'Scholarship based on academic merit and financial need for high-achieving undergraduate students.' },
  { id: 's2', title: 'Alumni Scholarship', eligibility: 'Batch 19/20', deadline: '31/05/2025', description: 'Scholarship funded by alumni for students who demonstrate financial need and academic excellence.' },
  { id: 's3', title: 'Science Faculty Scholarship', eligibility: 'Batch 20/21', deadline: '15/05/2025', description: 'Scholarship for students in the Science Faculty showing both academic potential and financial need.' },
]

export default function ScholarshipsPublic() {
  const navigate = useNavigate()
  const [scholarships, setScholarships] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/scholarships/public')
      const payload = await res.json()
      if (res.ok) setScholarships(payload.scholarships || [])
    } catch {
      setScholarships([])
    } finally {
      setLoading(false)
    }
  }

  const source = scholarships.length > 0 ? scholarships : SAMPLES
  const display = source.filter(s => {
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || s.funding_type === filter
    return matchSearch && matchFilter
  })

  return (
    <div className={styles.page}>
      <PublicNav />
      <div className={styles.body}>
        <h1>Scholarships</h1>
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <span>🔍</span>
            <input type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className={styles.filterSelect}>
            <option value="all">Filter</option>
            <option value="full">Full Funding</option>
            <option value="partial">Partial</option>
          </select>
        </div>

        <h2 className={styles.listTitle}>Scholarships</h2>
        {loading ? <p className={styles.empty}>Loading...</p> : (
          <div className={styles.list}>
            {display.map(s => (
              <div key={s.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <h3>{s.title}</h3>
                  <p className={styles.eligibility}>Eligiblity: {s.eligibility || s.batch || '—'}</p>
                  <p className={styles.deadline}><strong>Deadline:</strong> {s.deadline && s.deadline.includes('-') ? new Date(s.deadline).toLocaleDateString('en-GB') : s.deadline}</p>
                  <p className={styles.desc}>{s.description ?? 'No description available.'}</p>
                  <div className={styles.cardActions}>
                    <button className={styles.detailBtn} onClick={() => navigate(`/scholarships/${s.id}`)}>View Details</button>
                    <span className={styles.sep}>|</span>
                    <button className={styles.applyBtn} onClick={() => navigate('/login')}>Apply Now</button>
                  </div>
                </div>
                <div className={styles.cardImg}></div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}