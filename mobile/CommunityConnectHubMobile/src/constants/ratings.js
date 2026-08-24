export const RATEABLE_PROJECT_STATUSES = new Set([
  'funded',
  'Funded',
  'implemented',
  'Implemented',
  'in progress',
  'In Progress',
  'completed',
  'Completed',
]);

export function canRateProjectStatus(status) {
  return RATEABLE_PROJECT_STATUSES.has(String(status ?? '').trim());
}

function parseProjectDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function computeProjectMidDate(startDate, endDate) {
  const start = parseProjectDate(startDate);
  const end = parseProjectDate(endDate);
  if (!start || !end || end <= start) return null;
  return new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
}

function getProjectTimeline(project) {
  const startDate = project?.startDate ?? project?.projectStartDate ?? null;
  const endDate = project?.endDate ?? project?.projectEndDate ?? null;
  const midDate = startDate && endDate ? computeProjectMidDate(startDate, endDate) : null;
  return { startDate, endDate, midDate };
}

export function isRatingWindowOpen(project, now = new Date()) {
  const { startDate, endDate } = getProjectTimeline(project);
  if (!startDate || !endDate) return true;
  const mid = computeProjectMidDate(startDate, endDate);
  if (!mid) return true;
  return startOfDay(now) >= startOfDay(mid);
}

export function canResidentRateProject(project, { alreadyRated = false, now = new Date() } = {}) {
  if (alreadyRated) return false;
  if (!canRateProjectStatus(project?.status)) return false;
  return isRatingWindowOpen(project, now);
}

export function getRatingEligibility(project, { alreadyRated = false, now = new Date() } = {}) {
  const { startDate, endDate, midDate } = getProjectTimeline(project);

  if (alreadyRated) {
    return { canRate: false, reason: 'already_rated', startDate, endDate, midDate };
  }
  if (!canRateProjectStatus(project?.status)) {
    return { canRate: false, reason: 'status', startDate, endDate, midDate };
  }
  if (startDate && endDate && !isRatingWindowOpen(project, now)) {
    return { canRate: false, reason: 'before_mid_date', startDate, endDate, midDate };
  }
  return { canRate: true, reason: 'eligible', startDate, endDate, midDate };
}
