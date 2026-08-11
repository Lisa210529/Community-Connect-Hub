/** Madang Urban Local Level Government (MULLG) — 10 wards */
export const LLG_NAME = 'Madang Urban LLG';
export const LLG_SHORT_NAME = 'MULLG';

const WARD_DEFS = [
  { id: 'ward_1', name: 'Ward 1' },
  { id: 'ward_2', name: 'Ward 2' },
  { id: 'ward_3', name: 'Ward 3' },
  { id: 'ward_4', name: 'Ward 4' },
  { id: 'ward_5', name: 'Ward 5' },
  { id: 'ward_6', name: 'Ward 6' },
  { id: 'ward_7', name: 'Ward 7' },
  { id: 'ward_8', name: 'Ward 8' },
  { id: 'ward_9', name: 'Ward 9' },
  { id: 'ward_10', name: 'Ward 10' },
];

/** Substrings used only to match legacy stored ward strings — not shown in UI */
const LEGACY_LABELS = {
  ward_1: 'Ward 1 Madang Urban',
  ward_2: 'Ward 2 Alexishafen',
  ward_3: 'Ward 3 Kuluguma',
  ward_4: 'Ward 4 Bongu',
  ward_5: 'Ward 5 Nabasa',
  ward_6: 'Ward 6 Simbai Settlement',
};

function enrichWard(def, index) {
  const number = index + 1;
  const legacyLabel = LEGACY_LABELS[def.id] ?? def.name;
  const legacyMatches = legacyLabel === def.name
    ? []
    : [legacyLabel.toLowerCase().replace(def.name.toLowerCase(), '').trim()];

  return {
    ...def,
    number,
    shortName: def.name,
    label: def.name,
    legacyLabel,
    legacyMatches,
  };
}

export const WARDS = WARD_DEFS.map(enrichWard);

/** @deprecated Use WARDS */
export const NABASA_LLG_WARDS = WARDS;

export function getWardDisplayName(ward) {
  return ward?.name ?? '';
}

export function getWardSelectLabel(ward) {
  return ward?.name ?? '';
}

export function getWardById(wardId) {
  if (!wardId) return null;
  const key = String(wardId).toLowerCase().replace(/\s+/g, '_');
  const digits = key.match(/\d+/)?.[0];
  if (digits) {
    return WARDS.find((w) => w.number === Number(digits)) ?? null;
  }
  return WARDS.find((w) => w.id === key) ?? null;
}

export function getWardLabel(wardId) {
  const ward = getWardById(wardId);
  return ward ? getWardDisplayName(ward) : wardId;
}

export function getWardSelectOptions() {
  return WARDS.map((w) => ({
    value: w.id,
    label: w.name,
    wardNumber: String(w.number),
    ward: w.name,
  }));
}

/** Normalize any stored ward string to "Ward N" for display */
export function formatWardForDisplay(value) {
  if (!value) return '—';
  const digits = String(value).match(/ward\s*(\d+)/i)?.[1];
  if (digits) {
    return getWardById(`ward_${digits}`)?.name ?? `Ward ${digits}`;
  }
  return value;
}
