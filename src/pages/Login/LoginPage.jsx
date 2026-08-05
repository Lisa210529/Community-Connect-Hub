import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DASHBOARD_PATHS } from '../../constants';
import Logo from '../../components/common/Logo';

export default function LoginPage() {
  const { login, dashboardPath, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate(dashboardPath, { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier.trim(), password, rememberMe);
      if (user.mfaEnabled && !showMfa) {
        setShowMfa(true);
        setLoading(false);
        return;
      }
      navigate(ROLE_DASHBOARD_PATHS[user.role] ?? '/dashboard/resident');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleMfaVerify(e) {
    e.preventDefault();
    if (mfaCode.length >= 6) {
      navigate(dashboardPath);
    } else {
      setError('Enter a valid 6-digit MFA code.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-bg flex items-center justify-center p-4">
      <div className="cyber-card w-full max-w-md shadow-glow">
        <div className="text-center mb-8">
          <Logo />
          <p className="text-cyber-muted text-sm mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
            {error}
          </div>
        )}

        {!showMfa ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-cyber-muted mb-1">Email</label>
              <input
                type="email"
                className="cyber-input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="resident@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-cyber-muted mb-1">Password</label>
              <input
                type="password"
                className="cyber-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-cyber-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-border"
                />
                Remember Me
              </label>
              <button type="button" className="text-cyber-accent hover:underline">
                Forgot Password?
              </button>
            </div>
            <button type="submit" className="cyber-btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaVerify} className="space-y-4">
            <p className="text-cyber-muted text-sm">
              MFA Verification — enter the 6-digit code from your authenticator app (demo: any 6 digits).
            </p>
            <input
              className="cyber-input text-center text-2xl tracking-widest"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
            />
            <button type="submit" className="cyber-btn-primary w-full">
              Verify &amp; Continue
            </button>
            <button
              type="button"
              onClick={() => setShowMfa(false)}
              className="cyber-btn-secondary w-full"
            >
              Back
            </button>
          </form>
        )}

        <p className="text-center text-cyber-muted text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-cyber-accent hover:underline">
            Register now
          </Link>
        </p>
        <p className="text-center text-cyber-muted text-xs mt-2">
          Pre-registered official?{' '}
          <Link to="/signup/official" className="text-cyber-accent hover:underline">
            Complete official registration
          </Link>
        </p>
      </div>
    </div>
  );
}
