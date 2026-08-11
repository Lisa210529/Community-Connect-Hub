export const ROLE_MAPPING = {
  // Legacy → Standard
  wdc_chairman: 'wdc-member',
  llg_admin: 'mayor',
  pec: 'provincial-admin',
  system_admin: 'system-admin',
  admin: 'system-admin',
  psip: 'stakeholder',
  dsip: 'stakeholder',
  dda: 'stakeholder',
  ngo: 'stakeholder',
  open_member: 'stakeholder',
  'open-member': 'stakeholder',

  // Standard → Standard (identity)
  'wdc-member': 'wdc-member',
  wdc: 'wdc-member',
  mayor: 'mayor',
  councillor: 'councillor',
  councilor: 'councillor',
  ward_councillor: 'councillor',
  'ward councillor': 'councillor',
  resident: 'resident',
  'provincial-admin': 'provincial-admin',
  stakeholder: 'stakeholder',
  'system-admin': 'system-admin',
};

export const normalizeRole = (role) => {
  if (!role) return null;
  const key = String(role).toLowerCase();
  const normalized = ROLE_MAPPING[key] ?? role;
  if (normalized !== role && normalized === 'councillor') {
    console.warn(`Legacy role detected: "${role}" → normalized to "${normalized}"`);
  }
  return normalized;
};

export const isRole = (userRole, targetRole) => {
  return normalizeRole(userRole) === normalizeRole(targetRole);
};

export const hasAnyRole = (userRole, allowedRoles) => {
  const normalized = normalizeRole(userRole);
  return allowedRoles.some((role) => normalizeRole(role) === normalized);
};

/** True when profile role, rawRole, or position indicates ward councillor. */
export function isCouncillorUser(user) {
  if (!user) return false;
  if (hasAnyRole(user.role, ['councillor', 'councilor'])) return true;
  if (hasAnyRole(user.rawRole, ['councillor', 'councilor'])) return true;
  const position = String(user.position ?? '').toLowerCase();
  return position.includes('councillor') || position.includes('councilor');
}
