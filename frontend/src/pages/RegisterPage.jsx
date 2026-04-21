import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Footer from '../components/Footer'
import styles from './RegisterPage.module.css'
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function getPasswordStrength(password) {
  if (password.length < 8) return 'Too short';
  if (!/[A-Z]/.test(password)) return 'Weak';
  if (!/[0-9]/.test(password)) return 'Weak';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Medium';
  return 'Strong';
}

function IW({  placeholder, type = 'text', value, onChange, required, 
  showToggle, show, onToggle, showStrength, matchWith ,  maxLength }) {

  const strength = showStrength ? getPasswordStrength(value) : null;
  const match = matchWith !== undefined ? value === matchWith : null;
  return (
    <div className={styles.inputWrap}>
      
      <input
        type={showToggle ? (show ? 'text' : 'password') : type}
        placeholder={placeholder} value={value} onChange={onChange}
        required={required} className={styles.input} />
      {showToggle && (
        <button type="button" className={styles.eyeBtn} onClick={onToggle}>
          {show ? <FaEyeSlash /> : <FaEye />}
        </button>
      )}
        {showStrength && value && (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      backgroundColor:
        strength === 'Strong'
          ? '#fbfdf9'
          : strength === 'Medium'
          ? '#fffbe6'
          : '#fdeaea',
      color:
        strength === 'Strong'
          ? '#34c83b'
          : strength === 'Medium'
          ? '#b59f00'
          : '#e04848',
      fontWeight: 'bold',
      fontSize: '1rem',
      borderRadius: '1.2em',
      padding: '0.2em 0.9em',
      marginTop: '0.4em',
      marginBottom: '0.2em',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      letterSpacing: '0.5px',
      gap: '0.5em',
      border: 'none',
      width: 'fit-content',
    }}
  >
    {strength === 'Strong' && (
      <>
        Strong <span style={{ fontSize: '0.8em', marginLeft: '0.2em' }}></span>
      </>
    )}
    {strength === 'Medium' && <>Medium</>}
    {strength === 'Weak' && <>Weak</>}
    {strength === 'Too short' && <>Too short</>}
  </div>
)}
      {matchWith !== undefined && value && (
        <div style={{
          fontSize: '0.9em',
          color: match ? 'green' : 'red'
        }}>
          {match ? 'Passwords match' : 'Passwords do not match'}
        </div>
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
  const [countryCode, setCountryCode] = useState('+94');

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
              <IW  placeholder="e.g. John Doe" value={student.fullName} onChange={e => setStudent(prev => ({...prev, fullName: e.target.value}))} required />
            </F>
            <F label="Registration No">
              <IW  placeholder="e.g. E/xx/xxx" value={student.registrationNo} onChange={e => setStudent(prev => ({...prev, registrationNo: e.target.value}))} required />
            </F>
            <F label="Batch">
              <div className={styles.inputWrap}>
               
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
                <IW  placeholder="Email" type="email" value={student.email} onChange={e => setStudent(prev => ({...prev, email: e.target.value}))} required />
              </F>
              <F label="Phone">
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                    style={{ width: '5rem' }}
                  >
                    <option value="+94">+94 (LK)</option>
                    
                  </select>
                  <IW  type="tel" placeholder="Phone" value={student.phone} onChange={e => {
                        const val = e.target.value.replace(/\D/g, ''); // Only digits
                        if (val.length <= 10) {
                          setStudent(prev => ({ ...prev, phone: val }));}}} 
                          required maxLength={10}  />
                </div>
              </F>
            </div>
            <F label="Password">
              <IW  placeholder="Password" value={student.password} onChange={e => setStudent(prev => ({...prev, password: e.target.value}))} required showToggle show={showPw} onToggle={() => setShowPw(p => !p)} showStrength/>
            </F>
            <F label="Confirm Password">
              <IW  placeholder="Confirm password" value={student.confirm} onChange={e => setStudent(prev => ({...prev, confirm: e.target.value}))} required showToggle show={showCpw} onToggle={() => setShowCpw(p => !p)} matchWith={student.password} />
            </F>
          </>)}

          {role === 'donor' && (<>
            <F label="Donor/Organization Name">
              <IW  placeholder="Donor or Organization Name" value={donor.donorName} onChange={e => setDonor(prev => ({...prev, donorName: e.target.value}))} required />
            </F>
            <F label="Email">
              <IW  placeholder="Email" type="email" value={donor.email} onChange={e => setDonor(prev => ({...prev, email: e.target.value}))} required />
            </F>
            <div className={styles.row2}>
              <F label="Phone">
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                    style={{ width: '5rem' }}
                  >
                    <option value="+94">+94 (LK)</option>
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US)</option>
                    {/* Add more as needed */}
                  </select>
                  <IW  type="tel" placeholder="Phone" value={donor.phone} onChange={e => setDonor(prev => ({...prev, phone: e.target.value}))} required  maxLength={10} />
                </div>
              </F>
              <F label="Organization">
                <IW  placeholder="Organization" value={donor.orgName} onChange={e => setDonor(prev => ({...prev, orgName: e.target.value}))} required />
              </F>
            </div>
            <F label="Password">
              <IW  placeholder="Password" value={donor.password} onChange={e => setDonor(prev => ({...prev, password: e.target.value}))} required showToggle show={showPw} onToggle={() => setShowPw(p => !p)} showStrength />
            </F>
            <F label="Confirm Password">
              <IW  placeholder="Confirm password" value={donor.confirm} onChange={e => setDonor(prev => ({...prev, confirm: e.target.value}))} required showToggle show={showCpw} onToggle={() => setShowCpw(p => !p)} matchWith={donor.password} />
            </F>
          </>)}

          {role === 'admin' && (<>
            <F label="Full Name">
              <IW placeholder="Full Name" value={admin.fullName} onChange={e => setAdmin(prev => ({...prev, fullName: e.target.value}))} required />
            </F>
            <div className={styles.row2}>
              <F label="Staff ID">
                <IW placeholder="STF-0001" value={admin.staffId} onChange={e => setAdmin(prev => ({...prev, staffId: e.target.value}))} required />
              </F>
              <F label="Department">
                <IW placeholder="Department" value={admin.department} onChange={e => setAdmin(prev => ({...prev, department: e.target.value}))} required />
              </F>
            </div>
            <F label="Email">
               
              <IW placeholder="admin@university.lk" type="email" value={admin.email} onChange={e => setAdmin(prev => ({...prev, email: e.target.value}))} required />
            </F>
            <F label="Password">
              <IW placeholder="Password" value={admin.password} onChange={e => setAdmin(prev => ({...prev, password: e.target.value}))} required showToggle show={showPw} onToggle={() => setShowPw(p => !p)} showStrength />
            </F>
            <F label="Confirm Password">
              <IW placeholder="Confirm password" value={admin.confirm} onChange={e => setAdmin(prev => ({...prev, confirm: e.target.value}))} required showToggle show={showCpw} onToggle={() => setShowCpw(p => !p)} matchWith={admin.password} />
            </F>
          </>)}
{/* The button is disabled if loading, any required field is empty,
 the password is not strong, or the passwords do not match */}

          <button
            className={styles.submitBtn}
            disabled={
              loading ||
              (role === 'student' && (
                !student.fullName ||
                !student.registrationNo ||
                !student.batch ||
                !student.email ||
                !student.password ||
                !student.confirm ||
                getPasswordStrength(student.password) !== 'Strong' ||
                student.password !== student.confirm
              )) ||
              (role === 'donor' && (
                !donor.donorName ||
                !donor.email ||
                !donor.phone ||
                !donor.password ||
                !donor.confirm ||
                getPasswordStrength(donor.password) !== 'Strong' ||
                donor.password !== donor.confirm
              )) ||
              (role === 'admin' && (
                !admin.fullName ||
                !admin.staffId ||
                !admin.department ||
                !admin.email ||
                !admin.password ||
                !admin.confirm ||
                getPasswordStrength(admin.password) !== 'Strong' ||
                admin.password !== admin.confirm
              ))
            }
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className={styles.backLink}><Link to="/login">Back to login</Link></p>
      </div>

      <Footer />
    </div>
  )
}
