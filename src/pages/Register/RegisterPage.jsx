import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  registerUser,
  checkNIDExists,
  checkEmailExists,
} from '../../services/authService';
import { validatePassword } from '../../utils/validation';
import { PASSWORD_RULE_LABELS } from '../../constants';
import { getWardSelectOptions } from '../../constants/wards';
import Logo from '../../components/common/Logo';

const RESIDENT_WARD_OPTIONS = getWardSelectOptions();
const NO_AUTOFILL = 'one-time-code';

function unlockInput(e) {
  const input = e.currentTarget;
  if (input.readOnly) {
    if (e.type === 'mousedown') {
      e.preventDefault();
    }
    input.readOnly = false;
    input.removeAttribute('readonly');
    if (e.type === 'mousedown') {
      input.focus();
    }
  }
}

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
  const [fieldsActive, setFieldsActive] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [nidFeedback, setNidFeedback] = useState({ text: '', type: 'info' });
  const passwordCheck = validatePassword(formData.password);

  function activateFields() {
    setFieldsActive(true);
  }

  function handleInputReady(e) {
    unlockInput(e);
    activateFields();
  }

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleWardChange(wardValue) {
    const option = RESIDENT_WARD_OPTIONS.find((w) => w.value === wardValue);
    setFormData((prev) => ({
      ...prev,
      wardId: wardValue,
      wardNumber: option?.wardNumber ?? '',
      ward: option?.ward ?? option?.label ?? '',
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
    setTermsError('');

    if (!formData.acceptedTerms) {
      setTermsError('You must accept the Terms & Conditions before you can register.');
      return;
    }

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
      {/* Decoy fields absorb browser login/address autofill away from the real form */}
      <form
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="on"
        className="absolute opacity-0 h-0 w-0 overflow-hidden pointer-events-none"
      >
        <input type="text" name="username" autoComplete="username" tabIndex={-1} defaultValue="" />
        <input type="password" name="password" autoComplete="current-password" tabIndex={-1} defaultValue="" />
        <input type="text" name="email" autoComplete="email" tabIndex={-1} defaultValue="" />
        <input type="text" name="given-name" autoComplete="given-name" tabIndex={-1} defaultValue="" />
      </form>

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

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          autoComplete="off"
          data-form-type="other"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-cyber-muted mb-1" htmlFor="cch-resident-given">
                First Name
              </label>
              <input
                id="cch-resident-given"
                name="cch-resident-given"
                className="cyber-input"
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                autoComplete={NO_AUTOFILL}
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                readOnly={!fieldsActive}
                onMouseDown={handleInputReady}
                onFocus={handleInputReady}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-cyber-muted mb-1" htmlFor="cch-resident-family">
                Last Name
              </label>
              <input
                id="cch-resident-family"
                name="cch-resident-family"
                className="cyber-input"
                value={formData.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                autoComplete={NO_AUTOFILL}
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                readOnly={!fieldsActive}
                onMouseDown={handleInputReady}
                onFocus={handleInputReady}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-cyber-muted mb-1" htmlFor="cch-resident-nid">
              NID (10 digits)
            </label>
            <input
              id="cch-resident-nid"
              name="cch-resident-nid"
              className="cyber-input"
              value={formData.nid}
              onChange={(e) => updateField('nid', e.target.value.replace(/\D/g, '').slice(0, 10))}
              onBlur={handleNidBlur}
              autoComplete={NO_AUTOFILL}
              data-lpignore="true"
              data-1p-ignore="true"
              readOnly={!fieldsActive}
              onMouseDown={handleInputReady}
              onFocus={handleInputReady}
              maxLength={10}
              inputMode="numeric"
              required
            />
            {nidFeedback.text && (
              <div className={`nid-feedback ${nidFeedback.type}`}>{nidFeedback.text}</div>
            )}
          </div>

          <div>
            <label className="block text-sm text-cyber-muted mb-1" htmlFor="cch-resident-contact">
              Email
            </label>
            <input
              id="cch-resident-contact"
              name="cch-resident-contact"
              type="text"
              inputMode="email"
              className="cyber-input"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              autoComplete={NO_AUTOFILL}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              readOnly={!fieldsActive}
              onMouseDown={handleInputReady}
              onFocus={handleInputReady}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-cyber-muted mb-1" htmlFor="cch-resident-phone">
              Phone
            </label>
            <input
              id="cch-resident-phone"
              name="cch-resident-phone"
              type="tel"
              className="cyber-input"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              autoComplete={NO_AUTOFILL}
              data-lpignore="true"
              data-1p-ignore="true"
              readOnly={!fieldsActive}
              onMouseDown={handleInputReady}
              onFocus={handleInputReady}
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
            <label className="block text-sm text-cyber-muted mb-1" htmlFor="cch-resident-secret">
              Password
            </label>
            <input
              id="cch-resident-secret"
              name="cch-resident-secret"
              type="text"
              className="cyber-input [webkit-text-security:disc]"
              style={{ WebkitTextSecurity: 'disc' }}
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              autoComplete={NO_AUTOFILL}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              readOnly={!fieldsActive}
              onMouseDown={handleInputReady}
              onFocus={handleInputReady}
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
            <label className="block text-sm text-cyber-muted mb-1" htmlFor="cch-resident-secret-confirm">
              Confirm Password
            </label>
            <input
              id="cch-resident-secret-confirm"
              name="cch-resident-secret-confirm"
              type="text"
              className="cyber-input [webkit-text-security:disc]"
              style={{ WebkitTextSecurity: 'disc' }}
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              autoComplete={NO_AUTOFILL}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              readOnly={!fieldsActive}
              onMouseDown={handleInputReady}
              onFocus={handleInputReady}
              required
            />
          </div>

          <div>
            <label
              htmlFor="register-terms"
              className="flex items-start gap-2 text-sm text-cyber-muted cursor-pointer"
            >
              <input
                id="register-terms"
                type="checkbox"
                checked={formData.acceptedTerms}
                onChange={(e) => {
                  updateField('acceptedTerms', e.target.checked);
                  if (e.target.checked) setTermsError('');
                }}
                className="mt-1 rounded border-slate-border"
              />
              <span>I agree to the Terms &amp; Conditions</span>
            </label>
            {termsError && (
              <p className="mt-1.5 text-xs text-status-rejected">{termsError}</p>
            )}
            {!formData.acceptedTerms && !termsError && (
              <p className="mt-1.5 text-xs text-cyber-muted">
                You must accept the Terms &amp; Conditions to register.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="cyber-btn-primary w-full"
            disabled={loading || !formData.acceptedTerms}
            title={
              !formData.acceptedTerms
                ? 'Accept the Terms & Conditions to register'
                : undefined
            }
          >
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
