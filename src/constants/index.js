import { normalizeRole } from './roleMapping';
import { WARDS, getWardSelectLabel } from './wards';

export const ROLES = {
  resident: 'Resident',
  'wdc-member': 'WDC Member',
  councillor: 'Councillor',
  mayor: 'Mayor',
  'provincial-admin': 'Provincial Government',
  stakeholder: 'Stakeholder',
  pec: 'Provincial Government PEC',
  dda: 'DDA',
  psip: 'PSIP',
  dsip: 'DSIP',
  ngo: 'NGO',
  'open-member': 'Open Member',
  'system-admin': 'System Admin',
};

/** Roles that require admin pre-registration before signup */
export const OFFICIAL_ROLES = [
  'wdc-member',
  'councillor',
  'mayor',
  'pec',
  'dda',
  'psip',
  'dsip',
  'ngo',
  'open-member',
];

export const ROLE_DASHBOARD_PATHS = {
  resident: '/dashboard/resident',
  'wdc-member': '/dashboard/wdc',
  councillor: '/dashboard/councillor',
  mayor: '/dashboard/mayor',
  'provincial-admin': '/dashboard/pec',
  stakeholder: '/dashboard/open-member',
  pec: '/dashboard/pec',
  dda: '/dashboard/dda',
  psip: '/dashboard/psip',
  dsip: '/dashboard/dsip',
  ngo: '/dashboard/ngo',
  'open-member': '/dashboard/open-member',
  'system-admin': '/dashboard/system-admin',
  llg_admin: '/dashboard/mayor',
  wdc_chairman: '/dashboard/wdc',
  system_admin: '/dashboard/system-admin',
  provincial_admin: '/dashboard/pec',
};

/** Roles officials can be pre-registered as (admin form — not resident/system-admin) */
export const PRE_REGISTER_ROLES = [
  { value: 'wdc-member', label: 'WDC Member' },
  { value: 'councillor', label: 'Councillor' },
  { value: 'mayor', label: 'Mayor' },
  { value: 'pec', label: 'Provincial Government PEC' },
  { value: 'dda', label: 'DDA' },
  { value: 'psip', label: 'PSIP' },
  { value: 'dsip', label: 'DSIP' },
  { value: 'ngo', label: 'NGO' },
  { value: 'open-member', label: 'Open Member' },
];

/** @deprecated Public signup no longer exposes role selection */
export const REGISTER_ROLES = PRE_REGISTER_ROLES;

export const WARD_OPTIONS = WARDS.map((w) => getWardSelectLabel(w));

export const PROJECT_STATUSES = [
  'Pending WDC',
  'Pending LLG',
  'Pending District',
  'Pending Provincial',
  'Funded',
  'In Progress',
  'Completed',
];

export const REQUEST_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
export const MEETING_STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
export const RESOLUTION_STATUSES = ['Pending', 'Approved', 'Rejected'];

export const STATUS_COLORS = {
  'Pending WDC': 'pending',
  'Pending LLG': 'pending',
  'Pending District': 'pending',
  'Pending Provincial': 'pending',
  Funded: 'completed',
  'In Progress': 'active',
  Completed: 'completed',
  Pending: 'pending',
  Resolved: 'completed',
  Rejected: 'rejected',
  Scheduled: 'active',
  Cancelled: 'inactive',
  Approved: 'completed',
  low: 'inactive',
  medium: 'pending',
  high: 'rejected',
};

export const PASSWORD_RULE_LABELS = {
  minLength: 'At least 8 characters',
  uppercase: 'One uppercase letter (A–Z)',
  lowercase: 'One lowercase letter (a–z)',
  number: 'One number (0–9)',
  special: 'One special character (!@#$…)',
};

export const DOCUMENT_TEMPLATES = [
  'Meeting Minutes',
  'Project Reports',
  'Resolutions',
  'Official Letters',
];

const PROJECT_NAV = [
  { path: '/projects', label: 'Projects', icon: 'fa-folder-open' },
  { path: '/reports', label: 'Reports', icon: 'fa-chart-bar' },
];

