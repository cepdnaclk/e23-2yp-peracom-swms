import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/dashboard/Layout';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import styles from './ApplyPage.module.css';

const STEPS = ['Student Information', 'Documents', 'Financial Information', 'Review & Submit'];

const DEPARTMENT_OPTIONS = [
  'Computer Engineering',
  'Industrial and manufacturing Engineering',

  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Other'
];

const YEAR_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
];

export default function ApplyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [scholarship, setScholarship] = useState(null);
  const [loadingTop, setLoadingTop] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Redirect to dashboard a short while after successful submission
    if (isSubmitted) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, navigate]);

  const [studentInfo, setStudentInfo] = useState({
    full_name: '',
    student_id: '',
    department: '',
    current_year: '',
    university: '',
    gpa: '',
  });
  const [financialInfo, setFinancialInfo] = useState({
    monthly_household_income: '',
    parent_occupation: '',
    dependents: '',
  });
  const [files, setFiles] = useState({ grades: null, transcript: null, income_certificate: null, essay: null });
  const [fileErrors, setFileErrors] = useState({});

  useEffect(() => {
    const extra = profile?.extra_info && typeof profile.extra_info === 'object' ? profile.extra_info : {};
    const fullName = profile?.full_name || '';
    const studentId = extra.registration_no || profile?.id || '';

    setStudentInfo((prev) => ({
      ...prev,
      full_name: fullName,
      student_id: studentId,
    }));
  }, [profile]);

  useEffect(() => {
    async function loadData() {
      setLoadingTop(true);
      setFetchError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        // If user is not authenticated, redirect to login so they can sign in before applying
        if (!session?.access_token) {
          setFetchError('You must be logged in to apply. Redirecting to login...');
          setLoadingTop(false);
          // small delay so user sees message briefly, then redirect
          setTimeout(() => navigate('/login'), 700);
          return;
        }

        const headers = { Authorization: `Bearer ${session.access_token}` };

        const res = await fetch(`/api/scholarships/${id}`, { headers });
        if (res.ok) {
          const payload = await res.json();
          if (payload && payload.scholarship) {
            setScholarship(payload.scholarship);
          } else {
            setFetchError('Scholarship not found.');
          }
        } else {
          setFetchError('Failed to fetch scholarship.');
        }
      } catch (err) {
        console.error('Failed to load scholarship for application', err);
        setFetchError('Failed to load scholarship for application');
      } finally {
        setLoadingTop(false);
      }
    }
    loadData();
  }, [id]);

  function validateFile(file, fieldName, allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (!allowed.includes(file.type)) return `${fieldName}: Only PDF, JPG, PNG allowed`;
    if (file.size > maxSize) return `${fieldName}: File must be under 10MB`;
    return null;
  }

  function handleFileChange(key, file, allowedTypes) {
    if (!file) return;
    const err = validateFile(file, key, allowedTypes);
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
      if (!studentInfo.full_name) errs.full_name = 'Required';
      if (!studentInfo.student_id) errs.student_id = 'Required';
      if (!studentInfo.department) errs.department = 'Required';
      if (!studentInfo.current_year) errs.current_year = 'Required';
      if (!studentInfo.university) errs.university = 'Required';
      if (!studentInfo.gpa) errs.gpa = 'Required';
    }
    if (step === 1) {
      if (!files.transcript) errs.transcript = 'Required';
      if (!files.grades) errs.grades = 'Required';
    }
    if (step === 2) {
      if (!financialInfo.monthly_household_income) errs.monthly_household_income = 'Required';
      if (!financialInfo.parent_occupation) errs.parent_occupation = 'Required';
      if (!financialInfo.dependents) errs.dependents = 'Required';
      if (!files.income_certificate) errs.income_certificate = 'Required';
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
      formData.append('student_info', JSON.stringify({
        full_name: studentInfo.full_name,
        student_id: studentInfo.student_id,
      }));
      formData.append('academic_info', JSON.stringify({
        department: studentInfo.department,
        current_year: studentInfo.current_year,
        university: studentInfo.university,
        gpa: studentInfo.gpa,
      }));
      formData.append('financial_info', JSON.stringify(financialInfo));

      if (files.grades) formData.append('grades', files.grades);
      if (files.transcript) formData.append('transcript', files.transcript);
      if (files.income_certificate) formData.append('income_certificate', files.income_certificate);
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
        {loadingTop ? (
          <div style={{ padding: '2rem' }}>Loading scholarship...</div>
        ) : fetchError ? (
          <div style={{ color: 'red', padding: '2rem' }}>{fetchError}</div>
        ) : !scholarship ? (
          <div style={{ color: 'red', padding: '2rem' }}>Scholarship not found.</div>
        ) : (
          <>
            <button
              className={styles.back}
              onClick={() => navigate(`/scholarships/${id}`)}
            >
              ← Back
            </button>
            <h1>Apply for {scholarship.title}</h1>

            {isSubmitted ? (
              <div className={styles.formCard} style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div style={{ fontSize: '4rem', color: '#10b981', marginBottom: '1rem' }}>✅</div>
                <h2>Application Submitted Successfully!</h2>
                <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.5rem', marginBottom: '2rem' }}>
                  Your application for <strong>{scholarship.title}</strong> has been received and is now pending review.<br/>
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
                      <h2>Student Information</h2>

                      <div className={styles.field}>
                        <label>Full Name (NIC / Student ID)</label>
                        <input type="text" value={studentInfo.full_name} readOnly />
                        {errors.full_name && <span className={styles.err}>{errors.full_name}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Student ID Number</label>
                        <input type="text" value={studentInfo.student_id} readOnly />
                        {errors.student_id && <span className={styles.err}>{errors.student_id}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Department </label>
                        <select
                          value={studentInfo.department}
                          onChange={(e) => setStudentInfo({ ...studentInfo, department: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', backgroundColor: 'white' }}
                        >
                          <option value="">Select Department...</option>
                          {DEPARTMENT_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        {errors.department && <span className={styles.err}>{errors.department}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Current Year of Study</label>
                        <select
                          value={studentInfo.current_year}
                          onChange={(e) => setStudentInfo({ ...studentInfo, current_year: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', backgroundColor: 'white' }}
                        >
                          <option value="">Select Year...</option>
                          {YEAR_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        {errors.current_year && <span className={styles.err}>{errors.current_year}</span>}
                      </div>

                      <div className={styles.field}>
                        <label> University</label>
                        <select
                          value={studentInfo.university}
                          onChange={(e) => setStudentInfo({ ...studentInfo, university: e.target.value })}
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
                        <label>Latest GPA </label>
                        <input
                          type="text"
                          value={studentInfo.gpa}
                          onChange={(e) => setStudentInfo({ ...studentInfo, gpa: e.target.value })}
                        />
                        {errors.gpa && <span className={styles.err}>{errors.gpa}</span>}
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className={styles.formGrid}>
                      <h2>Document Upload</h2>
                      <div className={styles.field}>
                        <label>Academic Transcript (PDF) *</label>
                        <input type="file" accept=".pdf" onChange={e => handleFileChange('transcript', e.target.files[0], ['application/pdf'])} />
                        {errors.transcript && <span className={styles.err}>{errors.transcript}</span>}
                        {fileErrors.transcript && <span className={styles.err}>{fileErrors.transcript}</span>}
                      </div>
                      <div className={styles.field}>
                        <label>Grades / Result Slip *</label>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFileChange('grades', e.target.files[0])} />
                        {errors.grades && <span className={styles.err}>{errors.grades}</span>}
                        {fileErrors.grades && <span className={styles.err}>{fileErrors.grades}</span>}
                      </div>
                      <div className={styles.field}>
                        <label>Essay (Optional)</label>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFileChange('essay', e.target.files[0])} />
                        {fileErrors.essay && <span className={styles.err}>{fileErrors.essay}</span>}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className={styles.formGrid}>
                      <h2>Financial Information</h2>
                      <div className={styles.field}>
                        <label>Total Monthly Household Income</label>
                        <input
                          type="number"
                          min="0"
                          value={financialInfo.monthly_household_income}
                          onChange={(e) => setFinancialInfo({ ...financialInfo, monthly_household_income: e.target.value })}
                        />
                        {errors.monthly_household_income && <span className={styles.err}>{errors.monthly_household_income}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Parent / Guardian Occupation</label>
                        <input
                          type="text"
                          value={financialInfo.parent_occupation}
                          onChange={(e) => setFinancialInfo({ ...financialInfo, parent_occupation: e.target.value })}
                        />
                        {errors.parent_occupation && <span className={styles.err}>{errors.parent_occupation}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Number of Dependents in Family</label>
                        <input
                          type="number"
                          min="0"
                          value={financialInfo.dependents}
                          onChange={(e) => setFinancialInfo({ ...financialInfo, dependents: e.target.value })}
                        />
                        {errors.dependents && <span className={styles.err}>{errors.dependents}</span>}
                      </div>

                      <div className={styles.field}>
                        <label>Income Verification Certificate (PDF) *</label>
                        <input type="file" accept=".pdf" onChange={e => handleFileChange('income_certificate', e.target.files[0], ['application/pdf'])} />
                        {errors.income_certificate && <span className={styles.err}>{errors.income_certificate}</span>}
                        {fileErrors.income_certificate && <span className={styles.err}>{fileErrors.income_certificate}</span>}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className={styles.formGrid}>
                      <h2>Review & Submit</h2>
                      <p>Please review your information carefully before submitting.</p>
                      <ul style={{ lineHeight: '1.8' }}>
                        <li><strong>Student:</strong> {studentInfo.full_name}, {studentInfo.student_id}</li>
                        <li><strong>Study:</strong> {studentInfo.department}, {studentInfo.current_year}</li>
                        <li><strong>Academic:</strong> {studentInfo.university}, {studentInfo.gpa}</li>
                        <li><strong>Financial:</strong> {financialInfo.monthly_household_income}, {financialInfo.parent_occupation}, {financialInfo.dependents}</li>
                        <li><strong>Docs Attached:</strong> {files.transcript ? 'Transcript, ' : ''}{files.grades ? 'Grades, ' : ''}{files.income_certificate ? 'Income Certificate, ' : ''}{files.essay ? 'Essay' : ''}</li>
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
          </>
        )}
      </div>
    </Layout>
  );
}