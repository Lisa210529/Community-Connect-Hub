import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../ui/NotificationBell';

export default function Header({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border px-4 lg:px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg border border-border text-text-primary"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <i className="fas fa-bars text-lg" aria-hidden="true" />
        </button>
        {title && <h1 className="text-lg font-semibold text-text-primary truncate">{title}</h1>}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-text-primary">{user?.name}</p>
          <p className="text-xs text-text-secondary">{user?.email}</p>
        </div>
        <NotificationBell />
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-secondary hover:text-primary hover:border-primary transition-colors text-sm"
        >
          <i className="fas fa-sign-out-alt" aria-hidden="true" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
