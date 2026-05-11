import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import Layout from '../components/dashboard/Layout';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import styles from './ApplyPage.module.css';


const STEPS = ['Student Information', 'Documents', 'Review & Submit'];


const YEAR_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
];

export default function ApplyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, loading: profileLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [scholarship, setScholarship] = useState(null);
  const [loadingTop, setLoadingTop] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [errors, setErrors] = useState({});

  // Extract editAppId from URL query params
  const searchParams = new URLSearchParams(location.search);
  const editAppId = searchParams.get('editAppId');
  const [resubmissionLimitReached, setResubmissionLimitReached] = useState(false);

  // Resubmission UX
  const [editApplication, setEditApplication] = useState(null);
  const [editAppError, setEditAppError] = useState(null);

  useEffect(() => {
    console.log('🔗 ApplyPage loaded - editAppId from URL:', editAppId, 'scholarship_id:', id);
  }, [editAppId, id]);

  useEffect(() => {
    let active = true;
    async function loadEditApplication() {
      if (!editAppId) return;
      setEditApplication(null);
      setEditAppError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setEditAppError('Not authenticated.');
          return;
        }

        const res = await fetch(`/api/applications/${editAppId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error || 'Failed to load application');

        if (!active) return;
        setEditApplication(payload.application || payload);
        
        // Check resubmission limit
        if (payload.application && (payload.application.resubmission_count ?? 0) >= 3) {
          setResubmissionLimitReached(true);
        }
      } catch (e) {
        if (!active) return;
        setEditAppError(e?.message || 'Failed to load application');
      }
    }

    loadEditApplication();
    return () => {
      active = false;
    };
  }, [editAppId]);



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
    current_year: '',
  });
  const [files, setFiles] = useState({ id_card: null, income_certificate: null, bank_account: null });
  const [fileErrors, setFileErrors] = useState({});
  const [filesPreview, setFilesPreview] = useState({ id_card: null, income_certificate: null, bank_account: null });
  const [replaceFile, setReplaceFile] = useState({ id_card: false, income_certificate: false, bank_account: false });

  const basename = (url) => {
    if (!url) return '';
    try {
      const parts = url.split('/');
      return parts[parts.length - 1].split('?')[0];
    } catch (e) {
      return url;
    }
  };

  useEffect(() => {
    // If we're in edit/resubmit mode, prefer loading values from the existing
    // application (set below in an effect that watches `editApplication`).
    if (editAppId) return;

    const extra = profile?.extra_info && typeof profile.extra_info === 'object' ? profile.extra_info : {};
    const fullName = profile?.full_name || '';
    const studentId = extra.registration_no || profile?.id || '';

    setStudentInfo((prev) => ({
      ...prev,
      full_name: fullName,
      student_id: studentId,
    }));
  }, [profile]);


  // When loading an existing (rejected) application for resubmission,
  // pre-fill the form fields from that application so the student sees
  // exactly what they submitted earlier and can edit fields.
  useEffect(() => {
    if (!editApplication) return;

    try {
      console.log('Loaded editApplication for resubmit:', editApplication);
      const personal = editApplication.personal_info || editApplication.student_info || {};
      const academic = editApplication.academic_info || {};
      setStudentInfo((prev) => ({
        ...prev,
        full_name: personal.full_name || academic.full_name || prev.full_name || '',
        student_id: personal.student_id || academic.student_id || prev.student_id || '',
        current_year: academic.current_year || prev.current_year || '',
      }));
    } catch (e) {
      console.error('Failed to prefill from editApplication', e);
    }
    // populate previous file previews (filenames/urls)
    try {
      const urls = editApplication.document_urls || editApplication.documentUrl || editApplication.documents || {};
      setFilesPreview({
        id_card: urls.id_card_url || urls.id_card || urls.idCard || null,
        income_certificate: urls.income_certificate_url || urls.income_certificate || urls.incomeCertificate || null,
        bank_account: urls.bank_account_url || urls.bank_account || urls.bankAccount || null,
      });
    } catch (e) {
      console.error('Failed to set filesPreview', e);
    }
  }, [editApplication]);

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
      if (!studentInfo.current_year) errs.current_year = 'Required';
    }

    if (step === 1) {
      if (editAppId) {
        // Resubmission: consider existing uploaded documents as fulfilling requirement
        const hasAny = !!(
          files.id_card || files.income_certificate || files.bank_account ||
          filesPreview.id_card || filesPreview.income_certificate || filesPreview.bank_account
        );
        if (!hasAny) {
          errs.id_card = 'Upload at least one document to resubmit.'
        }
      } else {
        // Create mode: all required docs
        if (!files.id_card) errs.id_card = 'Required';
        if (!files.income_certificate) errs.income_certificate = 'Required';
        if (!files.bank_account) errs.bank_account = 'Required';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }


  function nextStep() {
    if (validateStep()) setStep((s) => s + 1);
  }

  async function handleSubmit() {

    if (resubmissionLimitReached) {
      alert('Resubmission limit reached. You cannot resubmit this application.');
      return;
    }

    setSubmitLoading(true);
    try {
      //Check Security (Get Token)
      // still logged in before submitting, as this can take time and they might have been logged out
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      // Start a timeout to prevent endless waiting
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const formData = new FormData();

      // In resubmission mode we only care about replacing docs.
      // In create mode we keep old behavior.
      if (editAppId) {
        console.log('📝 Submitting resubmission for app:', editAppId);
        // Only upload files the student provided
        if (files.id_card) formData.append('id_card', files.id_card);
        if (files.income_certificate) formData.append('income_certificate', files.income_certificate);
        if (files.bank_account) formData.append('bank_account', files.bank_account);

        const res = await fetch(`/api/applications/resubmit/${editAppId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeout);
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error('❌ Resubmit failed:', payload);
          throw new Error(payload.error || 'Failed to resubmit application');
        }

        console.log('✅ Resubmit succeeded:', payload);
        setIsSubmitted(true);
        return;
      }

      // Create mode
      console.log('📝 Submitting new application for scholarship:', id);
      formData.append('scholarship_id', id);
      formData.append('student_info', JSON.stringify({
        full_name: studentInfo.full_name,
        student_id: studentInfo.student_id,
        current_year: studentInfo.current_year,
      }));
      if (files.id_card) formData.append('id_card', files.id_card);
      if (files.income_certificate) formData.append('income_certificate', files.income_certificate);
      if (files.bank_account) formData.append('bank_account', files.bank_account);

      const res = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeout);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('❌ Submit failed:', payload);
        throw new Error(payload.error || 'Failed to submit application');
      }

      console.log('✅ Submit succeeded:', payload);
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
            {editAppError && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
                <strong>Error loading application:</strong> {editAppError}
              </div>
            )}
            
            <button
              className={styles.back}
              onClick={() => navigate(editAppId ? '/applications' : `/scholarships/${id}`)}
            >
              ← Back
            </button>
            <h1>{editAppId ? '📝 Resubmit Application' : `Apply for ${scholarship.title}`}</h1>

            {editAppId && (
              <div style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
                <strong>📋 Resubmission Mode:</strong> Update and resubmit your rejected application. You can resubmit up to 3 times.
                
                {!editAppError && editApplication && (
                  <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #fcd34d' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>❌ Rejection Reason:</div>
                    <div style={{ fontSize: '0.9rem', color: '#92400e', whiteSpace: 'pre-wrap' }}>
                      {editApplication?.rejection_reason || 'No rejection reason provided.'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isSubmitted ? (
              <div className={styles.formCard} style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div style={{ fontSize: '4rem', color: '#10b981', marginBottom: '1rem' }}>✅</div>
                <h2>{editAppId ? 'Application Resubmitted Successfully!' : 'Application Submitted Successfully!'}</h2>
                <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.5rem', marginBottom: '2rem' }}>
                  Your application for <strong>{scholarship.title}</strong> has been {editAppId ? 'resubmitted' : 'received'} and is now pending review.<br/>
                  Redirecting to your dashboard...
                </p>
              </div>
            ) : (
                <><div className={styles.stepper}>
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
                      </div><div className={styles.formCard}>
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
                            </div>
                          )}

                          {step === 1 && (
                            <div className={styles.formGrid}>
                              <h2>Document Upload</h2>


                              <div className={styles.field}>
                                <label>ID Card (PDF/JPG/PNG) *</label>
                                {filesPreview.id_card && !replaceFile.id_card ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <a href={filesPreview.id_card} target="_blank" rel="noreferrer" style={{ color: '#1e40af' }}>{basename(filesPreview.id_card) || 'View existing ID'}</a>
                                    <button onClick={() => setReplaceFile(prev => ({ ...prev, id_card: true }))} className={styles.secondaryBtn} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Replace</button>
                                  </div>
                                ) : (
                                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFileChange('id_card', e.target.files[0])} />
                                )}
                                {errors.id_card && <span className={styles.err}>{errors.id_card}</span>}
                                {fileErrors.id_card && <span className={styles.err}>{fileErrors.id_card}</span>}
                              </div>
                              <div className={styles.field}>
                                <label>Income Verification Certificate (PDF) *</label>
                                {filesPreview.income_certificate && !replaceFile.income_certificate ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <a href={filesPreview.income_certificate} target="_blank" rel="noreferrer" style={{ color: '#1e40af' }}>{basename(filesPreview.income_certificate) || 'View existing'}</a>
                                    <button onClick={() => setReplaceFile(prev => ({ ...prev, income_certificate: true }))} className={styles.secondaryBtn} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Replace</button>
                                  </div>
                                ) : (
                                  <input type="file" accept=".pdf" onChange={e => handleFileChange('income_certificate', e.target.files[0], ['application/pdf'])} />
                                )}
                                {errors.income_certificate && <span className={styles.err}>{errors.income_certificate}</span>}
                                {fileErrors.income_certificate && <span className={styles.err}>{fileErrors.income_certificate}</span>}
                              </div>
                              <div className={styles.field}>
                                <label>Bank Account Scan (PDF/JPG/PNG) *</label>
                                {filesPreview.bank_account && !replaceFile.bank_account ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <a href={filesPreview.bank_account} target="_blank" rel="noreferrer" style={{ color: '#1e40af' }}>{basename(filesPreview.bank_account) || 'View existing'}</a>
                                    <button onClick={() => setReplaceFile(prev => ({ ...prev, bank_account: true }))} className={styles.secondaryBtn} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Replace</button>
                                  </div>
                                ) : (
                                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFileChange('bank_account', e.target.files[0])} />
                                )}
                                {errors.bank_account && <span className={styles.err}>{errors.bank_account}</span>}
                                {fileErrors.bank_account && <span className={styles.err}>{fileErrors.bank_account}</span>}
                              </div>
                            </div>
                          )}



                          {step === 2 && (
                            <div className={styles.formGrid}>
                              <h2>Review & Submit</h2>
                              <p>Please review your information carefully before submitting.</p>
                              <ul style={{ lineHeight: '1.8' }}>
                                <li><strong>Student:</strong> {studentInfo.full_name}, {studentInfo.student_id}</li>
                                <li><strong>Year of Study:</strong> {studentInfo.current_year}</li>
                                <li><strong>Docs Attached:</strong> {files.id_card ? 'ID Card, ' : ''}{files.income_certificate ? 'Income Certificate, ' : ''}{files.bank_account ? 'Bank Account' : ''}</li>
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
                                disabled={submitLoading || resubmissionLimitReached}
                                style={{ padding: '0.75rem 1.5rem', background: resubmissionLimitReached ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: resubmissionLimitReached ? 'not-allowed' : 'pointer' }}
                              >
                                {resubmissionLimitReached
                                  ? 'Resubmission Limit Reached'
                                  : submitLoading
                                    ? (editAppId ? 'Resubmitting...' : 'Submitting...')
                                    : (editAppId ? 'Resubmit Application' : 'Submit Application')}
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