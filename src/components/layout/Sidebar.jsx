import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getNavForRole, ROLES } from '../../constants';
import { normalizeRole, isCouncillorUser } from '../../constants/roleMapping';

function isNavItemActive(path, location) {
  if (path === '/dashboard/councillor') {
    return location.pathname === '/dashboard/councillor';
  }
  if (path === '/dashboard/mayor') {
    return location.pathname === '/dashboard/mayor';
  }
  if (path === '/dashboard/mayor/wards') {
    return location.pathname.startsWith('/dashboard/mayor/wards');
  }
  const stakeholderBases = [
    '/dashboard/psip',
    '/dashboard/dsip',
    '/dashboard/dda',
    '/dashboard/ngo',
    '/dashboard/open-member',
  ];
  for (const base of stakeholderBases) {
    if (path === base) {
      return location.pathname === base;
    }
    if (path.startsWith(`${base}/`)) {
      return location.pathname === path;
    }
  }
  return location.pathname === path;
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const userRole = normalizeRole(user?.role);
  const navItems = getNavForRole(user?.role, user?.rawRole, user);
  const roleLabel = ROLES[user?.rawRole ?? userRole] ?? ROLES[userRole] ?? userRole;

  if (import.meta.env.DEV) {
    console.debug('[Sidebar] role:', user?.role, 'normalized:', userRole, 'nav:', navItems.map((n) => n.label));
  }

  const linkClass = (path) => {
    const active = isNavItemActive(path, location);
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-primary/10 text-primary border border-primary/30'
        : 'text-text-secondary hover:text-text-primary hover:bg-background'
    }`;
  };

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
          aria-label="Close menu"
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col shrink-0 transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <p className="font-bold text-text-primary">
              Community <span className="text-primary">Connect Hub</span>
            </p>
            <p className="text-xs text-text-secondary mt-1 capitalize">{roleLabel}</p>
            {isCouncillorUser(user) && (
              <p className="text-[10px] text-primary/80 mt-1">Councillor workspace</p>
            )}
          </div>
          <button type="button" className="lg:hidden text-text-secondary" onClick={onClose}>
            <i className="fas fa-times text-lg" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon }) => (
            <NavLink key={path} to={path} className={() => linkClass(path)} onClick={onClose}>
              <i className={`fas ${icon} w-4 text-center`} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
