import QuickActions from '../../components/ui/QuickActions';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const DISTRICT_MAP = {
  'Madang District': [
    'Ward 1 Madang Urban',
    'Ward 2 Alexishafen',
    'Ward 3 Kuluguma',
    'Ward 4 Bongu',
    'Ward 5 Nabasa',
    'Ward 6 Simbai Settlement',
    'Madang District',
  ],
  'Bogia District': ['Ward 12 Bogia Central'],
  'Rai Coast District': ['Ward 7 Bilbil', 'Ward 10 Tabibuga'],
  'Sumkar District': ['Ward 8 Kar Kar South'],
  'Usino-Bundi District': ['Ward 9 Usino', 'Ward 11 Bundi'],
  'Middle Ramu': ['Ward 6 Simbai Settlement'],
};

function resolveDistrict(ward, location = '') {
  for (const [district, wards] of Object.entries(DISTRICT_MAP)) {
    if (wards.includes(ward)) return district;
    if (location.includes(district.replace(' District', ''))) return district;
  }
  if (location.includes('Bogia')) return 'Bogia District';
  if (location.includes('Rai Coast')) return 'Rai Coast District';
  if (location.includes('Sumkar') || location.includes('Kar Kar')) return 'Sumkar District';
  if (location.includes('Usino') || location.includes('Bundi')) return 'Usino-Bundi District';
  if (location.includes('Middle Ramu') || location.includes('Simbai')) return 'Middle Ramu';
  if (location.includes('Madang')) return 'Madang District';
  return 'Other';
}

function buildDistrictSummary(projects) {
  const districts = {};

  projects.forEach((p) => {
    const district = resolveDistrict(p.ward, p.location);
    if (!districts[district]) {
      districts[district] = { total: 0, inProgress: 0, completed: 0, pending: 0 };
    }
    districts[district].total += 1;
    if (p.status === 'In Progress') districts[district].inProgress += 1;
    if (p.status === 'Completed') districts[district].completed += 1;
    if (p.status.startsWith('Pending')) districts[district].pending += 1;
  });

  return Object.entries(districts)
    .map(([name, stats]) => ({
      name,
      ...stats,
      completionRate:
        stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100),
    }))
    .sort((a, b) => b.total - a.total);
}

export default function ProvincialAdminDashboard() {
  const { user } = useAuth();
  const { getData } = useData();
  const data = getData();

  const projects = data?.projects ?? [];
  const users = data?.users ?? [];

  const pendingProvincial = projects.filter((p) => p.status === 'Pending Provincial');
  const inProgress = projects.filter((p) => p.status === 'In Progress');
  const completed = projects.filter((p) => p.status === 'Completed');
  const pendingUsers = users.filter((u) => !u.isApproved);
  const completionRate =
    projects.length === 0 ? 0 : Math.round((completed.length / projects.length) * 100);

  const districtSummary = buildDistrictSummary(projects);
  const totalDistricts = districtSummary.length;

  const quickActions = [
    { label: 'Provincial Projects', to: '/projects', icon: 'fa-folder-open' },
    { label: 'Analytics Reports', to: '/reports', icon: 'fa-chart-pie' },
    { label: 'Approve Projects', to: '/projects', icon: 'fa-check-double' },
    { label: 'Performance Monitor', to: '/reports', icon: 'fa-tachometer-alt' },
    { label: 'User Approvals', to: '/profile', icon: 'fa-user-check' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-cyber-accent">Provincial Admin Dashboard</h1>
        <p className="text-cyber-muted text-sm mt-1">
          Madang Province · {user?.name} · Provincial oversight and analytics
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={projects.length} icon="fa-folder-open" />
        <StatCard
          label="Pending Provincial"
          value={pendingProvincial.length}
          icon="fa-clock"
          accent="text-status-pending"
        />
        <StatCard
          label="In Progress"
          value={inProgress.length}
          icon="fa-spinner"
          accent="text-status-active"
        />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon="fa-chart-line"
          accent="text-status-completed"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Districts Covered" value={totalDistricts} icon="fa-map" />
        <StatCard
          label="Completed Projects"
          value={completed.length}
          icon="fa-check-circle"
          accent="text-status-completed"
        />
        <StatCard
          label="Pending User Approvals"
          value={pendingUsers.length}
          icon="fa-user-clock"
          accent="text-status-pending"
        />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-cyber-muted uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <QuickActions actions={quickActions} />
      </section>

      <section className="cyber-card">
        <h2 className="text-lg font-semibold text-cyber-text mb-4">
          District Performance Summary
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-cyber-muted border-b border-slate-border text-left">
                <th className="py-2 pr-4 font-medium">District</th>
                <th className="py-2 pr-4 font-medium">Total</th>
                <th className="py-2 pr-4 font-medium">In Progress</th>
                <th className="py-2 pr-4 font-medium">Completed</th>
                <th className="py-2 pr-4 font-medium">Pending</th>
                <th className="py-2 font-medium">Completion %</th>
              </tr>
            </thead>
            <tbody>
              {districtSummary.map((row) => (
                <tr key={row.name} className="border-b border-slate-border/50 hover:bg-slate-bg/50">
                  <td className="py-3 pr-4 font-medium text-cyber-text">{row.name}</td>
                  <td className="py-3 pr-4 text-cyber-muted">{row.total}</td>
                  <td className="py-3 pr-4 text-cyber-muted">{row.inProgress}</td>
                  <td className="py-3 pr-4 text-cyber-muted">{row.completed}</td>
                  <td className="py-3 pr-4">
                    {row.pending > 0 ? (
                      <StatusBadge status="Pending" />
                    ) : (
                      <span className="text-cyber-muted">0</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span
                      className={
                        row.completionRate >= 50
                          ? 'text-status-completed font-medium'
                          : 'text-cyber-accent font-medium'
                      }
                    >
                      {row.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {pendingProvincial.length > 0 && (
        <section className="cyber-card">
          <h2 className="text-lg font-semibold text-cyber-text mb-4">
            Projects Awaiting Provincial Review
          </h2>
          <div className="space-y-3">
            {pendingProvincial.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-slate-bg border border-slate-border"
              >
                <div>
                  <p className="font-medium text-cyber-text">{p.name}</p>
                  <p className="text-sm text-cyber-muted">
                    {p.ward} · K {p.budget.toLocaleString()} · {p.fundingSource}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
