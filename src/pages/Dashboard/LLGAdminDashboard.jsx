import QuickActions from '../../components/ui/QuickActions';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const NABASA_LLG_WARDS = [
  'Ward 1 Madang Urban',
  'Ward 2 Alexishafen',
  'Ward 3 Kuluguma',
  'Ward 4 Bongu',
  'Ward 5 Nabasa',
  'Ward 6 Simbai Settlement',
];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-PG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function LLGAdminDashboard() {
  const { user } = useAuth();
  const { getData } = useData();
  const data = getData();

  const llgProjects = (data?.projects ?? []).filter((p) =>
    NABASA_LLG_WARDS.some((w) => p.ward === w),
  );

  const pendingApprovals = llgProjects.filter((p) => p.status === 'Pending LLG');
  const completedProjects = llgProjects.filter((p) => p.status === 'Completed');
  const completionRate =
    llgProjects.length === 0
      ? 0
      : Math.round((completedProjects.length / llgProjects.length) * 100);

  const wardsWithProjects = new Set(llgProjects.map((p) => p.ward));
  const totalWards = NABASA_LLG_WARDS.length;

  const recentPending = [...pendingApprovals]
    .sort((a, b) => new Date(b.dateLogged) - new Date(a.dateLogged))
    .slice(0, 5);

  const quickActions = [
    { label: 'Approve Projects', to: '/projects', icon: 'fa-check-double' },
    { label: 'LLG Reports', to: '/reports', icon: 'fa-chart-bar' },
    { label: 'Ward Monitoring', to: '/reports', icon: 'fa-map-marked-alt' },
    { label: 'Manage Users', to: '/profile', icon: 'fa-users-cog' },
    { label: 'View Projects', to: '/projects', icon: 'fa-folder-open' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-cyber-accent">LLG Admin Dashboard</h1>
        <p className="text-cyber-muted text-sm mt-1">
          Nabasa LLG · {user?.name} · Monitor ward projects and approvals across the LLG
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Wards" value={totalWards} icon="fa-map-marked-alt" />
        <StatCard label="Total Projects" value={llgProjects.length} icon="fa-folder-open" />
        <StatCard
          label="Pending Approvals"
          value={pendingApprovals.length}
          icon="fa-clock"
          accent="text-status-pending"
        />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon="fa-chart-line"
          accent="text-status-completed"
        />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-cyber-muted uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <QuickActions actions={quickActions} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="cyber-card">
          <h2 className="text-lg font-semibold text-cyber-text mb-4">Pending LLG Approvals</h2>
          {recentPending.length === 0 ? (
            <p className="text-cyber-muted text-sm">No projects awaiting LLG approval.</p>
          ) : (
            <div className="space-y-3">
              {recentPending.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-lg bg-slate-bg border border-slate-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-cyber-text">{project.name}</p>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="text-sm text-cyber-muted mt-1">
                    {project.ward} · K {project.budget.toLocaleString()}
                  </p>
                  <p className="text-xs text-cyber-muted mt-1">{formatDate(project.dateLogged)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="cyber-card">
          <h2 className="text-lg font-semibold text-cyber-text mb-4">Ward Coverage</h2>
          <div className="space-y-2">
            {NABASA_LLG_WARDS.map((ward) => {
              const count = llgProjects.filter((p) => p.ward === ward).length;
              const active = wardsWithProjects.has(ward);
              return (
                <div
                  key={ward}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-bg border border-slate-border"
                >
                  <span className="text-sm text-cyber-text">{ward}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-cyber-muted">{count} projects</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        active
                          ? 'border-status-completed/40 text-status-completed bg-status-completed/10'
                          : 'border-slate-border text-cyber-muted'
                      }`}
                    >
                      {active ? 'Active' : 'No projects'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
