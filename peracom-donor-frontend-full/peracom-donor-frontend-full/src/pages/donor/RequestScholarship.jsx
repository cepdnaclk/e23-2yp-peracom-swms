import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import donorApi from '../../services/donorApi';
import Navbar from '../../components/donor/Navbar';
import Sidebar from '../../components/donor/Sidebar';
import Footer from '../../components/donor/Footer';
import FormInput from '../../components/donor/FormInput';
import FormTextarea from '../../components/donor/FormTextarea';

function RequestScholarship() {
  const location = useLocation();
  const navigate = useNavigate();
  const existing = location.state?.existingRequest;

  const [formData, setFormData] = useState({
    title: existing?.title || '',
    description: existing?.description || '',
    funding_amount: existing?.funding_amount || '',
    eligibility: existing?.eligibility || '',
    deadline: existing?.deadline || '',
    required_documents: existing?.required_documents || '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitRequest = async (status = 'pending') => {
    setMessage('');
    setError('');
    setSubmitting(true);
    try {
      await donorApi.post('/donor/scholarship-requests', { ...formData, status });
      setMessage(status === 'draft' ? 'Draft saved successfully.' : 'Scholarship request submitted successfully.');
      if (status !== 'draft') {
        setTimeout(() => navigate('/scholarships'), 900);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save scholarship request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitRequest('pending');
  };

  return (
    <div className="app-shell">
      <Navbar notifications={[]} announcements={[]} />
      <div className="content-shell">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <div>
              <h1>Request New Scholarship</h1>
              <p className="muted">Suggest a scholarship with funding information, eligibility, and required documents.</p>
            </div>
          </div>

          <div className="card max-form-card">
            <form onSubmit={handleSubmit} className="stack-gap">
              <FormInput label="Title" name="title" value={formData.title} onChange={handleChange} required />
              <FormTextarea label="Description" name="description" value={formData.description} onChange={handleChange} rows="5" required />
              <FormInput label="Funding Amount" type="number" name="funding_amount" value={formData.funding_amount} onChange={handleChange} required />
              <FormTextarea label="Eligibility" name="eligibility" value={formData.eligibility} onChange={handleChange} rows="4" placeholder="Who can apply for this scholarship?" />
              <FormInput label="Deadline" type="date" name="deadline" value={formData.deadline} onChange={handleChange} />
              <FormTextarea label="Required Documents" name="required_documents" value={formData.required_documents} onChange={handleChange} rows="4" placeholder="List required supporting documents..." />

              {message && <div className="alert alert-success">{message}</div>}
              {error && <div className="alert alert-error">{error}</div>}

              <div className="inline-actions">
                <button className="btn btn-primary" type="submit" disabled={submitting}>Submit</button>
                <button className="btn btn-secondary" type="button" onClick={() => submitRequest('draft')} disabled={submitting}>Save Draft</button>
                <button className="btn btn-ghost" type="button" onClick={() => navigate('/scholarships')}>Cancel</button>
              </div>
            </form>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default RequestScholarship;
