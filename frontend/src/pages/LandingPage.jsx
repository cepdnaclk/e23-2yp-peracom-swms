import { useNavigate } from 'react-router-dom'
import PublicNav from '../components/PublicNav'
import Footer from '../components/Footer'
import styles from './LandingPage.module.css'

const FEATURED = [
  { title: 'Merit Fund', eligibility: 'Batch 20/21', deadline: '30/06/2025' },
  { title: 'Alumni Scholarship', eligibility: 'Batch 19/20', deadline: '31/05/2025' },
  { title: 'Science Faculty Scholarship', eligibility: 'Batch 20/21', deadline: '15/05/2025' },
]
const HOW = [
  { icon: '🎓', title: 'Students Apply for Scholarships', desc: 'Students apply for available scholarships, completing their profiles and submitting required documents.' },
  { icon: '📋', title: 'Documents Verified & Applications Reviewed', desc: 'The administration verifies the documents and reviews applications to ensure eligibility.' },
  { icon: '💰', title: 'Donors Support Students', desc: 'Approved applications receive funding from generous donors to help students continue their education.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  return (
    <div className={styles.page}>
      <PublicNav />

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>PeraCom Student Welfare<br />Management System</h1>
          <p>Supporting Students Through Scholarships</p>
          <button className={styles.heroBtn} onClick={() => navigate('/scholarships-public')}>View Scholarships</button>
        </div>
        <div className={styles.heroImg}><span>🏛️</span></div>
      </section>

      <div className={styles.body}>
        <section className={styles.about}>
          <h2>About the Welfare Program</h2>
          <div className={styles.aboutGrid}>
            <p>Proudly supporting the students of the University of Peradeniya, the PeraCom Student Welfare Management System aims to provide financial assistance through scholarships. Our goal is to help deserving and underprivileged students achieve their academic journey by connecting them with scholarships funded by generous donors.</p>
            <p>The PeraCom Student Welfare Management System aims to provide financial assistance to students, connecting them with scholarship opportunities from donors to ensure students can achieve academic success.</p>
          </div>
        </section>

        <section className={styles.featured}>
          <h2>Featured Scholarships</h2>
          <div className={styles.featuredGrid}>
            {FEATURED.map(s => (
              <div key={s.title} className={styles.featuredCard}>
                <h3>{s.title}</h3>
                <p className={styles.eligibility}>Eligibility: {s.eligibility}</p>
                <p className={styles.deadline}><strong>Deadline:</strong> {s.deadline}</p>
                <button className={styles.applyBtn} onClick={() => navigate('/login')}>Apply Now</button>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.howSection}>
          <h2>How It Works</h2>
          <div className={styles.howGrid}>
            {HOW.map(h => (
              <div key={h.title} className={styles.howCard}>
                <div className={styles.howIcon}>{h.icon}</div>
                <h3>{h.title}</h3>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}