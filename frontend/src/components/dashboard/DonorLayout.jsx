import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Footer from '../Footer'
import styles from './DashLayout.module.css'

export default function DonorLayout({ children }) {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropOpen, setDropOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const fullName = profile?.full_name ?? user?.user_metadata?.full_name ?? ''
  const firstName = fullName.split(' ')[0] || 'Donor'
  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'D'

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.brand}>
          <div className={styles.logoBox}>🎓</div>
          <div className={styles.brandText}>
            <span className={styles.brandSub}>University of Peradeniya</span>
            <span className={styles.brandMain}>University of Peradeniya</span>
          </div>
        </Link>

        <div className={styles.navLinks}>
          <Link to="/donor/dashboard" className={`${styles.navLink} ${location.pathname === '/donor/dashboard' ? styles.navLinkActive : ''}`}>
            Dashboard
          </Link>
          <button className={styles.chatBtn}>💬</button>

          <div className={styles.profileWrap}>
            <button className={styles.profileBtn} onClick={() => setDropOpen(!dropOpen)}>
              <div className={styles.avatar}>{initials}</div>
              <span className={styles.profileName}>{firstName}</span>
              <span className={styles.chevron}>▾</span>
            </button>
            {dropOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropInfo}>
                  <strong>{fullName || 'Loading...'}</strong>
                  <span>{profile?.email ?? user?.email}</span>
                </div>
                <hr />
                <button className={styles.dropItem} onClick={() => { setDropOpen(false); navigate('/donor/dashboard') }}>
                  My Scholarships
                </button>
                <hr />
                <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleSignOut}>Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  )
}
