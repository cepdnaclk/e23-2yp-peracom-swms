import { useState } from 'react';
import donorApi from '../../services/donorApi';
import Navbar from '../../components/donor/Navbar';
import Sidebar from '../../components/donor/Sidebar';
import Footer from '../../components/donor/Footer';
import FormSelect from '../../components/donor/FormSelect';
import FormTextarea from '../../components/donor/FormTextarea';
import FormInput from '../../components/donor/FormInput';

function ReportIssue() {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    attachment_url: '',
  });
  const [attachmentName, setAttachmentName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      setFormData((prev) => ({ ...prev, attachment_url: file.name }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);
    try {
      await donorApi.post('/donor/issues', formData);
      setMessage('Issue submitted successfully.');
      setFormData({ category: '', description: '', attachment_url: '' });
      setAttachmentName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit issue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <Navbar notifications={[]} announcements={[]} />
      <div className="content-shell">
        <Sidebar />
        <main className="main-content">
          <div className="page-header">
            <div>
              <h1>Issue Reporting</h1>
              <p className="muted">Report scholarship, student, system, or other issues to the admin team.</p>
            </div>
          </div>

          <div className="card max-form-card">
            <form onSubmit={handleSubmit} className="stack-gap">
              <FormSelect
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Select category' },
                  { value: 'scholarship', label: 'Scholarship' },
                  { value: 'student', label: 'Student' },
                  { value: 'system', label: 'System' },
                  { value: 'other', label: 'Other' },
                ]}
                required
              />

              <FormTextarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="6"
                placeholder="Describe the issue clearly..."
                required
              />

              <FormInput label="Attachment (optional)" type="file" onChange={handleFileChange} />
              {attachmentName && <p className="muted">Selected file: {attachmentName}</p>}

              {message && <div className="alert alert-success">{message}</div>}
              {error && <div className="alert alert-error">{error}</div>}

              <div className="inline-actions">
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Issue'}
                </button>
              </div>
            </form>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default ReportIssue;
