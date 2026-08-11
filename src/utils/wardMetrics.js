import { resolveWardId } from './wdcHelpers';

export function itemBelongsToWard(item, ward) {
  const itemWardId = resolveWardId(item);
  if (itemWardId && itemWardId === ward.id) return true;

  const label = String(item?.ward ?? '').toLowerCase();
  if (!label) return false;

  if (label.includes(`ward ${ward.number}`)) return true;
  if (ward.label && label === ward.label.toLowerCase()) return true;
  if (ward.legacyLabel && label === ward.legacyLabel.toLowerCase()) return true;
  if (ward.legacyMatches?.some((token) => label.includes(token))) return true;

  return false;
}

export function filterByWard(items, ward) {
  return (items ?? []).filter((item) => itemBelongsToWard(item, ward));
}

export function sumFunding(projects) {
  return (projects ?? []).reduce(
    (sum, p) => sum + (Number(p.budget) || Number(p.funding) || 0),
    0,
  );
}

export function computeCompletionRate(projects) {
  if (!projects?.length) return 0;
  const completed = projects.filter((p) => p.status === 'Completed').length;
  return Math.round((completed / projects.length) * 100);
}

export function computeWardRating(projects, needs, requests, ratings = []) {
  const scores = (ratings ?? [])
    .map((r) => Number(r.score ?? r.rating ?? 0))
    .filter((n) => n > 0);

  if (scores.length > 0) {
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  }

  const completed = (projects ?? []).filter((p) => p.status === 'Completed').length;
  const delivery =
    !projects?.length ? 3 : Math.min(5, Math.round((completed / projects.length) * 5) + 2);
  const engagement = Math.min(5, 3 + Math.floor((requests?.length ?? 0) / 4));
  const needsScore = Math.min(5, 3 + Math.floor((needs?.length ?? 0) / 2));

  return ((delivery + engagement + needsScore) / 3).toFixed(1);
}

export function findCouncillorForWard(councillors, ward) {
  return (
    (councillors ?? []).find((c) => {
      const councillorWardId = resolveWardId(c);
      if (councillorWardId && councillorWardId === ward.id) return true;
      const label = String(c.ward ?? '').toLowerCase();
      return (
        label.includes(`ward ${ward.number}`)
        || label === ward.label?.toLowerCase()
        || label === ward.legacyLabel?.toLowerCase()
      );
    }) ?? null
  );
}

export function buildWardSummary(ward, projects, needs, requests, ratings, councillor) {
  const wardProjects = filterByWard(projects, ward);
  const wardNeeds = filterByWard(needs, ward);
  const wardRequests = filterByWard(requests, ward);
  const wardRatings = filterByWard(ratings, ward);

  const councillorName =
    councillor?.fullName
    ?? [councillor?.firstName, councillor?.lastName].filter(Boolean).join(' ')
    ?? councillor?.name
    ?? '—';

  return {
    ward,
    councillor,
    councillorName,
    projectCount: wardProjects.length,
    needCount: wardNeeds.length,
    requestCount: wardRequests.length,
    totalFunding: sumFunding(wardProjects),
    rating: Number(computeWardRating(wardProjects, wardNeeds, wardRequests, wardRatings)),
    completionRate: computeCompletionRate(wardProjects),
    projects: wardProjects,
    needs: wardNeeds,
    requests: wardRequests,
  };
}
