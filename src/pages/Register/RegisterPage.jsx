import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLogo, { AuthFooterLink } from '../../components/common/AuthLogo';
import { registerUser, isNidAlreadyRegistered } from '../../services/authService';
import { validatePassword, validateEmail, validateNid } from '../../utils/validation';
import { PASSWORD_RULE_LABELS } from '../../constants';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    nid: '',
    ward: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordCheck = validatePassword(form.password);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!validateNid(form.nid)) {
      setError('NID must be 10–12 digits.');
      return;
    }
    if (!passwordCheck.valid) {
      setError(passwordCheck.message);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (await isNidAlreadyRegistered(form.nid.trim())) {
        setError('This NID is already registered.');
        return;
      }

      await registerUser({
        email: form.email.trim(),
        password: form.password,
        profile: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          nid: form.nid.trim(),
          ward: form.ward.trim(),
          role: 'resident',
        },
      });

      navigate('/login', {
        state: { message: 'Registration successful. Await admin approval before signing in.' },
      });
    } catch (err) {
      setError(err.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <AuthLogo />

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-md-6 form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              className="form-control"
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              required
            />
          </div>
          <div className="col-md-6 form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              className="form-control"
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="form-control"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="nid">National ID (NID)</label>
          <input
            id="nid"
            className="form-control"
            value={form.nid}
            onChange={(e) => updateField('nid', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="ward">Ward</label>
          <input
            id="ward"
            className="form-control"
            value={form.ward}
            onChange={(e) => updateField('ward', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="form-control"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            required
          />
          {form.password && (
            <ul className="list-unstyled mt-2 mb-0">
              {Object.keys(PASSWORD_RULE_LABELS).map((key) => (
                <li
                  key={key}
                  className={`nid-feedback ${passwordCheck.rules[key] ? 'valid' : 'invalid'}`}
                >
                  {passwordCheck.rules[key] ? '✓' : '○'} {PASSWORD_RULE_LABELS[key]}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            className="form-control"
            value={form.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <AuthFooterLink text="Already have an account?" linkText="Sign In" to="/login" />
    </div>
  );
}
