import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PASSWORD_RULE_LABELS } from '../../constants';
import { getWardSelectOptions } from '../../constants/wards';
import { validatePassword } from '../../utils/validation';
import { validateNID } from '../../utils/validators';
import { checkNIDExists, checkNidInPreRegistered } from '../../services/authService';
import Logo from '../../components/common/Logo';

const RESIDENT_WARD_OPTIONS = getWardSelectOptions();

export default function SignupPage() {
  const { registerResident } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    nid: '',
    phone: '',
    ward: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nidFeedback, setNidFeedback] = useState({ text: '', type: 'info' });
  const passwordCheck = validatePassword(form.password);

  function update(field, value) {
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
    if (!validateNID(nid)) {
      setNidFeedback({ text: 'NID must be exactly 10 digits.', type: 'invalid' });
      return;
    }
    try {
      if (await checkNIDExists(nid)) {
        setNidFeedback({ text: 'NID already registered.', type: 'invalid' });
        return;
      }
      if (await checkNidInPreRegistered(nid)) {
        setNidFeedback({
          text: 'You are a pre-registered official. Please use the official registration page.',
          type: 'invalid',
        });
        return;
      }
      setNidFeedback({ text: 'NID is available for resident registration.', type: 'valid' });
    } catch {
      setNidFeedback({ text: 'Could not verify NID. Check your connection.', type: 'invalid' });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validateNID(form.nid.trim())) {
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
      await registerResident(form);
      setPending(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (pending) {
    return (
      <div className="min-h-screen bg-slate-bg flex items-center justify-center p-4">
        <div className="cyber-card max-w-md text-center shadow-glow">
          <i className="fas fa-clock text-status-pending text-5xl mb-4" />
          <h2 className="text-xl font-bold text-cyber-accent">Pending Approval</h2>
          <p className="text-cyber-muted mt-3">
            Your resident account has been created and is awaiting System Admin approval.
            An admin will verify your NID before activating your account.
          </p>
          <Link to="/login" className="cyber-btn-primary inline-block mt-6">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-bg flex items-center justify-center p-4">
      <div className="cyber-card w-full max-w-lg shadow-glow">
        <div className="text-center mb-6">
          <Logo />
          <p className="text-cyber-muted text-sm mt-2">Resident Registration</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-cyber-muted mb-1">Full Name</label>
            <input
              className="cyber-input"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-cyber-muted mb-1">NID (National Identification Number)</label>
            <input
              className="cyber-input"
              value={form.nid}
              onChange={(e) => update('nid', e.target.value.replace(/\D/g, '').slice(0, 10))}
              onBlur={handleNidBlur}
              placeholder="1234567890"
              inputMode="numeric"
              maxLength={10}
              required
            />
            {nidFeedback.text && (
              <div className={`nid-feedback ${nidFeedback.type}`}>{nidFeedback.text}</div>
            )}
            <p className="text-xs text-cyber-muted mt-1">
              Your 10-digit PNG National ID. Each NID can only be registered once.
            </p>
          </div>
          <div>
            <label className="block text-sm text-cyber-muted mb-1">Email</label>
            <input
              type="email"
              className="cyber-input"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-cyber-muted mb-1">Phone Number</label>
            <input
              type="tel"
              className="cyber-input"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+675 7XXX XXXX"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-cyber-muted mb-1">Ward</label>
            <select
              className="cyber-select"
              value={form.ward}
              onChange={(e) => update('ward', e.target.value)}
              required
            >
              <option value="">Select Ward</option>
              {RESIDENT_WARD_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-cyber-muted mb-1">Password</label>
            <input
              type="password"
              className="cyber-input"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
            />
            {form.password && (
              <ul className="mt-2 space-y-1">
                {Object.keys(PASSWORD_RULE_LABELS).map((key) => (
                  <li
                    key={key}
                    className={`text-xs ${passwordCheck.rules[key] ? 'text-status-completed' : 'text-cyber-muted'}`}
                  >
                    {passwordCheck.rules[key] ? '✓' : '○'} {PASSWORD_RULE_LABELS[key]}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-sm text-cyber-muted mb-1">Confirm Password</label>
            <input
              type="password"
              className="cyber-input"
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              required
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-cyber-muted cursor-pointer">
            <input
              type="checkbox"
              checked={form.acceptedTerms}
              onChange={(e) => update('acceptedTerms', e.target.checked)}
              className="mt-1 rounded border-slate-border"
              required
            />
            <span>
              I agree to the{' '}
              <button type="button" className="text-cyber-accent hover:underline">
                Terms &amp; Conditions
              </button>{' '}
              of Community Connect Hub
            </span>
          </label>

          <button type="submit" className="cyber-btn-primary w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Register as Resident'}
          </button>
        </form>

        <p className="text-center text-cyber-muted text-sm mt-6">
          Pre-registered government official?{' '}
          <Link to="/signup/official" className="text-cyber-accent hover:underline">
            Official Registration
          </Link>
        </p>
        <p className="text-center text-cyber-muted text-sm mt-2">
          Already registered?{' '}
          <Link to="/login" className="text-cyber-accent hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
