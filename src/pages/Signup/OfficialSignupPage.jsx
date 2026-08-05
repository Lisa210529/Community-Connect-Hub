import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES, PASSWORD_RULE_LABELS } from '../../constants';
import { validatePassword } from '../../utils/validation';
import {
  validateNID,
  checkNidExists,
  getPreRegRecord,
} from '../../utils/validators';
import Logo from '../../components/common/Logo';

export default function OfficialSignupPage() {
  const { registerOfficial } = useAuth();
  const [form, setForm] = useState({
    email: '',
    nid: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  });
  const [preRegRecord, setPreRegRecord] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nidFeedback, setNidFeedback] = useState({ text: '', type: 'info' });
  const passwordCheck = validatePassword(form.password);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validatePreReg() {
    const nid = form.nid.trim();
    const email = form.email.trim();
    if (!validateNID(nid)) {
      setPreRegRecord(null);
      if (nid.length === 10) {
        setNidFeedback({ text: 'NID must be exactly 10 digits.', type: 'invalid' });
      }
      return;
    }
    if (checkNidExists(nid)) {
      setPreRegRecord(null);
      setNidFeedback({ text: 'NID already registered.', type: 'invalid' });
      return;
    }
    if (!email) {
      setPreRegRecord(null);
      setNidFeedback({ text: 'Enter your pre-registered email to verify.', type: 'info' });
      return;
    }
    const record = getPreRegRecord(nid, email);
    if (!record) {
      setPreRegRecord(null);
      setNidFeedback({
        text: 'No matching pre-registration found. Contact your administrator.',
        type: 'invalid',
      });
      return;
    }
    setPreRegRecord(record);
    setNidFeedback({
      text: `Verified: ${record.fullName} — ${ROLES[record.role] ?? record.role}`,
      type: 'valid',
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const record = getPreRegRecord(form.nid.trim(), form.email.trim());
    if (!record) {
      setError('You are not pre-registered. Please contact your administrator.');
      return;
    }
    setPreRegRecord(record);
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
      await registerOfficial(form);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-bg flex items-center justify-center p-4">
        <div className="cyber-card max-w-md text-center shadow-glow">
          <i className="fas fa-check-circle text-status-completed text-5xl mb-4" />
          <h2 className="text-xl font-bold text-cyber-accent">Registration Complete</h2>
          <p className="text-cyber-muted mt-3">
            Your official account has been activated. You can sign in immediately.
          </p>
          <Link to="/login" className="cyber-btn-primary inline-block mt-6">
            Sign In
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
          <p className="text-cyber-muted text-sm mt-2">Government Official Registration</p>
          <p className="text-xs text-cyber-muted mt-1">
            For pre-registered councillors, mayor, PEC, DDA, PSIP, DSIP, NGO, and open members
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-cyber-muted mb-1">NID (National Identification Number)</label>
            <input
              className="cyber-input"
              value={form.nid}
              onChange={(e) => update('nid', e.target.value.replace(/\D/g, '').slice(0, 10))}
              onBlur={validatePreReg}
              placeholder="1234567890"
              inputMode="numeric"
              maxLength={10}
              required
            />
            {nidFeedback.text && (
              <div className={`nid-feedback ${nidFeedback.type}`}>{nidFeedback.text}</div>
            )}
          </div>
          <div>
            <label className="block text-sm text-cyber-muted mb-1">Pre-Registered Email</label>
            <input
              type="email"
              className="cyber-input"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              onBlur={validatePreReg}
              required
            />
          </div>

          {preRegRecord && (
            <div className="p-4 rounded-lg bg-slate-bg border border-slate-border space-y-2 text-sm">
              <p><span className="text-cyber-muted">Full Name:</span> {preRegRecord.fullName}</p>
              <p><span className="text-cyber-muted">Role:</span> {ROLES[preRegRecord.role] ?? preRegRecord.role}</p>
              {preRegRecord.position && (
                <p><span className="text-cyber-muted">Position:</span> {preRegRecord.position}</p>
              )}
              {preRegRecord.ward && (
                <p><span className="text-cyber-muted">Ward:</span> {preRegRecord.ward}</p>
              )}
            </div>
          )}

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
              </button>
            </span>
          </label>

          <button type="submit" className="cyber-btn-primary w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Complete Official Registration'}
          </button>
        </form>

        <p className="text-center text-cyber-muted text-sm mt-6">
          Ward resident?{' '}
          <Link to="/signup" className="text-cyber-accent hover:underline">
            Resident Registration
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
