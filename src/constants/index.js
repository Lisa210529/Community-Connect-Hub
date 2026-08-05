export const ROLES = {
  resident: 'Resident',
  councillor: 'Councillor',
  mayor: 'Mayor',
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
  councillor: '/dashboard/councillor',
  mayor: '/dashboard/mayor',
  pec: '/dashboard/pec',
  dda: '/dashboard/dda',
  psip: '/dashboard/psip',
  dsip: '/dashboard/dsip',
  ngo: '/dashboard/ngo',
  'open-member': '/dashboard/open-member',
  'system-admin': '/dashboard/system-admin',
};

/** Roles officials can be pre-registered as (admin form — not resident/system-admin) */
export const PRE_REGISTER_ROLES = [
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

export const WARD_OPTIONS = [
  'Ward 1 Madang Urban',
  'Ward 2 Alexishafen',
  'Ward 3 Kuluguma',
  'Ward 4 Bongu',
  'Ward 5 Nabasa',
  'Ward 6 Simbai Settlement',
  'Ward 7 Bilbil',
];

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
    { path: '/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  councillor: [
    { path: '/dashboard/councillor', label: 'Dashboard', icon: 'fa-home' },
    { path: '/projects', label: 'Projects', icon: 'fa-folder-open' },
    { path: '/requests', label: 'Requests', icon: 'fa-inbox' },
    { path: '/meetings', label: 'Meetings', icon: 'fa-calendar' },
    { path: '/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
    { path: '/documents', label: 'Documents', icon: 'fa-file-alt' },
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  mayor: [
    { path: '/dashboard/mayor', label: 'Dashboard', icon: 'fa-home' },
    ...PROJECT_NAV,
    { path: '/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  pec: [
    { path: '/dashboard/pec', label: 'Dashboard', icon: 'fa-home' },
    ...PROJECT_NAV,
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  dda: [
    { path: '/dashboard/dda', label: 'Dashboard', icon: 'fa-home' },
    ...PROJECT_NAV,
    { path: '/meetings', label: 'Meetings', icon: 'fa-calendar' },
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  psip: [
    { path: '/dashboard/psip', label: 'Dashboard', icon: 'fa-home' },
    ...PROJECT_NAV,
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  dsip: [
    { path: '/dashboard/dsip', label: 'Dashboard', icon: 'fa-home' },
    ...PROJECT_NAV,
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  ngo: [
    { path: '/dashboard/ngo', label: 'Dashboard', icon: 'fa-home' },
    { path: '/projects', label: 'Projects', icon: 'fa-folder-open' },
    { path: '/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
  'open-member': [
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
    { path: '/profile', label: 'Profile', icon: 'fa-user' },
  ],
};

export function getNavForRole(role) {
  return NAV_ITEMS[role] ?? NAV_ITEMS.resident;
}

export function isOfficialRole(role) {
  return OFFICIAL_ROLES.includes(role);
}
