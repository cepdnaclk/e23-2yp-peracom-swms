import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Footer from '../components/Footer'
import styles from './RegisterPage.module.css'

function IW({ icon, placeholder, type = 'text', value, onChange, required, showToggle, show, onToggle }) {
  return (
    <div className={styles.inputWrap}>
      {icon && <span className={styles.inputIcon}>{icon}</span>}
      <input
        type={showToggle ? (show ? 'text' : 'password') : type}
        placeholder={placeholder} value={value} onChange={onChange}
        required={required} className={styles.input} />
      {showToggle && (
        <button type="button" className={styles.eyeBtn} onClick={onToggle}>
          {show ? '🙈' : '👁️'}
        </button>
      )}
    </div>
  )
}

function F({ label, children }) {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      {children}
    </div>
  )
}

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)

  const [student, setStudent] = useState({ fullName: '', registrationNo: '', batch: '', email: '', phone: '', password: '', confirm: '' })
  const [donor, setDonor] = useState({ donorName: '', orgName: '', email: '', phone: '', address: '', password: '', confirm: '' })
  const [admin, setAdmin] = useState({ fullName: '', staffId: '', department: '', email: '', password: '', confirm: '' })
  const [registered, setRegistered] = useState(false)
  const [registeredRole, setRegisteredRole] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    let email, password, confirm, metadata
    if (role === 'student') {
      ;({ email, password, confirm } = student)
      metadata = { full_name: student.fullName, registration_no: student.registrationNo, batch: student.batch, phone: student.phone, role: 'student' }
    } else if (role === 'donor') {
      ;({ email, password, confirm } = donor)
      metadata = { full_name: donor.donorName || donor.orgName, org_name: donor.orgName, phone: donor.phone, address: donor.address, role: 'donor' }
    } else {
      ;({ email, password, confirm } = admin)
      metadata = { full_name: admin.fullName, staff_id: admin.staffId, department: admin.department, role: 'admin' }
    }
    if (password !== confirm) return setError('Passwords do not match.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    setLoading(true)
    try {
    await signUp(email, password, metadata) // 1. Wait for the backend/Supabase to finish...
    setRegisteredRole(role)                 // 2. Remember which role they registered as.
    setRegistered(true)                     // 3. SWITCH THE SCREEN! go to if registered paert and change teh screen
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
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
        <div className={styles.card} style={{ padding: '2.5rem 2.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⏳</div>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--navy)', marginBottom: '0.5rem' }}>Registration Submitted!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Your <strong>{registeredRole}</strong> registration was submitted successfully.<br />
            <strong>Step 1:</strong> Check your email and click the verification link.<br />
            <strong>Step 2:</strong> After email verification, wait for admin approval.
          </p>
          <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#7c6200', marginBottom: '1.5rem' }}>
            🔔 You can log in only after both email verification and admin approval are complete.
          </div>
          <button className={styles.submitBtn} onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
        <Footer />
      </div>
    )
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
        <div className={styles.tabs}>
          {['student', 'donor', 'admin'].map(r => (
            <button key={r} type="button"
              className={`${styles.tab} ${role === r ? styles.tabActive : ''}`}
              onClick={() => setRole(r)}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {error && <div className={styles.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>

          {role === 'student' && (<>
            <F label="Full Name">
              <IW icon="👤" placeholder="Full Name" value={student.fullName} onChange={e => setStudent(prev => ({...prev, fullName: e.target.value}))} required />
            </F>
            <F label="Registration No">
              <IW icon="✉️" placeholder="e.g. 2024/CS/001" value={student.registrationNo} onChange={e => setStudent(prev => ({...prev, registrationNo: e.target.value}))} required />
            </F>
            <F label="Batch">
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>🎓</span>
                <select
                  className={styles.input}
                  value={student.batch}
                  onChange={e => setStudent(prev => ({ ...prev, batch: e.target.value }))}
                  required
                >
                  <option value="">Select batch</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                </select>
              </div>
            </F>
            <div className={styles.row2}>
              <F label="Email">
                <IW icon="✉️" placeholder="Email" type="email" value={student.email} onChange={e => setStudent(prev => ({...prev, email: e.target.value}))} required />
              </F>
              <F label="Phone">
                <IW icon="📞" placeholder="Phone" value={student.phone} onChange={e => setStudent(prev => ({...prev, phone: e.target.value}))} />
              </F>
            </div>
            <F label="Password">
              <IW icon="🔒" placeholder="Password" value={student.password} onChange={e => setStudent(prev => ({...prev, password: e.target.value}))} required showToggle show={showPw} onToggle={() => setShowPw(p => !p)} />
            </F>
            <F label="Confirm Password">
              <IW icon="🔒" placeholder="Confirm password" value={student.confirm} onChange={e => setStudent(prev => ({...prev, confirm: e.target.value}))} required showToggle show={showCpw} onToggle={() => setShowCpw(p => !p)} />
            </F>
          </>)}

          {role === 'donor' && (<>
            <F label="Donor/Organization Name">
              <IW icon="👤" placeholder="Donor or Organization Name" value={donor.donorName} onChange={e => setDonor(prev => ({...prev, donorName: e.target.value}))} required />
            </F>
            <F label="Email">
              <IW icon="✉️" placeholder="Email" type="email" value={donor.email} onChange={e => setDonor(prev => ({...prev, email: e.target.value}))} required />
            </F>
            <div className={styles.row2}>
              <F label="Phone">
                <IW icon="✉️" placeholder="Phone" value={donor.phone} onChange={e => setDonor(prev => ({...prev, phone: e.target.value}))} required />
              </F>
              <F label="Organization">
                <IW icon="📞" placeholder="Organization" value={donor.orgName} onChange={e => setDonor(prev => ({...prev, orgName: e.target.value}))} />
              </F>
            </div>
            <F label="Password">
              <IW icon="🔒" placeholder="Password" value={donor.password} onChange={e => setDonor(prev => ({...prev, password: e.target.value}))} required showToggle show={showPw} onToggle={() => setShowPw(p => !p)} />
            </F>
            <F label="Confirm Password">
              <IW icon="🔒" placeholder="Confirm password" value={donor.confirm} onChange={e => setDonor(prev => ({...prev, confirm: e.target.value}))} required showToggle show={showCpw} onToggle={() => setShowCpw(p => !p)} />
            </F>
          </>)}

          {role === 'admin' && (<>
            <F label="Full Name">
              <IW icon="👤" placeholder="Full Name" value={admin.fullName} onChange={e => setAdmin(prev => ({...prev, fullName: e.target.value}))} required />
            </F>
            <div className={styles.row2}>
              <F label="Staff ID">
                <IW icon="🪪" placeholder="STF-0001" value={admin.staffId} onChange={e => setAdmin(prev => ({...prev, staffId: e.target.value}))} required />
              </F>
              <F label="Department">
                <IW icon="🏛️" placeholder="Department" value={admin.department} onChange={e => setAdmin(prev => ({...prev, department: e.target.value}))} required />
              </F>
            </div>
            <F label="Email">
              <IW icon="✉️" placeholder="admin@university.lk" type="email" value={admin.email} onChange={e => setAdmin(prev => ({...prev, email: e.target.value}))} required />
            </F>
            <F label="Password">
              <IW icon="🔒" placeholder="Password" value={admin.password} onChange={e => setAdmin(prev => ({...prev, password: e.target.value}))} required showToggle show={showPw} onToggle={() => setShowPw(p => !p)} />
            </F>
            <F label="Confirm Password">
              <IW icon="🔒" placeholder="Confirm password" value={admin.confirm} onChange={e => setAdmin(prev => ({...prev, confirm: e.target.value}))} required showToggle show={showCpw} onToggle={() => setShowCpw(p => !p)} />
            </F>
          </>)}

          <button className={styles.submitBtn} disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className={styles.backLink}><Link to="/login">Back to login</Link></p>
      </div>

      <Footer />
    </div>
  )
}