export const NAV_ITEMS = {
  resident: [
    { path: '/dashboard/resident', label: 'Dashboard', icon: 'fa-home' },
    { path: '/projects', label: 'Projects', icon: 'fa-folder-open' },
    { path: '/requests', label: 'Requests', icon: 'fa-inbox' },
    { path: '/complaints', label: 'Complaints', icon: 'fa-exclamation-circle' },
    { path: '/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  'wdc-member': [
    { path: '/dashboard/wdc', label: 'Overview', icon: 'fa-home' },
    { path: '/dashboard/wdc?tab=requests', label: 'Resident Requests', icon: 'fa-inbox' },
    { path: '/dashboard/wdc?tab=community-needs', label: 'Community Needs', icon: 'fa-users' },
    { path: '/complaints', label: 'Complaints', icon: 'fa-exclamation-circle' },
    { path: '/meetings', label: 'Meetings', icon: 'fa-calendar-alt' },
    { path: '/resolutions', label: 'Resolutions', icon: 'fa-gavel' },
    { path: '/projects', label: 'Projects', icon: 'fa-folder-open' },
    { path: '/dashboard/wdc?tab=reports', label: 'Reports', icon: 'fa-chart-bar' },
    { path: '/documents', label: 'Documents', icon: 'fa-file-alt' },
    { path: '/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  councillor: [
    { path: '/dashboard/councillor', label: 'Dashboard', icon: 'fa-home' },
    { path: '/dashboard/councillor/projects', label: 'Projects', icon: 'fa-folder-open' },
    { path: '/dashboard/councillor/requests', label: 'Requests', icon: 'fa-inbox' },
    { path: '/complaints', label: 'Complaints', icon: 'fa-exclamation-circle' },
    { path: '/meetings', label: 'Meetings', icon: 'fa-calendar-alt' },
    { path: '/resolutions', label: 'Resolutions', icon: 'fa-gavel' },
    { path: '/documents', label: 'Documents', icon: 'fa-file-alt' },
    { path: '/acquittals', label: 'Acquittals', icon: 'fa-file-invoice-dollar' },
    { path: '/dashboard/councillor/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
    { path: '/dashboard/councillor/letters', label: 'Letters', icon: 'fa-file-alt' },
    { path: '/dashboard/councillor/profile', label: 'Profile', icon: 'fa-user' },
  ],
  mayor: [
    { path: '/dashboard/mayor', label: 'Dashboard', icon: 'fa-home' },
    { path: '/dashboard/mayor/wards', label: 'Wards', icon: 'fa-map-marked-alt' },
    { path: '/projects', label: 'Projects', icon: 'fa-folder-open' },
    { path: '/acquittals', label: 'Acquittals', icon: 'fa-file-invoice-dollar' },
    { path: '/reports', label: 'Reports', icon: 'fa-chart-bar' },
    { path: '/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  pec: [
    { path: '/dashboard/pec', label: 'Dashboard', icon: 'fa-home' },
    ...PROJECT_NAV,
    { path: '/acquittals', label: 'Acquittals', icon: 'fa-file-invoice-dollar' },
    { path: '/reports', label: 'Performance Reports', icon: 'fa-chart-pie' },
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  dda: [
    { path: '/dashboard/dda', label: 'Overview', icon: 'fa-home' },
    { path: '/dashboard/dda/funding-requests', label: 'Funding Requests', icon: 'fa-hand-holding-usd' },
    { path: '/dashboard/dda/approved', label: 'Approved Projects', icon: 'fa-check-circle' },
    { path: '/reports', label: 'Reports', icon: 'fa-chart-bar' },
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  psip: [
    { path: '/dashboard/psip', label: 'Overview', icon: 'fa-home' },
    { path: '/dashboard/psip/funding-requests', label: 'Funding Requests', icon: 'fa-hand-holding-usd' },
    { path: '/dashboard/psip/approved', label: 'Approved Projects', icon: 'fa-check-circle' },
    { path: '/reports', label: 'Reports', icon: 'fa-chart-bar' },
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  dsip: [
    { path: '/dashboard/dsip', label: 'Overview', icon: 'fa-home' },
    { path: '/dashboard/dsip/funding-requests', label: 'Funding Requests', icon: 'fa-hand-holding-usd' },
    { path: '/dashboard/dsip/approved', label: 'Approved Projects', icon: 'fa-check-circle' },
    { path: '/reports', label: 'Reports', icon: 'fa-chart-bar' },
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  ngo: [
    { path: '/dashboard/ngo', label: 'Overview', icon: 'fa-home' },
    { path: '/dashboard/ngo/funding-requests', label: 'Funding Requests', icon: 'fa-hand-holding-usd' },
    { path: '/dashboard/ngo/approved', label: 'Approved Projects', icon: 'fa-check-circle' },
    { path: '/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  'open-member': [
    { path: '/dashboard/open-member', label: 'Overview', icon: 'fa-home' },
    { path: '/dashboard/open-member/funding-requests', label: 'Funding Requests', icon: 'fa-hand-holding-usd' },
    { path: '/dashboard/open-member/approved', label: 'Approved Projects', icon: 'fa-check-circle' },
    { path: '/reports', label: 'Reports', icon: 'fa-chart-bar' },
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  'provincial-admin': [
    { path: '/dashboard/pec', label: 'Dashboard', icon: 'fa-home' },
    ...PROJECT_NAV,
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  stakeholder: [
    { path: '/dashboard/open-member', label: 'Dashboard', icon: 'fa-home' },
    ...PROJECT_NAV,
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  'system-admin': [
    { path: '/dashboard/system-admin', label: 'Dashboard', icon: 'fa-home' },
    { path: '/admin/users', label: 'Manage Users', icon: 'fa-users' },
    { path: '/admin/pre-register', label: 'Pre-Register', icon: 'fa-user-plus' },
    { path: '/admin/approvals', label: 'Approvals', icon: 'fa-user-clock' },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: 'fa-clipboard-list' },
    { path: '/documents', label: 'Documents', icon: 'fa-file-alt' },
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
};

export function resolveDashboardPath(user) {
  if (!user?.role && !user?.position) return '/login';

  let normalized = user?.role ? normalizeRole(user.role) : 'resident';
  if (normalized !== 'councillor' && user?.position) {
    const position = String(user.position).toLowerCase();
    if (position.includes('councillor') || position.includes('councilor')) {
      normalized = 'councillor';
    }
  }

  const raw = user.rawRole ?? user.role;

  if (normalized === 'councillor') {
    return '/dashboard/councillor';
  }

  if (normalized === 'stakeholder') {
    return ROLE_DASHBOARD_PATHS[raw] ?? ROLE_DASHBOARD_PATHS.stakeholder ?? '/dashboard/open-member';
  }

  if (normalized === 'provincial-admin') {
    return ROLE_DASHBOARD_PATHS['provincial-admin'] ?? '/dashboard/pec';
  }

  return ROLE_DASHBOARD_PATHS[normalized] ?? ROLE_DASHBOARD_PATHS[raw] ?? '/dashboard/resident';
}

export function getNavForRole(role, rawRole, user) {
  let normalized = normalizeRole(role);
  const rawNormalized = rawRole ? normalizeRole(rawRole) : null;

  if (normalized !== 'councillor' && user?.position) {
    const position = String(user.position).toLowerCase();
    if (position.includes('councillor') || position.includes('councilor')) {
      normalized = 'councillor';
    }
  }

  if (normalized === 'councillor' || rawNormalized === 'councillor') {
    return NAV_ITEMS.councillor;
  }

  if (normalized === 'stakeholder' && rawRole && NAV_ITEMS[rawRole]) {
    return NAV_ITEMS[rawRole];
  }

  if (normalized === 'provincial-admin') {
    return NAV_ITEMS['provincial-admin'] ?? NAV_ITEMS.pec ?? NAV_ITEMS.resident;
  }

  if (normalized === 'wdc-member' || rawNormalized === 'wdc-member') {
    return NAV_ITEMS['wdc-member'];
  }

  return NAV_ITEMS[normalized] ?? NAV_ITEMS[role] ?? NAV_ITEMS.resident;
}

export function isOfficialRole(role) {
  return OFFICIAL_ROLES.includes(role);
}
