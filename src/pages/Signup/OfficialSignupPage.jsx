import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_DASHBOARD_PATHS, PASSWORD_RULE_LABELS } from '../../constants';
import { validatePassword } from '../../utils/validation';
import { validateOfficialRegistration } from '../../services/authService';
import Logo from '../../components/common/Logo';

export default function OfficialSignupPage() {
  const { registerOfficial, login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('verify');
  const [formData, setFormData] = useState({
    nid: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });
  const [preRegRecord, setPreRegRecord] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const passwordCheck = validatePassword(formData.password);

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanNid = formData.nid.replace(/\s/g, '');
      if (!/^\d{10}$/.test(cleanNid)) {
        throw new Error('NID must be exactly 10 digits');
      }
      if (!formData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      setIsValidating(true);
      const check = await validateOfficialRegistration({
        nid: cleanNid,
        email: formData.email.trim(),
      });

      if (!check.valid) {
        throw new Error(check.message);
      }

      setPreRegRecord(check.record);
      setStep('register');
    } catch (err) {
      setError(err.message);
      setPreRegRecord(null);
    } finally {
      setLoading(false);
      setIsValidating(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!passwordCheck.valid) {
        throw new Error(passwordCheck.message);
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (!formData.termsAccepted) {
        throw new Error('You must accept the Terms & Conditions');
      }
      if (!preRegRecord) {
        throw new Error('Pre-registration not verified. Go back and verify again.');
      }

      const result = await registerOfficial({
        email: preRegRecord.email,
        nid: preRegRecord.nid,
        password: formData.password,
        acceptedTerms: true,
      });

      const role = result.role ?? preRegRecord.role;
      await login(preRegRecord.email, formData.password);

      navigate(ROLE_DASHBOARD_PATHS[role] || '/dashboard/resident', {
        replace: true,
        state: {
          message: `Welcome ${preRegRecord.fullName}! Your official account is active.`,
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
          <h2 className="text-lg font-semibold text-cyber-accent mt-3">
            Government Official Registration
          </h2>
          <p className="text-xs text-cyber-muted mt-1">
            For pre-registered councillors, mayor, PEC, DDA, PSIP, DSIP, NGO, and open members
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
            {error}
          </div>
        )}

        {step === 'verify' ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm text-cyber-muted mb-1">
                NID (National Identification Number)
              </label>
              <input
                type="text"
                className="cyber-input"
                placeholder="Enter 10-digit NID"
                value={formData.nid}
                onChange={(e) => updateField('nid', e.target.value.replace(/\D/g, '').slice(0, 10))}
                inputMode="numeric"
                maxLength={10}
                required
              />
              <p className="text-xs text-cyber-muted mt-1">
                NID must match what was provided to the administrator
              </p>
            </div>

            <div>
              <label className="block text-sm text-cyber-muted mb-1">Pre-Registered Email</label>
              <input
                type="email"
                className="cyber-input"
                placeholder="Enter your registered email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
              />
              <p className="text-xs text-cyber-muted mt-1">
                Email must match what was provided to the administrator
              </p>
            </div>

            <button
              type="submit"
              className="cyber-btn-primary w-full"
              disabled={loading || isValidating}
            >
              {isValidating ? 'Validating…' : loading ? 'Verifying…' : 'Verify Registration'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {preRegRecord && (
              <div className="p-4 rounded-lg bg-slate-bg border border-slate-border space-y-1 text-sm">
                <p className="text-status-completed font-medium">Pre-registration verified</p>
                <p className="text-cyber-text font-medium">{preRegRecord.fullName}</p>
                <p className="text-cyber-muted">
                  Role: {ROLES[preRegRecord.role] ?? preRegRecord.role}
                </p>
                {preRegRecord.position && (
                  <p className="text-cyber-muted">Position: {preRegRecord.position}</p>
                )}
                <p className="text-cyber-muted">
                  Ward: {preRegRecord.wardNumber || preRegRecord.ward || 'N/A'}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm text-cyber-muted mb-1">Password</label>
              <input
                type="password"
                className="cyber-input"
                placeholder="Create a strong password"
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
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                required
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-cyber-muted cursor-pointer">
              <input
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={(e) => updateField('termsAccepted', e.target.checked)}
                className="mt-1 rounded border-slate-border"
                required
              />
              <span>I agree to the Terms &amp; Conditions of Community Connect Hub</span>
            </label>

            <button type="submit" className="cyber-btn-primary w-full" disabled={loading}>
              {loading ? 'Registering…' : 'Complete Official Registration'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('verify');
                setPreRegRecord(null);
                setError('');
              }}
              className="cyber-btn-secondary w-full"
            >
              Back to Verification
            </button>
          </form>
        )}

        <p className="text-center text-cyber-muted text-sm mt-6">
          Ward resident?{' '}
          <Link to="/signup" className="text-cyber-accent hover:underline">
            Resident Registration
          </Link>
        </p>
        <p className="text-center text-cyber-muted text-sm mt-2">
          Already registered?{' '}
          <Link to="/login" className="text-cyber-accent hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
