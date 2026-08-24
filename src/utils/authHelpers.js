import { normalizeRole } from '../constants/roleMapping';

export function getNidFromData(data) {
  return data?.nid ?? data?.pid ?? '';
}

export function getRoleFromData(data) {
  const raw = data?.role ?? data?.userCategory ?? '';
  if (raw) return normalizeRole(raw);

  const position = String(data?.position ?? '').toLowerCase();
  if (position.includes('councillor') || position.includes('councilor')) {
    return 'councillor';
  }

  return 'resident';
}

export function mapAuthErrorCode(code, fallbackMessage = 'Authentication failed.') {
  const messages = {
    'auth/email-already-in-use': 'This email is already registered. Please login instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  };
  return messages[code] ?? fallbackMessage;
}
