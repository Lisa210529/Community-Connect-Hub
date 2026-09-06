export const ACQUITTAL_STATUSES = [
  'Draft',
  'Submitted to Stakeholder',
  'Submitted',
  'Under Review',
  'Acknowledged',
  'Approved',
  'Returned',
  'Rejected',
];

export const FUNDING_SOURCES = ['PSIP', 'DSIP', 'DDA', 'NGO', 'Other'];

export const EMPTY_EXPENDITURE = { category: '', amount: '', description: '' };

export const EMPTY_CONTRACTOR = { name: '', contact: '', nid: '' };

/** Map acquittal funding source label → stakeholder role key (funding.js). */
export function fundingSourceToStakeholderType(source = '') {
  const key = String(source).trim().toUpperCase();
  const map = {
    PSIP: 'psip',
    DSIP: 'dsip',
    DDA: 'dda',
    NGO: 'ngo',
  };
  return map[key] ?? null;
}

export function getFundingSourceLabel(source = '') {
  const labels = {
    PSIP: 'Provincial Service Improvement Program (PSIP)',
    DSIP: 'District Service Improvement Program (DSIP)',
    DDA: 'District Development Authority (DDA)',
    NGO: 'Non-Governmental Organization (NGO)',
    Other: 'Other funding source',
  };
  return labels[String(source).trim().toUpperCase()] ?? source;
}
