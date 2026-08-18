import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resolveDashboardPath } from '../../constants';
import { verifyTotpCode } from '../../utils/mfaHelpers';
import Logo from '../../components/common/Logo';

export default function MFAVerificationPage() {
  const { user, completeMfaLogin, logout } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const mfaType = user?.mfaType ?? 'totp';

  async function handleVerify(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mfaType === 'sms') {
        const expected = sessionStorage.getItem('mfaSmsCode');
        if (code !== expected) {
          setError('Invalid SMS code.');
          setLoading(false);
          return;
        }
      } else {
        const valid = await verifyTotpCode(user?.mfaSecret, code);
        if (!valid) {
          setError('Invalid authenticator code.');
          setLoading(false);
          return;
        }
      }

      sessionStorage.removeItem('mfaSmsCode');
      completeMfaLogin?.();
      navigate(resolveDashboardPath(user));
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  if (!user?.mfaEnabled) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-bg flex items-center justify-center p-4">
      <div className="cyber-card w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo />
          <h1 className="text-lg font-semibold text-cyber-text mt-3">Two-Factor Verification</h1>
          <p className="text-cyber-muted text-sm mt-1">
            {mfaType === 'sms' ? 'Enter the SMS code sent to your phone.' : 'Enter the code from your authenticator app.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            className="cyber-input text-center text-lg tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            required
          />
          <button type="submit" disabled={loading} className="cyber-btn-primary w-full">
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        <button type="button" onClick={() => logout()} className="text-xs text-cyber-muted hover:underline w-full mt-4">
          Cancel and sign out
        </button>
      </div>
    </div>
  );
}
