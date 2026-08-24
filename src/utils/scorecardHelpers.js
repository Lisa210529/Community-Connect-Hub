import { normalizeRequestStatus } from './wdcHelpers';

/** Councillor performance scorecard (heuristic from ward activity data). */
export function computeScorecard(projects, communityNeeds, proposals, announcements) {
  const completedProjects = projects.filter((p) => p.status === 'Completed').length;
  const delivery =
    projects.length === 0 ? 3 : Math.min(5, Math.round((completedProjects / projects.length) * 5) + 2);

  const forwarded = communityNeeds.filter(
    (n) => normalizeRequestStatus(n.status) === 'forwarded_to_councillor',
  ).length;
  const response = forwarded === 0 ? 4 : Math.min(5, 3 + forwarded);

  const proposalsCount = proposals.length;
  const engagement = Math.min(5, 3 + Math.floor(proposalsCount / 2));
  const transparency = Math.min(5, 2 + announcements.length);

  const ratings = {
    engagement,
    delivery,
    response,
    proposals: Math.min(5, 2 + proposalsCount),
    transparency,
  };
  const overall = (Object.values(ratings).reduce((sum, r) => sum + r, 0) / 5).toFixed(1);
  return { ratings, overall };
}

/** Resident dashboard quick stats from ward-scoped lists. */
export function computeResidentDashboardStats(projects, requests, complaints) {
  const completed = projects.filter((p) => String(p.status).toLowerCase() === 'completed').length;
  const inProgress = projects.filter((p) => {
    const s = String(p.status).toLowerCase();
    return s === 'in progress' || s === 'funded' || s === 'implemented';
  }).length;
  const openRequests = requests.filter((r) => {
    const s = String(r.status ?? '').toLowerCase();
    return s === 'pending' || s === 'submitted' || s === 'under review';
  }).length;
  const openComplaints = complaints.filter((c) => String(c.status ?? '').toLowerCase() === 'pending').length;
  const ratings = projects.map((p) => Number(p.averageRating ?? p.avgRating ?? 0)).filter((n) => n > 0);
  const avgRating = ratings.length
    ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
    : 0;

  return {
    totalProjects: projects.length,
    completed,
    inProgress,
    openRequests,
    openComplaints,
    avgRating,
  };
}
