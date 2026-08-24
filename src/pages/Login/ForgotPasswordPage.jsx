import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { resetPassword } from '../../services/authService';

export default function ForgotPasswordPage() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-bg flex items-center justify-center p-4">
      <div className="cyber-card w-full max-w-md shadow-glow">
        <div className="flex flex-col items-center mb-8">
          <Logo />
          <p className="text-cyber-muted text-sm mt-3">Reset your password</p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-status-completed/10 border border-status-completed/30 text-status-completed text-sm">
              <p className="font-medium mb-2">Check your email</p>
              <p>
                If an account exists for <strong className="text-cyber-text">{email.trim()}</strong>,
                we sent a password reset link. Open the email from Firebase and follow the link to
                choose a new password.
              </p>
            </div>
            <ul className="text-sm text-cyber-muted space-y-2 list-disc pl-5">
              <li>Check your inbox and spam folder.</li>
              <li>The link expires after a short time for security.</li>
              <li>After resetting, return here and sign in with your new password.</li>
            </ul>
            <Link to="/login" className="cyber-btn-primary w-full block text-center">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-cyber-muted mb-4">
              Enter the email you used to register. We will send you a secure link to set a new
              password — your old password cannot be retrieved, only replaced.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-cyber-muted mb-1">Email</label>
                <input
                  type="email"
                  className="cyber-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <button type="submit" className="cyber-btn-primary w-full" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <p className="text-center text-cyber-muted text-sm mt-6">
              Remember your password?{' '}
              <Link to="/login" className="text-cyber-accent hover:underline">
                Back to Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
