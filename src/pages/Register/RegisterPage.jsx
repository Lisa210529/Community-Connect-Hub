import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  registerUser,
  checkNIDExists,
  checkEmailExists,
} from '../../services/authService';
import { validatePassword } from '../../utils/validation';
import { PASSWORD_RULE_LABELS } from '../../constants';
import Logo from '../../components/common/Logo';

const RESIDENT_WARD_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: `ward${i + 1}`,
  label: `Ward ${i + 1}`,
  wardNumber: String(i + 1),
}));

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    nid: '',
    phone: '',
    wardId: '',
    wardNumber: '',
    ward: '',
    province: 'Madang',
    district: 'Madang',
    llg: 'Madang Urban',
    role: 'resident',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nidFeedback, setNidFeedback] = useState({ text: '', type: 'info' });
  const passwordCheck = validatePassword(formData.password);

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleWardChange(wardValue) {
    const option = RESIDENT_WARD_OPTIONS.find((w) => w.value === wardValue);
    setFormData((prev) => ({
      ...prev,
      wardId: wardValue,
      wardNumber: option?.wardNumber ?? '',
      ward: option?.label ?? '',
    }));
  }

  async function handleNidBlur() {
    const nid = formData.nid.trim();
    if (!nid || nid.length !== 10) return;
    try {
      if (await checkNIDExists(nid)) {
        setNidFeedback({ text: 'NID already registered.', type: 'invalid' });
      } else {
        setNidFeedback({ text: 'NID is available.', type: 'valid' });
      }
    } catch {
      setNidFeedback({ text: 'Could not verify NID.', type: 'invalid' });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!/^\d{10}$/.test(formData.nid)) {
        throw new Error('NID must be exactly 10 digits');
      }
      if (await checkNIDExists(formData.nid)) {
        throw new Error('NID already registered. Please use a different NID.');
      }
      if (await checkEmailExists(formData.email)) {
        throw new Error('Email already registered. Please use a different email.');
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (!passwordCheck.valid) {
        throw new Error(passwordCheck.message);
      }
      if (!formData.wardId) {
        throw new Error('Please select your ward.');
      }
      if (!formData.acceptedTerms) {
        throw new Error('You must accept the Terms & Conditions.');
      }

      await registerUser(formData);
      navigate('/login', {
        state: {
          message:
            'Registration successful! Your account is pending admin approval. You will be notified when approved.',
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-bg flex items-center justify-center p-4">
      <div className="cyber-card w-full max-w-lg shadow-glow">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo />
          <p className="text-cyber-muted text-sm mt-3">Resident Registration</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-cyber-muted mb-1">First Name</label>
              <input
                className="cyber-input"
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-cyber-muted mb-1">Last Name</label>
              <input
                className="cyber-input"
                value={formData.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-cyber-muted mb-1">NID (10 digits)</label>
            <input
              className="cyber-input"
              value={formData.nid}
              onChange={(e) => updateField('nid', e.target.value.replace(/\D/g, '').slice(0, 10))}
              onBlur={handleNidBlur}
              maxLength={10}
              required
            />
            {nidFeedback.text && (
              <div className={`nid-feedback ${nidFeedback.type}`}>{nidFeedback.text}</div>
            )}
          </div>

          <div>
            <label className="block text-sm text-cyber-muted mb-1">Email</label>
            <input
              type="email"
              className="cyber-input"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-cyber-muted mb-1">Phone</label>
            <input
              type="tel"
              className="cyber-input"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-cyber-muted mb-1">Ward</label>
            <select
              className="cyber-select"
              value={formData.wardId}
              onChange={(e) => handleWardChange(e.target.value)}
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
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
            />
            {formData.password && (
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
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              required
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-cyber-muted cursor-pointer">
            <input
              type="checkbox"
              checked={formData.acceptedTerms}
              onChange={(e) => updateField('acceptedTerms', e.target.checked)}
              className="mt-1 rounded border-slate-border"
              required
            />
            <span>I agree to the Terms &amp; Conditions</span>
          </label>

          <button type="submit" className="cyber-btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Register as Resident'}
          </button>
        </form>

        <p className="text-center text-cyber-muted text-sm mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-cyber-accent hover:underline">Sign In</Link>
        </p>
        <p className="text-center text-cyber-muted text-sm mt-2">
          Pre-registered government official?{' '}
          <Link to="/official-register" className="text-cyber-accent hover:underline">
            Complete official registration
          </Link>
        </p>
      </div>
    </div>
  );
}
