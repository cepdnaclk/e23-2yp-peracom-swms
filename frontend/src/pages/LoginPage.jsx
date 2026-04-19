import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Footer from '../components/Footer'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { signIn, getDashboardPath } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e) {
    //stops the form from refreshing the page on submit
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await signIn(form.email, form.password)
      const role = data.user?.role ?? 'student'
      navigate(getDashboardPath(role))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div className={styles.logoBox}>🎓</div>
        <div className={styles.logoText}>
          <span className={styles.logoSub}>University of Peradeniya</span>
          <span className={styles.logoMain}>University of Peradeniya</span>
        </div>
      </div>

      <h1 className={styles.sysTitle}>PeraCom Student Welfare Management System</h1>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Login</h2>
        <hr className={styles.divider} />

        {error && <div className={styles.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Email</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>✉️</span>
              <input type="email" placeholder="Enter your email"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label>Password</label>
              <a href="#" className={styles.forgot}>Forgot password?</a>
            </div>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>🔒</span>
              <input type={showPw ? 'text' : 'password'} placeholder="Enter your password"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(!showPw)}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button className={styles.submitBtn} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className={styles.registerLink}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>

      <Footer />
    </div>
  )
}