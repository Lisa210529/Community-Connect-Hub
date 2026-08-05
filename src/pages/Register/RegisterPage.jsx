import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLogo, { AuthFooterLink } from '../../components/common/AuthLogo';
import {
  registerUser,
  validateNidFromFirestore,
} from '../../services/authService';
import { validatePassword, validateEmail, validateNid } from '../../utils/validation';
import { PASSWORD_RULE_LABELS, ROLES } from '../../constants';

const SELF_REGISTER_ROLES = [{ value: 'resident', label: ROLES.resident }];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    nid: '',
    role: 'resident',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nidFeedback, setNidFeedback] = useState({ text: '', type: 'info' });
  const passwordCheck = validatePassword(form.password);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleNidBlur() {
    const nid = form.nid.trim();
    if (!nid) {
      setNidFeedback({ text: '', type: 'info' });
      return;
    }
    if (!/^\d*$/.test(nid)) {
      setNidFeedback({ text: 'Only numbers allowed.', type: 'invalid' });
      return;
    }
    if (nid.length !== 10) {
      setNidFeedback({ text: `Enter 10 digits (${nid.length}/10).`, type: 'info' });
      return;
    }

    const result = await validateNidFromFirestore(nid);
    setNidFeedback({
      text: result.message,
      type: result.valid ? 'valid' : 'invalid',
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!/^\d{6,10}$/.test(form.userId.trim())) {
      setError('User ID must be 6–10 digits (e.g., 210529).');
      return;
    }
    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!validateNid(form.nid)) {
      setError('NID must be exactly 10 digits.');
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
      await registerUser({
        email: form.email.trim(),
        password: form.password,
        profile: {
          userId: form.userId.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          nid: form.nid.trim(),
          role: form.role,
        },
      });

      const approvalNote =
        form.role === 'resident'
          ? 'You can sign in now.'
          : 'Await admin approval before signing in.';

      navigate('/login', {
        state: { message: `Registration successful. ${approvalNote}` },
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
        <div className="form-group">
          <label htmlFor="userId">
            <i className="fas fa-id-badge me-2" />
            User ID
          </label>
          <input
            id="userId"
            className="form-control"
            value={form.userId}
            onChange={(e) => updateField('userId', e.target.value.replace(/\D/g, ''))}
            placeholder="e.g., 210529"
            maxLength={10}
            required
          />
          <div className="form-text">Your student or assigned system ID (6–10 digits).</div>
        </div>

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
          <label htmlFor="nid">
            <i className="fas fa-id-card me-2" />
            National ID (NID)
          </label>
          <input
            id="nid"
            className="form-control"
            value={form.nid}
            onChange={(e) => updateField('nid', e.target.value.replace(/\D/g, ''))}
            onBlur={handleNidBlur}
            placeholder="10-digit NID"
            maxLength={10}
            required
          />
          {nidFeedback.text && (
            <div className={`nid-feedback ${nidFeedback.type}`}>{nidFeedback.text}</div>
          )}
          <div className="form-text">
            Your NID must exist in the national registry. Each NID can only be registered once.
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
          <label htmlFor="role">
            <i className="fas fa-user-tag me-2" />
            Role
          </label>
          <select
            id="role"
            className="form-select"
            value={form.role}
            onChange={(e) => updateField('role', e.target.value)}
          >
            {SELF_REGISTER_ROLES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="form-text">
            Other roles (Councillor, WDC, Admin) are assigned by an administrator after registration.
          </div>
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
