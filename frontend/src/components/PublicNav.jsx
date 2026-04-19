import { Link, useNavigate } from 'react-router-dom'
import styles from './PublicNav.module.css'

export default function PublicNav() {
  const navigate = useNavigate()
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <div className={styles.logoBox}>🎓</div>
          <div className={styles.brandText}>
            <span className={styles.brandSub}>University of Peradeniya</span>
            <span className={styles.brandMain}>University of Peradeniya</span>
          </div>
        </Link>
        <div className={styles.links}>
          <Link to="/" className={styles.link}>Home</Link>
          <Link to="/scholarships-public" className={styles.link}>Scholarships</Link>
          <Link to="/about" className={styles.link}>About</Link>
          <Link to="/contact" className={styles.link}>Contact</Link>
          <button className={styles.searchBtn}>🔍</button>
          <button className={styles.loginBtn} onClick={() => navigate('/login')}>Login</button>
        </div>
      </div>
    </nav>
  )
}