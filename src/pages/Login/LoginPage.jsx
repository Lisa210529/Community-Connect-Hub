import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resolveDashboardPath } from '../../constants';
import Logo from '../../components/common/Logo';

export default function LoginPage() {
  const { login, dashboardPath, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message ?? '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate(dashboardPath, { replace: true });
    return null;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      if (userData?.mfaEnabled) {
        if (userData.mfaType === 'sms') {
          const smsCode = String(Math.floor(100000 + Math.random() * 900000));
          sessionStorage.setItem('mfaSmsCode', smsCode);
          console.info(`Demo SMS MFA code for ${email}: ${smsCode}`);
        }
        navigate('/login/mfa');
      } else {
        navigate(resolveDashboardPath(userData));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-bg flex items-center justify-center p-4">
      <div className="cyber-card w-full max-w-md shadow-glow">
        <div className="flex flex-col items-center mb-8">
          <Logo />
          <p className="text-cyber-muted text-sm mt-3">Sign in to your account</p>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-status-completed/10 border border-status-completed/30 text-status-completed text-sm">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-cyber-muted mb-1">Email</label>
            <input
              type="email"
              className="cyber-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lisanumbunda@gmail.com"
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

        <p className="text-center text-cyber-muted text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-cyber-accent hover:underline">
            Register now
          </Link>
        </p>
        <p className="text-center text-cyber-muted text-xs mt-2">
          Pre-registered official?{' '}
          <Link to="/official-register" className="text-cyber-accent hover:underline">
            Complete official registration
          </Link>
        </p>
      </div>
    </div>
  );
}
