import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Footer from '../Footer'
import styles from './DashLayout.module.css'

export default function DashLayout({ children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropOpen, setDropOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'User'
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'U'

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
          <Link to="/dashboard" className={`${styles.navLink} ${location.pathname === '/dashboard' ? styles.navLinkActive : ''}`}>
            Dashboard
          </Link>
          <Link to="/scholarships" className={`${styles.navLink} ${location.pathname.startsWith('/scholarships') ? styles.navLinkActive : ''}`}>
            Scholarships
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
                  <strong>{profile?.full_name}</strong>
                  <span>{profile?.email}</span>
                </div>
                <hr />
                <button className={styles.dropItem} onClick={() => { setDropOpen(false); navigate('/applications') }}>My Applications</button>
                <button className={styles.dropItem} onClick={() => { setDropOpen(false); navigate('/settings') }}>Settings</button>
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