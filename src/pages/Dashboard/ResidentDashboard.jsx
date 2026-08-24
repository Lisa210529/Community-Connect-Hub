import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import QuickActions from '../../components/ui/QuickActions';
import StatusBadge from '../../components/ui/StatusBadge';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
import ProjectRatingModal from '../../components/forms/ProjectRatingModal';
import { useAuth } from '../../context/AuthContext';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';
import { canResidentRateProject, getRatingEligibility } from '../../constants/ratings';
import { matchesWard, resolveWardId } from '../../utils/wdcHelpers';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ResidentDashboard() {
  const { user } = useAuth();
  const wardId = resolveWardId(user);
  const residentId = user?.uid ?? user?.id;

  const [projects, setProjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [ratedProjectIds, setRatedProjectIds] = useState(new Set());
  const [dataSource, setDataSource] = useState('firestore');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [ratingProject, setRatingProject] = useState(null);
  const [savingRating, setSavingRating] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projResult, annResult, myRatings] = await Promise.all([
        loadHybridCollection('projects', () => firestoreService.getProjects()),
        loadHybridCollection('announcements', () => firestoreService.getAnnouncements()),
        residentId ? firestoreService.getRatingsByResident(residentId) : Promise.resolve([]),
      ]);

      setProjects(projResult.data.filter((p) => matchesWard(p, user)));
      setAnnouncements(
        annResult.data
          .filter(
            (a) =>
              a.isActive !== false
              && (a.targetAudience === 'all'
                || a.targetAudience === 'residents'
                || a.ward === 'All Wards'
                || matchesWard(a, user)),
          )
          .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)),
      );
      setRatedProjectIds(new Set(myRatings.map((r) => r.projectId).filter(Boolean)));
      setDataSource(projResult.dataSource);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user, residentId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const rateableProjects = useMemo(
    () => projects.filter(
      (p) => canResidentRateProject(p, { alreadyRated: ratedProjectIds.has(p.id) }),
    ),
    [projects, ratedProjectIds],
  );

  const upcomingRatingProjects = useMemo(
    () => projects.filter((p) => {
      if (ratedProjectIds.has(p.id)) return false;
      const eligibility = getRatingEligibility(p, { alreadyRated: false });
      return eligibility.reason === 'before_mid_date';
    }),
    [projects, ratedProjectIds],
  );

  const latestProjects = useMemo(
    () => [...projects]
      .sort((a, b) => new Date(b.dateLogged ?? 0) - new Date(a.dateLogged ?? 0))
      .slice(0, 5),
    [projects],
  );

  const quickActions = [
    { label: 'View Projects', to: '/projects', icon: 'fa-folder-open' },
    { label: 'Submit Requests', to: '/requests', icon: 'fa-inbox' },
    { label: 'View Announcements', to: '/announcements', icon: 'fa-bullhorn' },
  ];

  async function handleSubmitRating({ scores, overallScore, comment, evidencePhotoName, evidencePhotoData }) {
    if (!ratingProject || !residentId) return;
    if (!canResidentRateProject(ratingProject, { alreadyRated: ratedProjectIds.has(ratingProject.id) })) {
      setError('This project is not open for rating yet. Rating opens at the project mid-date.');
      return;
    }
    setSavingRating(true);
    setError('');
    try {
      await firestoreService.createRating({
        projectId: ratingProject.id,
        proposalId: ratingProject.proposalId ?? null,
        projectName: ratingProject.name,
        residentId,
        residentName: user?.name ?? user?.fullName ?? 'Resident',
        ward: ratingProject.ward || user?.ward,
        wardId: ratingProject.wardId || wardId,
        zone: ratingProject.zone || null,
        fundingSource: ratingProject.fundingSource ?? null,
        ...scores,
        overallScore,
        score: overallScore,
        rating: overallScore,
        comment,
        evidencePhotoName,
        evidencePhotoData,
        isAnonymous: false,
      });

      const stakeholders = await firestoreService.findAllStakeholders();
      await Promise.all(
        stakeholders.map((s) =>
          firestoreService.createNotification({
            userId: s.uid ?? s.id,
            type: 'project_rating',
            title: 'New Project Rating & Evidence',
            message: `${user?.name ?? 'A resident'} rated "${ratingProject.name}" (${overallScore}/5) with photo evidence.`,
            wardId: ratingProject.wardId || wardId,
            projectId: ratingProject.id,
          }).catch(() => null),
        ),
      );

      setSuccessMessage('Thank you! Your rating and photo evidence were submitted.');
      setRatingProject(null);
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Failed to submit rating.');
    } finally {
      setSavingRating(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-cyber-accent">Resident Dashboard</h1>
          <DataSourceIndicator source={dataSource} />
        </div>
        <p className="text-cyber-muted text-sm mt-1">
          Welcome back, {user?.name}. Track ward projects, submit requests, and rate funded work.
        </p>
      </header>

      {successMessage && (
        <div className="p-3 rounded-lg bg-status-completed/10 border border-status-completed/30 text-status-completed text-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
          {error}
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-cyber-muted uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <QuickActions actions={quickActions} />
      </section>

      <section className="cyber-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-cyber-text">Rate Funded Projects</h2>
        </div>
        <p className="text-sm text-cyber-muted mb-4">
          Rate funded projects in your ward from the project mid-date until completion. Upload photo
          evidence so funding stakeholders and provincial government can monitor progress.
        </p>
        {loading ? (
          <p className="text-cyber-muted text-sm animate-pulse">Loading projects…</p>
        ) : rateableProjects.length === 0 && upcomingRatingProjects.length === 0 ? (
          <p className="text-cyber-muted text-sm">
            No funded projects ready to rate right now. Check back after a project reaches its
            mid-date in your ward.
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingRatingProjects.map((project) => {
              const { midDate } = getRatingEligibility(project);
              return (
                <div
                  key={`upcoming-${project.id}`}
                  className="p-4 rounded-lg bg-slate-bg/60 border border-slate-border border-dashed"
                >
                  <p className="font-medium text-cyber-text">{project.name}</p>
                  <p className="text-xs text-cyber-muted mt-0.5">
                    Rating opens {midDate ? formatDate(midDate.toISOString()) : 'at mid-date'}
                    {project.startDate && project.endDate
                      ? ` (${formatDate(project.startDate)} – ${formatDate(project.endDate)})`
                      : ''}
                  </p>
                </div>
              );
            })}
            {rateableProjects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-slate-bg border border-slate-border"
              >
                <div>
                  <p className="font-medium text-cyber-text">{project.name}</p>
                  <p className="text-xs text-cyber-muted mt-0.5">
                    {project.category} · {project.zone || project.ward} · {formatDate(project.dateLogged)}
                    {project.startDate && project.endDate
                      ? ` · ${formatDate(project.startDate)} – ${formatDate(project.endDate)}`
                      : ''}
                  </p>
                  {project.fundingSource && (
                    <p className="text-xs text-cyber-muted mt-1">
                      Funded by {project.fundingSource}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={project.status} />
                  <button
                    type="button"
                    onClick={() => setRatingProject(project)}
                    className="cyber-btn-primary text-xs py-1.5 px-3"
                  >
                    Rate & Upload Photo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="cyber-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-cyber-text">Latest Projects</h2>
          <Link to="/projects" className="text-sm text-cyber-accent hover:underline">
            View all
          </Link>
        </div>
        {latestProjects.length === 0 ? (
          <p className="text-cyber-muted text-sm">No projects found for your ward yet.</p>
        ) : (
          <div className="space-y-3">
            {latestProjects.map((project) => (
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
            {announcements.slice(0, 3).map((ann) => (
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

      <ProjectRatingModal
        open={!!ratingProject}
        project={ratingProject}
        onClose={() => setRatingProject(null)}
        onSubmit={handleSubmitRating}
        saving={savingRating}
      />
    </div>
  );
}
