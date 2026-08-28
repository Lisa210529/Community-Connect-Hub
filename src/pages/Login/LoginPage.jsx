import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resolveDashboardPath } from '../../constants';
import Logo from '../../components/common/Logo';

function unlockInput(e, setFieldsActive) {
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
  setFieldsActive(true);
}

export default function LoginPage() {
  const { login, dashboardPath, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message ?? '';

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [fieldsActive, setFieldsActive] = useState(false);
  const [emailForLink, setEmailForLink] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Keep fields blank on load; Chrome may autofill after paint while readOnly is set.
  useEffect(() => {
    function clearLockedFields() {
      if (fieldsActive) return;
      if (emailRef.current?.readOnly) emailRef.current.value = '';
      if (passwordRef.current?.readOnly) passwordRef.current.value = '';
    }

    clearLockedFields();
    const timer = window.setTimeout(clearLockedFields, 100);
    return () => window.clearTimeout(timer);
  }, [fieldsActive]);

  function handleInputReady(e) {
    unlockInput(e, setFieldsActive);
  }

  function syncEmailFromInput() {
    setEmailForLink(emailRef.current?.value?.trim() ?? '');
  }

  if (isAuthenticated) {
    navigate(dashboardPath, { replace: true });
    return null;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const email = emailRef.current?.value?.trim() ?? '';
    const password = passwordRef.current?.value ?? '';

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

        <form onSubmit={handleLogin} className="space-y-4" autoComplete="on">
          <div>
            <label className="block text-sm text-cyber-muted mb-1" htmlFor="login-email">
              Email
            </label>
            <input
              ref={emailRef}
              id="login-email"
              name="username"
              type="email"
              className="cyber-input"
              placeholder="Enter your email address"
              autoComplete="username email"
              defaultValue=""
              readOnly={!fieldsActive}
              onMouseDown={handleInputReady}
              onFocus={handleInputReady}
              onInput={syncEmailFromInput}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-cyber-muted mb-1" htmlFor="login-password">
              Password
            </label>
            <input
              ref={passwordRef}
              id="login-password"
              name="password"
              type="password"
              className="cyber-input"
              placeholder="Enter your password"
              autoComplete="current-password"
              defaultValue=""
              readOnly={!fieldsActive}
              onMouseDown={handleInputReady}
              onFocus={handleInputReady}
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
            <Link
              to="/login/forgot-password"
              state={{ email: emailForLink }}
              className="text-cyber-accent hover:underline"
            >
              Forgot Password?
            </Link>
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
