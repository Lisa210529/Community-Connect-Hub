import { getStore } from '../services/localStorageService';

/** PNG National ID — exactly 10 digits */
export function validateNID(nid) {
  return /^\d{10}$/.test(String(nid ?? '').replace(/\s/g, ''));
}

export function getPreRegisteredUsers(store = getStore()) {
  return store?.preRegisteredUsers ?? store?.preregisteredOfficials ?? [];
}

/** Check if NID is already registered to an active user account */
export function checkNidExists(nid) {
  const normalized = String(nid ?? '').replace(/\s/g, '');
  const store = getStore();
  if (!store?.users) return false;
  return store.users.some(
    (u) => u.nid === normalized || u.sevisPassUid === normalized,
  );
}

/** Check if NID exists in preRegisteredUsers */
export function checkNidInPreReg(nid) {
  const normalized = String(nid ?? '').replace(/\s/g, '');
  return getPreRegisteredUsers().some((o) => o.nid === normalized);
}

/** Find pre-registered record by NID (must not be registered yet) */
export function findPreregisteredOfficial(nid) {
  const normalized = String(nid ?? '').replace(/\s/g, '');
  return getPreRegisteredUsers().find(
    (o) => o.nid === normalized && !o.isRegistered,
  ) ?? null;
}

/** Find pre-registered record matching NID and email */
export function getPreRegRecord(nid, email) {
  const normalized = String(nid ?? '').replace(/\s/g, '');
  const normalizedEmail = email.trim().toLowerCase();
  return getPreRegisteredUsers().find(
    (o) =>
      o.nid === normalized &&
      o.email.toLowerCase() === normalizedEmail &&
      !o.isRegistered,
  ) ?? null;
}

export function isNidPreregisteredOfficial(nid) {
  return checkNidInPreReg(nid);
}

/** Validate official signup — role comes from pre-reg record, not user selection */
export function validateOfficialRegistration({ nid, email }) {
  const record = getPreRegRecord(nid, email);
  if (!record) {
    return {
      valid: false,
      message: 'You are not pre-registered. Please contact your administrator.',
    };
  }
  return { valid: true, record };
}

/** Validate resident signup */
export function validateResidentRegistration({ nid }) {
  if (checkNidInPreReg(nid)) {
    return {
      valid: false,
      message:
        'This NID belongs to a government official. Please use official registration instead.',
    };
  }
  if (checkNidExists(nid)) {
    return {
      valid: false,
      message: 'NID already registered. Please use a different NID.',
    };
  }
  return { valid: true };
}
