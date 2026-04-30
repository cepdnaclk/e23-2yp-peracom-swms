import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/dashboard/Layout';
import { supabase } from '../services/supabaseClient';
import styles from './ApplyPage.module.css';

const STEPS = ['Personal Info', 'Academic Details', 'Document Upload', 'Review & Submit'];

export default function ApplyPage() {
    useEffect(() => {
      if (isSubmitted) {
        const timer = setTimeout(() => {
          navigate('/dashboard');
        }, 2000); // 2 seconds
        return () => clearTimeout(timer);
      }
    }, [isSubmitted, navigate]);
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [scholarship, setScholarship] = useState(null);
  const [loadingTop, setLoadingTop] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const [personal, setPersonal] = useState({
    dob: '',
    gender: '',
    address: '',
  });
  const [academic, setAcademic] = useState({
    university: '',
    major: '',
    gpa: '',
  });
  const [files, setFiles] = useState({ grades: null, id_card: null, essay: null });
  const [fileErrors, setFileErrors] = useState({});

  useEffect(() => {
    async function loadData() {
      setLoadingTop(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
        
        const res = await fetch(`/api/scholarships/${id}`, { headers });
        if (res.ok) {
          const payload = await res.json();
          setScholarship(payload.scholarship);
        }
      } catch (err) {
        console.error('Failed to load scholarship for application', err);
      } finally {
        setLoadingTop(false);
      }
    }
    loadData();
  }, [id]);

  function validateFile(file, fieldName) {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (!allowed.includes(file.type)) return `${fieldName}: Only PDF, JPG, PNG allowed`;
    if (file.size > maxSize) return `${fieldName}: File must be under 10MB`;
    return null;
  }

  function handleFileChange(key, file) {
    if (!file) return;
    const err = validateFile(file, key);
    if (err) {
      setFileErrors((prev) => ({ ...prev, [key]: err }));
      return;
    }
    setFileErrors((prev) => ({ ...prev, [key]: null }));
    setFiles((prev) => ({ ...prev, [key]: file }));
  }

  function validateStep() {
    const errs = {};
    if (step === 0) {
      if (!personal.dob) errs.dob = 'Required';
      if (!personal.gender) errs.gender = 'Required';
      if (!personal.address) errs.address = 'Required';
    }
    if (step === 1) {
      if (!academic.university) errs.university = 'Required';
      if (!academic.major) errs.major = 'Required';
      if (!academic.gpa) errs.gpa = 'Required';
    }
    if (step === 2) {
      if (!files.grades) errs.grades = 'Required';
      if (!files.id_card) errs.id_card = 'Required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function nextStep() {
    if (validateStep()) setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setSubmitLoading(true);
    try {
      //Check Security (Get Token) 
      // still logged in before submitting, as this can take time and they might have been logged out
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");
         
      //Start a 30-Second Timeout Clock to Prevent Endless Waiting
      // Use absolute fallback URL automatically if standard proxy route fails
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

//React sends data as raw JSON text.
//  But you cannot send physical files in pure JSON.
      // objects  turns them  into text strings (JSON.stringify),
      const formData = new FormData();
      formData.append('scholarship_id', id);
      formData.append('personal_info', JSON.stringify(personal));
      formData.append('academic_info', JSON.stringify(academic));

      if (files.grades) formData.append('grades', files.grades);
      if (files.id_card) formData.append('id_card', files.id_card);
      if (files.essay) formData.append('essay', files.essay);

      //Send it to the Backend

      const res = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeout);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to submit application');
      
      setIsSubmitted(true);
    } catch (err) {
      const msg = err?.name === 'AbortError'
        ? 'Request timed out. Please try again.'
        : err.message;
      alert('Submission failed: ' + msg);
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <Layout>
      <div className={styles.page}>
        <button
          className={styles.back}
          onClick={() => navigate(`/scholarships/${id}`)}
        >
          ← Back
        </button>
        <h1>Apply for {scholarship?.title}</h1>

        {isSubmitted ? (
          <div className={styles.formCard} style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '4rem', color: '#10b981', marginBottom: '1rem' }}>✅</div>
            <h2>Application Submitted Successfully!</h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.5rem', marginBottom: '2rem' }}>
              Your application for <strong>{scholarship?.title}</strong> has been received and is now pending review.<br/>
              Redirecting to your dashboard...
            </p>
          </div>
        ) : (
          <>
            <div className={styles.stepper}>
              {STEPS.map((label, i) => (
                <div
                  key={i}
                  className={`${styles.step} ${i === step ? styles.active : ''} ${i < step ? styles.done : ''}`}
                >
                  <div className={styles.stepCircle}>{i < step ? '✓' : i + 1}</div>
                  <span>{label}</span>
                  {i < STEPS.length - 1 && <div className={styles.stepLine} />}
                </div>
              ))}
            </div>

        <div className={styles.formCard}>
          {step === 0 && (
            <div className={styles.formGrid}>
              <h2>Personal Information</h2>
              <div className={styles.field}>
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={personal.dob}
                  onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
                />
                {errors.dob && <span className={styles.err}>{errors.dob}</span>}
              </div>

              <div className={styles.field}>
                <label>Gender</label>
                <select
                  value={personal.gender}
                  onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.375rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select Gender...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.gender && <span className={styles.err}>{errors.gender}</span>}
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label>Address</label>
                <textarea
                  rows={3}
                  value={personal.address}
                  onChange={(e) =>
                    setPersonal({ ...personal, address: e.target.value })
                  }
                />
                {errors.address && <span className={styles.err}>{errors.address}</span>}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className={styles.formGrid}>
              <h2>Academic Details</h2>
              <div className={styles.field}>
                <label>School / University</label>
                <select
                  value={academic.university}
                  onChange={(e) => setAcademic({ ...academic, university: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', backgroundColor: 'white' }}
                >
                  <option value="">Select University...</option>
                  <option value="University of Colombo">University of Colombo</option>
                  <option value="University of Peradeniya">University of Peradeniya</option>
                  <option value="University of Moratuwa">University of Moratuwa</option>
                  <option value="University of Kelaniya">University of Kelaniya</option>
                  <option value="University of Sri Jayewardenepura">University of Sri Jayewardenepura</option>
                  <option value="University of Ruhuna">University of Ruhuna</option>
                  <option value="Other">Other</option>
                </select>
                {errors.university && <span className={styles.err}>{errors.university}</span>}
              </div>

              <div className={styles.field}>
                <label>Major / Program</label>
                <select
                  value={academic.major}
                  onChange={(e) => setAcademic({ ...academic, major: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', backgroundColor: 'white' }}
                >
                  <option value="">Select Major...</option>
                  <option value="Computer engineering">Computer engineering</option>
                  <option value="Civil engineering">Civil engineering</option>
                  <option value="Industrial and manufacturing engineering">Industrial and manufacturing engineering</option>
                  <option value="Mechanical engineering">Mechanical engineering</option>
                  <option value="Electrical engineering">Electrical engineering</option>
                  <option value="Other">Other</option>
                </select>
                {errors.major && <span className={styles.err}>{errors.major}</span>}
              </div>

              <div className={styles.field}>
                <label>GPA</label>
                <input
                  type="text"
                  value={academic.gpa}
                  onChange={(e) => setAcademic({ ...academic, gpa: e.target.value })}
                />
                {errors.gpa && <span className={styles.err}>{errors.gpa}</span>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.formGrid}>
              <h2>Document Upload</h2>
              <div className={styles.field}>
                <label>Recent Grades (PDF/Image) *</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFileChange('grades', e.target.files[0])} />
                {errors.grades && <span className={styles.err}>{errors.grades}</span>}
                {fileErrors.grades && <span className={styles.err}>{fileErrors.grades}</span>}
              </div>
              <div className={styles.field}>
                <label>ID Card (PDF/Image) *</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFileChange('id_card', e.target.files[0])} />
                {errors.id_card && <span className={styles.err}>{errors.id_card}</span>}
                {fileErrors.id_card && <span className={styles.err}>{fileErrors.id_card}</span>}
              </div>
              <div className={styles.field}>
                <label>Essay (Optional)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFileChange('essay', e.target.files[0])} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.formGrid}>
              <h2>Review & Submit</h2>
              <p>Please review your information carefully before submitting.</p>
              <ul style={{ lineHeight: '1.8' }}>
                <li><strong>Personal:</strong> {personal.dob}, {personal.gender}</li>
                <li><strong>Academic:</strong> {academic.university}, {academic.major}, {academic.gpa}</li>
                <li><strong>Docs Attached:</strong> {files.grades ? 'Grades, ' : ''} {files.id_card ? 'ID' : ''}</li>
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
            {step > 0 && (
              <button 
                className={styles.secondaryBtn} 
                onClick={() => setStep(s => s - 1)}
                style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                Back
              </button>
            )}
            
            {step < STEPS.length - 1 ? (
              <button 
                className={styles.primaryBtn} 
                onClick={nextStep}
                style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                Next
              </button>
            ) : (
              <button 
                className={styles.primaryBtn} 
                onClick={handleSubmit} 
                disabled={submitLoading}
                style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                {submitLoading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </Layout>
  );
}