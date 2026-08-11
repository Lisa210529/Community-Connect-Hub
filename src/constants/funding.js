export const STAKEHOLDER_TYPES = [
  { value: 'psip', label: 'PSIP — Provincial Service Improvement Program' },
  { value: 'dsip', label: 'DSIP — District Service Improvement Program' },
  { value: 'dda', label: 'DDA — District Development Authority' },
  { value: 'ngo', label: 'NGO — Non-Governmental Organization' },
  { value: 'open-member', label: 'Open Member' },
];

/** All stakeholder type values for bulk funding requests */
export const ALL_STAKEHOLDER_TYPES = STAKEHOLDER_TYPES.map((t) => t.value);

export const FUNDING_REQUEST_STATUSES = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function getStakeholderType(user) {
  const raw = String(user?.rawRole ?? user?.role ?? '').toLowerCase();
  if (raw === 'open_member') return 'open-member';
  const match = STAKEHOLDER_TYPES.find((t) => t.value === raw);
  return match?.value ?? 'open-member';
}

export function getStakeholderLabel(type) {
  return STAKEHOLDER_TYPES.find((t) => t.value === type)?.label ?? type;
}
