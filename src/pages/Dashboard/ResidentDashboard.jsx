import { Link } from 'react-router-dom';
import QuickActions from '../../components/ui/QuickActions';
import StatusBadge from '../../components/ui/StatusBadge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-PG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function matchesWard(itemWard, userWard) {
  if (!userWard) return true;
  if (!itemWard) return false;
  return itemWard === userWard || itemWard.includes(userWard) || userWard.includes(itemWard);
}

export default function ResidentDashboard() {
  const { user } = useAuth();
  const { getData } = useData();
  const data = getData();

  const ward = user?.ward ?? '';
  const projects = (data?.projects ?? [])
    .filter((p) => matchesWard(p.ward, ward))
    .sort((a, b) => new Date(b.dateLogged) - new Date(a.dateLogged))
    .slice(0, 5);

  const announcements = (data?.announcements ?? [])
    .filter(
      (a) =>
        a.isActive &&
        (a.targetAudience === 'all' ||
          a.targetAudience === 'residents' ||
          a.ward === 'All Wards' ||
          matchesWard(a.ward, ward)),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const quickActions = [
    { label: 'View Projects', to: '/projects', icon: 'fa-folder-open' },
    { label: 'Submit Requests', to: '/requests', icon: 'fa-inbox' },
    { label: 'Rate Projects', to: '/projects', icon: 'fa-star' },
    { label: 'View Announcements', to: '/announcements', icon: 'fa-bullhorn' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-cyber-accent">Resident Dashboard</h1>
        <p className="text-cyber-muted text-sm mt-1">
          Welcome back, {user?.name}. Track ward projects, submit requests, and stay informed.
        </p>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-cyber-muted uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <QuickActions actions={quickActions} />
      </section>

      <section className="cyber-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-cyber-text">Latest Projects</h2>
          <Link to="/projects" className="text-sm text-cyber-accent hover:underline">
            View all
          </Link>
        </div>
        {projects.length === 0 ? (
          <p className="text-cyber-muted text-sm">No projects found for your ward yet.</p>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-slate-bg border border-slate-border"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-cyber-text truncate">{project.name}</p>
                  <p className="text-xs text-cyber-muted mt-0.5">
                    {project.category} · {project.ward} · {formatDate(project.dateLogged)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={project.status} />
                  <Link to="/projects" className="text-xs text-cyber-accent hover:underline">
                    View
                  </Link>
                  <Link to="/projects" className="text-xs text-cyber-accent hover:underline">
                    Rate
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="cyber-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-cyber-text">Announcements</h2>
          <Link to="/announcements" className="text-sm text-cyber-accent hover:underline">
            View all
          </Link>
        </div>
        {announcements.length === 0 ? (
          <p className="text-cyber-muted text-sm">No active announcements at this time.</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <article
                key={ann.id}
                className="p-4 rounded-lg bg-slate-bg border border-slate-border"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-cyber-text">{ann.title}</h3>
                  <StatusBadge status={ann.priority} />
                </div>
                <p className="text-sm text-cyber-muted mt-2 line-clamp-2">{ann.content}</p>
                <p className="text-xs text-cyber-muted mt-2">
                  {ann.ward} · {formatDate(ann.createdAt)} · {ann.createdBy}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
