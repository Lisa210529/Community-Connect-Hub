export const RATING_CATEGORIES = [
  { key: 'category1Score', label: 'Quality of Work' },
  { key: 'category2Score', label: 'Timeliness' },
  { key: 'category3Score', label: 'Community Benefit' },
  { key: 'category4Score', label: 'Communication' },
  { key: 'category5Score', label: 'Overall Satisfaction' },
];

/** Projects residents may rate after funding / implementation */
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

export function computeOverallScore(scores) {
  const values = RATING_CATEGORIES.map((c) => Number(scores[c.key] ?? 0)).filter((n) => n > 0);
  if (!values.length) return 0;
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
}
