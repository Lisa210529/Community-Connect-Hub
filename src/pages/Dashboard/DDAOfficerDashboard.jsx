import QuickActions from '../../components/ui/QuickActions';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const MADANG_URBAN_LLG_WARDS = ['Ward 1 Madang Urban', 'Ward 2 Alexishafen'];

const MADANG_DISTRICT_WARDS = [
  'Ward 1 Madang Urban',
  'Ward 2 Alexishafen',
  'Ward 3 Kuluguma',
  'Ward 4 Bongu',
  'Ward 5 Nabasa',
  'Ward 6 Simbai Settlement',
  'Madang District',
];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-PG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function DDAOfficerDashboard() {
  const { user } = useAuth();
  const { getData } = useData();
  const data = getData();

  const districtProjects = (data?.projects ?? []).filter((p) =>
    MADANG_DISTRICT_WARDS.some((w) => p.ward === w || p.location?.includes('Madang')),
  );

  const urbanProjects = districtProjects.filter((p) =>
    MADANG_URBAN_LLG_WARDS.includes(p.ward),
  );

  const pendingDistrict = districtProjects.filter((p) => p.status === 'Pending District');
  const pendingUrban = urbanProjects.filter((p) =>
    ['Pending District', 'Pending LLG', 'Pending WDC'].includes(p.status),
  );

  const completed = districtProjects.filter((p) => p.status === 'Completed');
  const completionRate =
    districtProjects.length === 0
      ? 0
      : Math.round((completed.length / districtProjects.length) * 100);

  const dsipProjects = districtProjects.filter((p) => p.fundingSource === 'DSIP');
  const upcomingMeetings = (data?.meetings ?? [])
    .filter((m) => m.ward === 'Madang District' && m.status === 'Scheduled')
    .slice(0, 3);

  const recentPending = [...pendingDistrict]
    .sort((a, b) => new Date(b.dateLogged) - new Date(a.dateLogged))
    .slice(0, 5);

  const quickActions = [
    { label: 'DSIP Pipeline', to: '/projects', icon: 'fa-project-diagram' },
    { label: 'Approve Projects', to: '/projects', icon: 'fa-check-double' },
    { label: 'District Reports', to: '/reports', icon: 'fa-chart-bar' },
    { label: 'Urban LLG Focus', to: '/projects', icon: 'fa-city' },
    { label: 'Meeting Schedule', to: '/meetings', icon: 'fa-calendar' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-cyber-accent">DDA Officer Dashboard</h1>
        <p className="text-cyber-muted text-sm mt-1">
          Madang District · Madang Urban LLG focus · {user?.name}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="District Projects"
          value={districtProjects.length}
          icon="fa-folder-open"
        />
        <StatCard
          label="Urban LLG Projects"
          value={urbanProjects.length}
          icon="fa-city"
          accent="text-cyber-accent"
        />
        <StatCard
          label="Pending District"
          value={pendingDistrict.length}
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
          <h2 className="text-lg font-semibold text-cyber-text mb-1">
            Madang Urban LLG Overview
          </h2>
          <p className="text-sm text-cyber-muted mb-4">
            Ward 1 Madang Urban and Ward 2 Alexishafen — district priority area
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-slate-bg border border-slate-border text-center">
              <p className="text-xl font-bold text-cyber-accent">{urbanProjects.length}</p>
              <p className="text-xs text-cyber-muted">Total Projects</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-bg border border-slate-border text-center">
              <p className="text-xl font-bold text-status-pending">{pendingUrban.length}</p>
              <p className="text-xs text-cyber-muted">Pending Action</p>
            </div>
          </div>
          <div className="space-y-2">
            {MADANG_URBAN_LLG_WARDS.map((ward) => {
              const wardProjects = urbanProjects.filter((p) => p.ward === ward);
              return (
                <div
                  key={ward}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-bg border border-slate-border"
                >
                  <span className="text-sm text-cyber-text">{ward}</span>
                  <span className="text-xs text-cyber-muted">
                    {wardProjects.length} projects
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="cyber-card">
          <h2 className="text-lg font-semibold text-cyber-text mb-4">District Snapshot</h2>
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-cyber-muted">DSIP Funded Projects</span>
              <span className="text-cyber-text font-medium">{dsipProjects.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-cyber-muted">In Progress</span>
              <span className="text-cyber-text font-medium">
                {districtProjects.filter((p) => p.status === 'In Progress').length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-cyber-muted">Awaiting Provincial Review</span>
              <span className="text-cyber-text font-medium">
                {districtProjects.filter((p) => p.status === 'Pending Provincial').length}
              </span>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-cyber-muted uppercase tracking-wide mb-3">
            Upcoming District Meetings
          </h3>
          {upcomingMeetings.length === 0 ? (
            <p className="text-cyber-muted text-sm">No scheduled district meetings.</p>
          ) : (
            <div className="space-y-2">
              {upcomingMeetings.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-lg bg-slate-bg border border-slate-border"
                >
                  <p className="text-sm font-medium text-cyber-text">{m.title}</p>
                  <p className="text-xs text-cyber-muted mt-1">
                    {formatDate(m.date)} · {m.time}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="cyber-card">
        <h2 className="text-lg font-semibold text-cyber-text mb-4">
          Pending District Approvals
        </h2>
        {recentPending.length === 0 ? (
          <p className="text-cyber-muted text-sm">No projects awaiting district approval.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cyber-muted border-b border-slate-border text-left">
                  <th className="py-2 pr-4 font-medium">Project</th>
                  <th className="py-2 pr-4 font-medium">Ward</th>
                  <th className="py-2 pr-4 font-medium">Budget</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Logged</th>
                </tr>
              </thead>
              <tbody>
                {recentPending.map((p) => (
                  <tr key={p.id} className="border-b border-slate-border/50">
                    <td className="py-3 pr-4 text-cyber-text">{p.name}</td>
                    <td className="py-3 pr-4 text-cyber-muted">{p.ward}</td>
                    <td className="py-3 pr-4 text-cyber-muted">
                      K {p.budget.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-3 text-cyber-muted">{formatDate(p.dateLogged)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
