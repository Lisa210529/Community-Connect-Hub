import { PASSWORD_RULE_LABELS } from '../constants';

export function validatePassword(password) {
  const rules = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const failedRules = Object.keys(rules).filter((key) => !rules[key]);
  const failedLabels = failedRules.map((key) => PASSWORD_RULE_LABELS[key]);

  return {
    valid: failedRules.length === 0,
    rules,
    failedRules,
    message:
      failedRules.length === 0
        ? 'Password meets all requirements'
        : `Password must include: ${failedLabels.join('; ')}`,
  };
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateNid(nid) {
  return /^\d{10}$/.test(String(nid).replace(/\s/g, ''));
}

export function getInitials(firstName = '', lastName = '') {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
}
