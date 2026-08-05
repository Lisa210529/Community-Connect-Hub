import QuickActions from '../../components/ui/QuickActions';
import StatusBadge from '../../components/ui/StatusBadge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { updateItem } from '../../services/localStorageService';

const SCORECARD_CATEGORIES = [
  { key: 'engagement', label: 'Community Engagement', icon: 'fa-users' },
  { key: 'delivery', label: 'Project Delivery', icon: 'fa-tasks' },
  { key: 'response', label: 'Request Response', icon: 'fa-reply' },
  { key: 'wdc', label: 'WDC Participation', icon: 'fa-handshake' },
  { key: 'transparency', label: 'Transparency & Reporting', icon: 'fa-file-alt' },
];

function matchesWard(itemWard, userWard) {
  if (!userWard) return true;
  if (!itemWard) return false;
  return itemWard === userWard || itemWard.includes(userWard) || userWard.includes(itemWard);
}

function StarRating({ rating, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <i
          key={i}
          className={`fas fa-star text-sm ${
            i < rating ? 'text-cyber-accent' : 'text-slate-border'
          }`}
        />
      ))}
    </div>
  );
}

function computeScorecard(data, ward) {
  const projects = (data?.projects ?? []).filter((p) => matchesWard(p.ward, ward));
  const requests = (data?.requests ?? []).filter((r) => matchesWard(r.ward, ward));
  const meetings = (data?.meetings ?? []).filter((m) => matchesWard(m.ward, ward));
  const announcements = (data?.announcements ?? []).filter(
    (a) => matchesWard(a.ward, ward) && a.createdBy,
  );

  const completedProjects = projects.filter((p) => p.status === 'Completed').length;
  const delivery =
    projects.length === 0 ? 3 : Math.min(5, Math.round((completedProjects / projects.length) * 5) + 2);

  const resolvedRequests = requests.filter((r) =>
    ['Resolved', 'In Progress'].includes(r.status),
  ).length;
  const response =
    requests.length === 0 ? 4 : Math.min(5, Math.round((resolvedRequests / requests.length) * 5));

  const completedMeetings = meetings.filter((m) => m.status === 'Completed').length;
  const wdc = meetings.length === 0 ? 4 : Math.min(5, Math.round((completedMeetings / meetings.length) * 5));

  const engagement = Math.min(5, 3 + Math.floor(requests.length / 3));
  const transparency = Math.min(5, 2 + announcements.length);

  const ratings = {
    engagement,
    delivery,
    response,
    wdc,
    transparency,
  };

  const overall = (
    Object.values(ratings).reduce((sum, r) => sum + r, 0) / SCORECARD_CATEGORIES.length
  ).toFixed(1);

  return { ratings, overall };
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-PG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function CouncillorDashboard() {
  const { user } = useAuth();
  const { getData, refresh } = useData();
  const data = getData();

  const ward = user?.ward ?? '';
  const { ratings, overall } = computeScorecard(data, ward);

  const pendingRequests = (data?.requests ?? [])
    .filter((r) => matchesWard(r.ward, ward) && r.status === 'Pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const loggedProjects = (data?.projects ?? []).filter((p) => matchesWard(p.ward, ward)).length;

  function handleRequestAction(id, status) {
    updateItem('requests', id, { status });
    refresh();
  }

  const quickActions = [
    { label: 'Log Project', to: '/projects', icon: 'fa-plus-circle' },
    { label: 'Manage Requests', to: '/requests', icon: 'fa-inbox' },
    { label: 'Meeting Schedule', to: '/meetings', icon: 'fa-calendar' },
    { label: 'Document Generator', to: '/documents', icon: 'fa-file-pdf' },
    { label: 'Post Announcements', to: '/announcements', icon: 'fa-bullhorn' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-cyber-accent">Councillor Dashboard</h1>
        <p className="text-cyber-muted text-sm mt-1">
          {ward || 'Your ward'} · {loggedProjects} logged projects · {pendingRequests.length} pending
          requests
        </p>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-cyber-muted uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <QuickActions actions={quickActions} />
      </section>

      <section className="cyber-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-cyber-text">Performance Scorecard</h2>
            <p className="text-sm text-cyber-muted">Ward performance across five key categories</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs text-cyber-muted uppercase tracking-wide">Overall Rating</p>
            <p className="text-3xl font-bold text-cyber-accent">{overall}</p>
            <StarRating rating={Math.round(Number(overall))} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SCORECARD_CATEGORIES.map(({ key, label, icon }) => (
            <div
              key={key}
              className="p-4 rounded-lg bg-slate-bg border border-slate-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <i className={`fas ${icon} text-cyber-accent`} />
                <p className="text-sm font-medium text-cyber-text">{label}</p>
              </div>
              <StarRating rating={ratings[key]} />
              <p className="text-xs text-cyber-muted mt-2">{ratings[key]} / 5 stars</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cyber-card">
        <h2 className="text-lg font-semibold text-cyber-text mb-4">Pending Requests</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-cyber-muted text-sm">No pending requests for your ward.</p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-lg bg-slate-bg border border-slate-border"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-cyber-text">{req.category}</p>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-sm text-cyber-muted mt-1">{req.description}</p>
                    <p className="text-xs text-cyber-muted mt-2">
                      {req.residentName} · {formatDate(req.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRequestAction(req.id, 'In Progress')}
                      className="cyber-btn-success text-sm"
                    >
                      <i className="fas fa-check mr-1.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestAction(req.id, 'Rejected')}
                      className="cyber-btn-danger text-sm"
                    >
                      <i className="fas fa-times mr-1.5" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
