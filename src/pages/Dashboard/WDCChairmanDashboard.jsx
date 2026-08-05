import { Link } from 'react-router-dom';
import QuickActions from '../../components/ui/QuickActions';
import StatusBadge from '../../components/ui/StatusBadge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { updateItem } from '../../services/localStorageService';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = dateStr.includes('T') ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-PG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function matchesWard(itemWard, userWard) {
  if (!userWard) return true;
  if (!itemWard) return false;
  return itemWard === userWard || itemWard.includes(userWard) || userWard.includes(itemWard);
}

export default function WDCChairmanDashboard() {
  const { user } = useAuth();
  const { getData, refresh } = useData();
  const data = getData();

  const ward = user?.ward ?? '';

  const upcomingMeetings = (data?.meetings ?? [])
    .filter((m) => matchesWard(m.ward, ward) && ['Scheduled', 'In Progress'].includes(m.status))
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
    .slice(0, 5);

  const pendingResolutions = (data?.resolutions ?? []).filter((r) => r.status === 'Pending');

  const approvedProjects = (data?.projects ?? []).filter(
    (p) => matchesWard(p.ward, ward) && ['Funded', 'In Progress', 'Completed'].includes(p.status),
  ).length;

  function handleResolutionAction(id, status) {
    updateItem('resolutions', id, { status });
    refresh();
  }

  const quickActions = [
    { label: 'Schedule Meeting', to: '/meetings', icon: 'fa-calendar-plus' },
    { label: 'Manage Resolutions', to: '/resolutions', icon: 'fa-gavel' },
    { label: 'WDC Members', to: '/profile', icon: 'fa-users' },
    { label: 'Review Projects', to: '/projects', icon: 'fa-folder-open' },
    { label: 'Meeting Minutes', to: '/meetings', icon: 'fa-file-alt' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-cyber-accent">WDC Chairman Dashboard</h1>
        <p className="text-cyber-muted text-sm mt-1">
          {ward || 'Your ward'} · {approvedProjects} approved projects · {pendingResolutions.length}{' '}
          pending resolutions
        </p>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-cyber-muted uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <QuickActions actions={quickActions} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="cyber-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-cyber-text">Upcoming Meetings</h2>
            <Link to="/meetings" className="text-sm text-cyber-accent hover:underline">
              View all
            </Link>
          </div>
          {upcomingMeetings.length === 0 ? (
            <p className="text-cyber-muted text-sm">No upcoming meetings scheduled.</p>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="p-4 rounded-lg bg-slate-bg border border-slate-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-cyber-text">{meeting.title}</p>
                    <StatusBadge status={meeting.status} />
                  </div>
                  <p className="text-sm text-cyber-muted mt-1">
                    <i className="fas fa-calendar mr-1.5 text-cyber-accent" />
                    {formatDate(meeting.date)} at {meeting.time}
                  </p>
                  <p className="text-xs text-cyber-muted mt-2 line-clamp-2">
                    {meeting.agenda.split('\n')[0]}
                  </p>
                  {meeting.attendance?.length > 0 && (
                    <p className="text-xs text-cyber-muted mt-2">
                      {meeting.attendance.length} attendees expected
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="cyber-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-cyber-text">WDC Summary</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-bg border border-slate-border text-center">
              <p className="text-2xl font-bold text-cyber-accent">{upcomingMeetings.length}</p>
              <p className="text-xs text-cyber-muted mt-1">Upcoming Meetings</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-bg border border-slate-border text-center">
              <p className="text-2xl font-bold text-cyber-accent">{pendingResolutions.length}</p>
              <p className="text-xs text-cyber-muted mt-1">Pending Resolutions</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-bg border border-slate-border text-center">
              <p className="text-2xl font-bold text-status-completed">Active</p>
              <p className="text-xs text-cyber-muted mt-1">WDC Status</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-bg border border-slate-border text-center">
              <p className="text-2xl font-bold text-cyber-accent">{approvedProjects}</p>
              <p className="text-xs text-cyber-muted mt-1">Approved Projects</p>
            </div>
          </div>
        </section>
      </div>

      <section className="cyber-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-cyber-text">Pending Resolutions</h2>
          <Link to="/resolutions" className="text-sm text-cyber-accent hover:underline">
            View all
          </Link>
        </div>
        {pendingResolutions.length === 0 ? (
          <p className="text-cyber-muted text-sm">No resolutions awaiting WDC action.</p>
        ) : (
          <div className="space-y-3">
            {pendingResolutions.map((res) => (
              <div
                key={res.id}
                className="p-4 rounded-lg bg-slate-bg border border-slate-border"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-cyber-text">{res.title}</p>
                      <StatusBadge status={res.status} />
                    </div>
                    <p className="text-sm text-cyber-muted mt-1">{res.description}</p>
                    <p className="text-xs text-cyber-muted mt-2">
                      Votes: {res.votesFor} for · {res.votesAgainst} against ·{' '}
                      {formatDate(res.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleResolutionAction(res.id, 'Approved')}
                      className="cyber-btn-success text-sm"
                    >
                      <i className="fas fa-check mr-1.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolutionAction(res.id, 'Rejected')}
                      className="cyber-btn-danger text-sm"
                    >
                      <i className="fas fa-times mr-1.5" />
                      Reject
                    </button>
                    <Link to="/resolutions" className="cyber-btn-secondary text-sm inline-flex items-center">
                      <i className="fas fa-search mr-1.5" />
                      Review
                    </Link>
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
