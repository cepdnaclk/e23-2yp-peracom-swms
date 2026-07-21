import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import donorApi from '../../services/donorApi';
import FormInput from '../../components/donor/FormInput';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    organization_name: '',
  });
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!formData.full_name.trim()) next.full_name = 'Full name is required';
    if (!formData.email.trim()) next.email = 'Email is required';
    if (!formData.password || formData.password.length < 8) next.password = 'Password must be at least 8 characters';
    if (!formData.organization_name.trim()) next.organization_name = 'Organization name is required';
    return next;
  };

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMessage('');
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await donorApi.post('/auth/register', formData);
      setServerMessage('Registration successful. Please login.');
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      setServerMessage(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card auth-card-wide">
        <h1>Donor Register</h1>
        <p className="muted">Create your donor account to manage scholarships and support students.</p>

        <form onSubmit={handleSubmit} className="grid-form">
          <FormInput label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} error={errors.full_name} required />
          <FormInput label="Email" type="email" name="email" value={formData.email} onChange={handleChange} error={errors.email} required />
          <FormInput label="Password" type="password" name="password" value={formData.password} onChange={handleChange} error={errors.password} required />
          <FormInput label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
          <FormInput label="Address" name="address" value={formData.address} onChange={handleChange} />
          <FormInput label="Organization Name" name="organization_name" value={formData.organization_name} onChange={handleChange} error={errors.organization_name} required />

          {serverMessage && (
            <div className={`alert ${serverMessage.includes('successful') ? 'alert-success' : 'alert-error'} grid-span-2`}>
              {serverMessage}
            </div>
          )}

          <div className="grid-span-2">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
