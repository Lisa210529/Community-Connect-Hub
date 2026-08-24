import { describe, it, expect } from 'vitest';
import { getNidFromData, getRoleFromData, mapAuthErrorCode } from '../src/utils/authHelpers.js';

describe('authentication helpers', () => {
  it('reads NID from nid or pid field', () => {
    expect(getNidFromData({ nid: '123456789' })).toBe('123456789');
    expect(getNidFromData({ pid: '987654321' })).toBe('987654321');
    expect(getNidFromData({})).toBe('');
  });

  it('normalizes role from role or userCategory', () => {
    expect(getRoleFromData({ role: 'councillor' })).toBe('councillor');
    expect(getRoleFromData({ userCategory: 'resident' })).toBe('resident');
    expect(getRoleFromData({ position: 'Ward Councillor' })).toBe('councillor');
    expect(getRoleFromData({})).toBe('resident');
  });

  it('maps auth error codes to user messages', () => {
    expect(mapAuthErrorCode('auth/invalid-credential')).toBe('Invalid email or password.');
  });
});
