import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLogo, { AuthFooterLink } from '../../components/common/AuthLogo';
import { loginUser, resetPassword } from '../../services/authService';
import { validateEmail } from '../../utils/validation';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { profile } = await loginUser(email.trim(), password);
      const role = profile?.role ?? 'resident';
      if (role === 'system_admin') navigate('/admin');
      else if (role.startsWith('wdc_')) navigate('/wdc');
      else if (['councillor', 'llg_admin', 'dda_officer', 'provincial_admin'].includes(role)) {
        navigate('/government');
      } else navigate('/resident');
    } catch (err) {
      setError(err.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setResetMessage('');
    if (!validateEmail(resetEmail)) {
      setResetMessage('Please enter a valid email address.');
      return;
    }
    try {
      await resetPassword(resetEmail.trim());
      setResetMessage('Password reset link sent. Check your email.');
    } catch {
      setResetMessage('Could not send reset email. Check the address and try again.');
    }
  }

  return (
    <div className="auth-card">
      <AuthLogo />

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="loginEmail">
            <i className="fas fa-envelope" /> Email
          </label>
          <input
            id="loginEmail"
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="loginPassword">
            <i className="fas fa-lock" /> Password
          </label>
          <input
            id="loginPassword"
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div className="auth-divider">or</div>

      <form onSubmit={handleResetPassword} className="mt-2">
        <div className="form-group">
          <label htmlFor="resetEmail">
            <i className="fas fa-key" /> Forgot password?
          </label>
          <input
            id="resetEmail"
            type="email"
            className="form-control"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="Enter registered email"
          />
        </div>
        <button type="submit" className="btn btn-outline-primary w-100">
          Send Reset Link
        </button>
        {resetMessage && <p className="nid-feedback info mt-2">{resetMessage}</p>}
      </form>

      <AuthFooterLink text="Don't have an account?" linkText="Register" to="/register" />
    </div>
  );
}
