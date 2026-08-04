export const ROLE_LABELS = {
  resident: 'Resident',
  councillor: 'Councillor',
  wdc_chairperson: 'WDC Chairperson',
  wdc_secretary: 'WDC Secretary',
  wdc_member: 'WDC Member',
  llg_admin: 'LLG Administrator',
  dda_officer: 'DDA Officer',
  provincial_admin: 'Provincial Administrator',
  pec_member: 'PEC Member',
  psip_coordinator: 'PSIP Coordinator',
  dsip_coordinator: 'DSIP Coordinator',
  funding_agency: 'Funding Agency',
  system_admin: 'System Administrator',
};

export const DEFAULT_DASHBOARD_BY_ROLE = {
  resident: '/resident',
  councillor: '/government',
  wdc_chairperson: '/wdc',
  wdc_secretary: '/wdc',
  wdc_member: '/wdc',
  llg_admin: '/government',
  dda_officer: '/government',
  provincial_admin: '/government',
  system_admin: '/admin',
  pec_member: '/projects',
  psip_coordinator: '/projects',
  dsip_coordinator: '/projects',
  funding_agency: '/projects',
};

export const PASSWORD_RULE_LABELS = {
  minLength: 'At least 8 characters',
  uppercase: 'One uppercase letter (A–Z)',
  lowercase: 'One lowercase letter (a–z)',
  number: 'One number (0–9)',
  special: 'One special character (!@#$…)',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  RESIDENT: '/resident',
  WDC: '/wdc',
  GOVERNMENT: '/government',
  PROJECTS: '/projects',
  REPORTS: '/reports',
  FEEDBACK: '/feedback',
  ADMIN: '/admin',
};
