import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function EmailSyncBanner() {
  const { user, signInEmail, emailSyncRequired } = useAuth();

  if (!emailSyncRequired || !user) return null;

  return (
    <div className="mb-6 p-4 rounded-lg bg-status-pending/10 border border-status-pending/40 text-sm">
      <p className="font-medium text-status-pending mb-1">Sign-in email needs updating</p>
      <p className="text-cyber-muted">
        You signed in with <strong className="text-text-primary">{signInEmail}</strong>, but your
        profile uses <strong className="text-text-primary">{user.email}</strong>. Until you sync,
        you must keep using the old email to sign in.
      </p>
      <Link
        to="/profile"
        className="inline-block mt-3 text-cyber-accent hover:underline font-medium"
      >
        Go to Profile to update sign-in email →
      </Link>
    </div>
  );
}
