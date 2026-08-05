import QuickActions from '../../components/ui/QuickActions';
import StatCard from '../../components/ui/StatCard';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants';

const ROLE_QUICK_ACTIONS = {
  mayor: [
    { label: 'Approve Projects', to: '/projects', icon: 'fa-check-double' },
    { label: 'LLG Reports', to: '/reports', icon: 'fa-chart-bar' },
    { label: 'Ward Monitoring', to: '/reports', icon: 'fa-map-marked-alt' },
    { label: 'Announcements', to: '/announcements', icon: 'fa-bullhorn' },
  ],
  pec: [
    { label: 'Provincial Projects', to: '/projects', icon: 'fa-folder-open' },
    { label: 'Analytics Reports', to: '/reports', icon: 'fa-chart-pie' },
    { label: 'Approve Projects', to: '/projects', icon: 'fa-check-double' },
  ],
  psip: [
    { label: 'PSIP Pipeline', to: '/projects', icon: 'fa-project-diagram' },
    { label: 'Funded Projects', to: '/projects', icon: 'fa-coins' },
    { label: 'Reports', to: '/reports', icon: 'fa-chart-bar' },
  ],
  dsip: [
    { label: 'DSIP Pipeline', to: '/projects', icon: 'fa-project-diagram' },
    { label: 'District Projects', to: '/projects', icon: 'fa-folder-open' },
    { label: 'Reports', to: '/reports', icon: 'fa-chart-bar' },
  ],
  ngo: [
    { label: 'View Projects', to: '/projects', icon: 'fa-folder-open' },
    { label: 'Announcements', to: '/announcements', icon: 'fa-bullhorn' },
    { label: 'Community Reports', to: '/reports', icon: 'fa-chart-bar' },
  ],
  'open-member': [
    { label: 'Constituency Projects', to: '/projects', icon: 'fa-folder-open' },
    { label: 'Performance Reports', to: '/reports', icon: 'fa-chart-line' },
    { label: 'Ward Overview', to: '/reports', icon: 'fa-map' },
  ],
};

export default function StakeholderDashboard() {
  const { user } = useAuth();
  const { getData } = useData();
  const data = getData();
  const role = user?.role ?? 'pec';
  const roleLabel = ROLES[role] ?? role;
  const projects = data?.projects ?? [];
  const pending = projects.filter((p) => p.status?.startsWith('Pending')).length;
  const inProgress = projects.filter((p) => p.status === 'In Progress').length;
  const completed = projects.filter((p) => p.status === 'Completed').length;
  const quickActions = ROLE_QUICK_ACTIONS[role] ?? ROLE_QUICK_ACTIONS.pec;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-cyber-accent">{roleLabel} Dashboard</h1>
        <p className="text-cyber-muted text-sm mt-1">
          Welcome, {user?.name} · {user?.ward ?? 'Madang Province'}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={projects.length} icon="fa-folder-open" />
        <StatCard label="Pending" value={pending} icon="fa-clock" accent="text-status-pending" />
        <StatCard label="In Progress" value={inProgress} icon="fa-spinner" accent="text-cyber-accent" />
        <StatCard label="Completed" value={completed} icon="fa-check-circle" accent="text-status-completed" />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-cyber-muted uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <QuickActions actions={quickActions} />
      </section>

      <section className="cyber-card">
        <h2 className="text-lg font-semibold text-cyber-text mb-4">Recent Projects</h2>
        <div className="space-y-3">
          {projects.slice(0, 5).map((p) => (
            <div key={p.id} className="p-4 rounded-lg bg-slate-bg border border-slate-border flex justify-between gap-4">
              <div>
                <p className="font-medium text-cyber-text">{p.name}</p>
                <p className="text-xs text-cyber-muted mt-1">{p.ward} · {p.fundingSource}</p>
              </div>
              <span className="text-xs text-cyber-accent shrink-0">{p.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
