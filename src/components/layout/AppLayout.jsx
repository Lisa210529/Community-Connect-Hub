import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../constants';
import { getInitials } from '../../utils/validation';

const NAV_ITEMS = [
  { to: '/resident', label: 'Resident', icon: 'fa-home', roles: ['resident'] },
  { to: '/wdc', label: 'WDC', icon: 'fa-users', roles: ['wdc_chairperson', 'wdc_secretary', 'wdc_member'] },
  {
    to: '/government',
    label: 'Government',
    icon: 'fa-landmark',
    roles: ['councillor', 'llg_admin', 'dda_officer', 'provincial_admin'],
  },
  {
    to: '/projects',
    label: 'Projects',
    icon: 'fa-project-diagram',
    roles: ['pec_member', 'psip_coordinator', 'dsip_coordinator', 'funding_agency'],
  },
  { to: '/reports', label: 'Reports', icon: 'fa-chart-bar', roles: null },
  { to: '/feedback', label: 'Feedback', icon: 'fa-comment-dots', roles: null },
  { to: '/admin', label: 'Admin', icon: 'fa-cog', roles: ['system_admin'] },
];

function canSeeNavItem(item, role) {
  if (!item.roles) return true;
  return item.roles.includes(role);
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
        <div className="sidebar-brand">
          <h4>
            <i className="fas fa-hub me-2" />
            Connect Hub
          </h4>
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
              <div className="role">{ROLE_LABELS[role] ?? role}</div>
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
