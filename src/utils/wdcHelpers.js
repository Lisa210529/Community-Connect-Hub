/** Minimum unique residents required before a grouped request becomes a Community Need */
export const REQUESTS_THRESHOLD = 5;

export const REQUEST_TYPES = [
  { value: 'project', label: 'Project Request' },
  { value: 'letter', label: 'Letter Request' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'feedback', label: 'Feedback' },
];

export const LETTER_TYPES = [
  { value: 'reference', label: 'Reference Letter' },
  { value: 'support', label: 'Support Letter' },
  { value: 'statutory_declaration', label: 'Statutory Declaration' },
];

export const PROJECT_CATEGORIES = [
  'Water Supply',
  'Road Construction',
  'Street Light',
  'Road Repair',
  'Street Lighting',
  'Infrastructure',
  'Health Center',
  'Health',
  'Education',
  'Water & Sanitation',
  'DSIP Funding',
  'General',
];

export const WARD_ZONE_OPTIONS = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'All Ward'];

export const GROUP_STATUS_LABELS = {
  individual: 'Individual (<5 residents)',
  communityNeed: 'Community Need (5+ residents)',
  forwarded: 'Forwarded to Councillor',
  referred: 'Referred to Councillor',
};

const NON_PROJECT_REQUEST_TYPES = new Set(['complaint', 'feedback', 'letter']);

const FORWARDED_STATUSES = new Set(['forwarded', 'forwarded_to_councillor', 'referred']);

export function getWardNumber(user) {
  if (user?.wardNumber) return user.wardNumber;
  const match = user?.ward?.match(/Ward\s*(\d+)/i);
  return match?.[1] ?? '?';
}

export function extractWardIdFromItem(item) {
  if (item?.wardId) return item.wardId;
  const match = String(item?.ward ?? '').match(/\d+/);
  return match ? `ward_${match[0]}` : '';
}

export function resolveWardId(item) {
  const raw = extractWardIdFromItem(item);
  if (!raw) return '';
  const digits = String(raw).match(/\d+/)?.[0];
  return digits ? `ward_${digits}` : raw;
}

function normalizeWardKey(value) {
  const digits = String(value ?? '').match(/\d+/)?.[0];
  return digits ? `ward_${digits}` : String(value ?? '').toLowerCase();
}

export function getRequestZone(req) {
  return (req.zone || req.area || 'All Ward').trim();
}

export function matchesWard(item, user) {
  const userWardId = resolveWardId(user);
  const itemWardId = resolveWardId(item);

  if (userWardId && itemWardId && userWardId === itemWardId) {
    return true;
  }

  const userWard = user?.ward ?? '';
  const itemWard = item?.ward ?? '';
  if (!userWard) return true;
  if (!itemWard) return Boolean(userWardId && itemWardId && userWardId === itemWardId);
  return itemWard === userWard || itemWard.includes(userWard) || userWard.includes(itemWard);
}

export function normalizeRequestStatus(status) {
  return String(status ?? 'pending').toLowerCase().replace(/\s+/g, '_');
}

export function normalizeProjectStatus(status) {
  return String(status ?? '').toLowerCase().replace(/\s+/g, '_');
}

export function isForwardedStatus(status) {
  return FORWARDED_STATUSES.has(normalizeRequestStatus(status));
}

/** True when the request is a ward project request (not complaint/feedback). */
export function isProjectRequest(req) {
  const requestType = String(req.requestType ?? req.type ?? '')
    .toLowerCase()
    .replace(/\s+/g, '_');

  if (NON_PROJECT_REQUEST_TYPES.has(requestType)) return false;
  if (requestType === 'project' || requestType === 'project_request') return true;
  if (req.type === 'project' || req.requestType === 'project') return true;

  if (req.projectType) return true;
  if (req.category && !requestType) return true;

  return false;
}

export function filterProjectRequests(requests) {
  return requests.filter(isProjectRequest);
}

function buildGroupKey(category, zone) {
  return `${category}::${zone}`;
}

export function groupRequestsByCategory(requests, threshold = REQUESTS_THRESHOLD) {
  const groups = {};

  requests.forEach((req) => {
    if (!isProjectRequest(req)) return;

    const category = (req.category || req.projectType || req.title || 'General').trim();
    const zone = getRequestZone(req);
    const groupKey = buildGroupKey(category, zone);

    if (!groups[groupKey]) {
      groups[groupKey] = {
        groupKey,
        category,
        zone,
        residentIds: [],
        residentNames: [],
        requests: [],
        ward: req.ward || req.wardId || '',
      };
    }

    if (req.residentId && !groups[groupKey].residentIds.includes(req.residentId)) {
      groups[groupKey].residentIds.push(req.residentId);
      groups[groupKey].residentNames.push(req.residentName || 'Unknown');
    }

    groups[groupKey].requests.push(req);
  });

  return Object.values(groups).map((group) => {
    const residentCount = group.residentIds.length;
    const isCommunityNeed = residentCount >= threshold;
    const alreadyForwarded = group.requests.every((r) => isForwardedStatus(r.status));

    return {
      ...group,
      residentCount,
      requestIds: group.requests.map((r) => r.id),
      isCommunityNeed,
      canForward: isCommunityNeed && !alreadyForwarded,
      type: isCommunityNeed ? 'Community Need' : 'Individual',
      alreadyForwarded,
      // Legacy alias used elsewhere in the dashboard
      alreadyReferred: alreadyForwarded,
    };
  });
}

export function getGroupStatusLabel(group) {
  if (group.alreadyForwarded) return GROUP_STATUS_LABELS.forwarded;
  if (group.isCommunityNeed) return GROUP_STATUS_LABELS.communityNeed;
  return GROUP_STATUS_LABELS.individual;
}

export function getRequestGroupStatus(requestId, groupedRequests) {
  const group = groupedRequests.find((g) => g.requestIds.includes(requestId));
  if (!group) return GROUP_STATUS_LABELS.individual;
  return getGroupStatusLabel(group);
}

export const REPORT_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted to Councillor' },
  { value: 'signed', label: 'Signed' },
  { value: 'submitted_to_stakeholder', label: 'Submitted to Stakeholder' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'returned', label: 'Returned' },
];

export function reportStatusLabel(status) {
  return REPORT_STATUSES.find((s) => s.value === status)?.label ?? status;
}
