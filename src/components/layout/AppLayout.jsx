import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants';
import { hasAnyRole } from '../../constants/roleMapping';
import { getInitials } from '../../utils/validation';
import Logo from '../common/Logo';

const NAV_ITEMS = [
  { to: '/resident', label: 'Resident', icon: 'fa-home', roles: ['resident'] },
  { to: '/wdc', label: 'WDC', icon: 'fa-users', roles: ['wdc-member'] },
  {
    to: '/government',
    label: 'Government',
    icon: 'fa-landmark',
    roles: ['councillor', 'mayor', 'provincial-admin', 'stakeholder'],
  },
  {
    to: '/projects',
    label: 'Projects',
    icon: 'fa-project-diagram',
    roles: ['provincial-admin', 'stakeholder'],
  },
  { to: '/reports', label: 'Reports', icon: 'fa-chart-bar', roles: null },
  { to: '/feedback', label: 'Feedback', icon: 'fa-comment-dots', roles: null },
  { to: '/admin', label: 'Admin', icon: 'fa-cog', roles: ['system-admin'] },
];

function canSeeNavItem(item, role) {
  if (!item.roles) return true;
  return hasAnyRole(role, item.roles);
}

export default function AppLayout() {
  const { profile, role, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const visibleNav = NAV_ITEMS.filter((item) => canSeeNavItem(item, role));

  return (
    <div className="app-wrapper active">
      <aside className="sidebar">
        <div className="sidebar-brand flex justify-center py-3">
          <Logo size="sidebar" className="w-auto" />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Main Menu</div>
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <i className={`fas ${item.icon}`} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">
              {getInitials(profile?.firstName, profile?.lastName)}
            </div>
            <div className="user-details">
              <div className="name">
                {profile?.firstName} {profile?.lastName}
              </div>
              <div className="role">{ROLES[role] ?? role}</div>
              {profile?.ward && <div className="ward">Ward: {profile.ward}</div>}
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-navbar">
          <div className="page-title">
            <h4>Dashboard</h4>
            <p>
              Welcome back, <span>{profile?.firstName ?? 'User'}</span>!
            </p>
          </div>
          <div className="navbar-actions">
            <button type="button" className="btn-logout" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt me-2" />
              Logout
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
