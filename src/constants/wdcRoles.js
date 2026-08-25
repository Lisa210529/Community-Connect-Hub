/** WDC committee positions — Chairman is the elected Ward Councillor. */
export const WDC_POSITION_OPTIONS = [
  { value: 'WDC Chairman (Ward Councillor)', label: 'WDC Chairman (Ward Councillor)' },
  { value: 'Deputy Chairman', label: 'Deputy Chairman' },
  { value: 'WDC Secretary', label: 'WDC Secretary' },
  { value: 'WDC Treasurer', label: 'WDC Treasurer' },
  { value: 'WDC Member (Community Representative)', label: 'WDC Member (Community Representative)' },
];

export const WDC_POSITION_LABELS = {
  chairman: WDC_POSITION_OPTIONS[0].value,
  deputy: WDC_POSITION_OPTIONS[1].value,
  secretary: WDC_POSITION_OPTIONS[2].value,
  treasurer: WDC_POSITION_OPTIONS[3].value,
  member: WDC_POSITION_OPTIONS[4].value,
};

const WDC_NAV = {
  overview: { path: '/dashboard/wdc', label: 'Overview', icon: 'fa-home' },
  requests: { path: '/dashboard/wdc?tab=requests', label: 'Resident Requests', icon: 'fa-inbox' },
  communityNeeds: { path: '/dashboard/wdc?tab=community-needs', label: 'Community Needs', icon: 'fa-users' },
  complaints: { path: '/complaints', label: 'Complaints', icon: 'fa-exclamation-circle' },
  meetings: { path: '/meetings', label: 'Meetings', icon: 'fa-calendar-alt' },
  resolutions: { path: '/resolutions', label: 'Resolutions', icon: 'fa-gavel' },
  projects: { path: '/projects', label: 'Projects', icon: 'fa-folder-open' },
  reports: { path: '/dashboard/wdc?tab=reports', label: 'Reports', icon: 'fa-chart-bar' },
  documents: { path: '/documents', label: 'WDC Documents', icon: 'fa-file-alt' },
  acquittals: { path: '/acquittals', label: 'Acquittals', icon: 'fa-file-invoice-dollar' },
  announcements: { path: '/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
  profile: { path: '/profile', label: 'Profile', icon: 'fa-user' },
};

export const WDC_ROLE_KEYS = {
  CHAIRMAN: 'chairman',
  DEPUTY: 'deputy_chairman',
  SECRETARY: 'secretary',
  TREASURER: 'treasurer',
  MEMBER: 'member',
};

const NAV_KEYS_BY_ROLE = {
  [WDC_ROLE_KEYS.CHAIRMAN]: [
    'overview', 'requests', 'communityNeeds', 'complaints', 'meetings', 'resolutions',
    'projects', 'reports', 'documents', 'acquittals', 'announcements', 'profile',
  ],
  [WDC_ROLE_KEYS.DEPUTY]: [
    'overview', 'requests', 'communityNeeds', 'meetings', 'resolutions', 'projects',
    'complaints', 'announcements', 'profile',
  ],
  [WDC_ROLE_KEYS.SECRETARY]: [
    'overview', 'requests', 'meetings', 'resolutions', 'documents', 'complaints',
    'announcements', 'profile',
  ],
  [WDC_ROLE_KEYS.TREASURER]: [
    'overview', 'projects', 'reports', 'documents', 'acquittals', 'announcements', 'profile',
  ],
  [WDC_ROLE_KEYS.MEMBER]: [
    'overview', 'projects', 'meetings', 'announcements', 'profile',
  ],
};

const TABS_BY_ROLE = {
  [WDC_ROLE_KEYS.CHAIRMAN]: ['overview', 'requests', 'community-needs', 'reports'],
  [WDC_ROLE_KEYS.DEPUTY]: ['overview', 'requests', 'community-needs'],
  [WDC_ROLE_KEYS.SECRETARY]: ['overview', 'requests'],
  [WDC_ROLE_KEYS.TREASURER]: ['overview', 'reports'],
  [WDC_ROLE_KEYS.MEMBER]: ['overview'],
};

export const WDC_ROLE_DASHBOARDS = {
  [WDC_ROLE_KEYS.CHAIRMAN]: {
    title: 'WDC Chairman Dashboard',
    workspaceLabel: 'Chairman workspace',
    subtitle: 'Ward Councillor — leads the Ward Development Committee',
    duties: [
      'Chair WDC meetings and approve resolutions',
      'Review community needs and forward to the Ward Councillor office',
      'Sign acquittal reports with the Treasurer',
      'Oversee ward project delivery',
    ],
    statLabels: ['newRequests', 'communityNeedsCount', 'activeProjects', 'pendingReports'],
    overviewSection: 'communityNeeds',
  },
  [WDC_ROLE_KEYS.DEPUTY]: {
    title: 'Deputy Chairman Dashboard',
    workspaceLabel: 'Deputy Chairman workspace',
    subtitle: 'Supports the Chairman and stands in when required',
    duties: [
      'Assist with meeting facilitation and resolutions',
      'Monitor resident project requests',
      'Help coordinate community need reviews',
    ],
    statLabels: ['newRequests', 'communityNeedsCount', 'activeProjects'],
    overviewSection: 'communityNeeds',
  },
  [WDC_ROLE_KEYS.SECRETARY]: {
    title: 'WDC Secretary Dashboard',
    workspaceLabel: 'Secretary workspace',
    subtitle: 'Records minutes, resolutions, and official WDC correspondence',
    duties: [
      'Prepare and publish meeting minutes',
      'Draft WDC resolutions and official letters',
      'Track resident requests referred to the committee',
    ],
    statLabels: ['newRequests', 'activeProjects'],
    overviewSection: 'secretariat',
  },
  [WDC_ROLE_KEYS.TREASURER]: {
    title: 'WDC Treasurer Dashboard',
    workspaceLabel: 'Treasurer workspace',
    subtitle: 'Manages ward finances, reports, and acquittals',
    duties: [
      'Prepare project and financial reports',
      'Compile acquittal reports for LLG submission',
      'Track project budgets and ward expenditure',
    ],
    statLabels: ['activeProjects', 'pendingReports'],
    overviewSection: 'finance',
  },
  [WDC_ROLE_KEYS.MEMBER]: {
    title: 'WDC Member Dashboard',
    workspaceLabel: 'Community representative workspace',
    subtitle: 'Community representative on the Ward Development Committee',
    duties: [
      'Advise on ward development priorities',
      'Review ward projects and announcements',
      'Participate in WDC meetings',
    ],
    statLabels: ['activeProjects'],
    overviewSection: 'projects',
  },
};

export function resolveWdcRoleKey(user) {
  const position = String(user?.position ?? '').toLowerCase();
  if (position.includes('deputy')) return WDC_ROLE_KEYS.DEPUTY;
  if (position.includes('secretary')) return WDC_ROLE_KEYS.SECRETARY;
  if (position.includes('treasurer')) return WDC_ROLE_KEYS.TREASURER;
  if (position.includes('chairman') || position.includes('councillor') || position.includes('councilor')) {
    return WDC_ROLE_KEYS.CHAIRMAN;
  }
  return WDC_ROLE_KEYS.MEMBER;
}

export function resolveWdcPositionLabel(user) {
  if (user?.position) return user.position;
  const roleKey = resolveWdcRoleKey(user);
  const labels = {
    [WDC_ROLE_KEYS.CHAIRMAN]: WDC_POSITION_OPTIONS[0].label,
    [WDC_ROLE_KEYS.DEPUTY]: WDC_POSITION_OPTIONS[1].label,
    [WDC_ROLE_KEYS.SECRETARY]: WDC_POSITION_OPTIONS[2].label,
    [WDC_ROLE_KEYS.TREASURER]: WDC_POSITION_OPTIONS[3].label,
    [WDC_ROLE_KEYS.MEMBER]: WDC_POSITION_OPTIONS[4].label,
  };
  return labels[roleKey] ?? 'WDC Member';
}

export function getWdcRoleDashboard(user) {
  return WDC_ROLE_DASHBOARDS[resolveWdcRoleKey(user)] ?? WDC_ROLE_DASHBOARDS[WDC_ROLE_KEYS.MEMBER];
}

export function getWdcNavItems(user) {
  const roleKey = resolveWdcRoleKey(user);
  const keys = NAV_KEYS_BY_ROLE[roleKey] ?? NAV_KEYS_BY_ROLE[WDC_ROLE_KEYS.MEMBER];
  return keys.map((key) => WDC_NAV[key]).filter(Boolean);
}

export function wdcRoleCanAccessTab(user, tab) {
  const roleKey = resolveWdcRoleKey(user);
  const allowed = TABS_BY_ROLE[roleKey] ?? TABS_BY_ROLE[WDC_ROLE_KEYS.MEMBER];
  const normalized = tab || 'overview';
  return allowed.includes(normalized);
}
