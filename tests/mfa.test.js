import { describe, it, expect } from 'vitest';
import { buildOtpAuthUrl, generateMfaSecret } from '../src/utils/mfaHelpers.js';

describe('MFA helpers', () => {
  it('generates base32 secret of requested length', () => {
    const secret = generateMfaSecret(16);
    expect(secret).toHaveLength(16);
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });

  it('builds otpauth URL with issuer and label', () => {
    const url = buildOtpAuthUrl('test@example.com', 'JBSWY3DPEHPK3PXP');
    expect(url).toContain('otpauth://totp/');
    expect(url).toContain('issuer=CommunityConnectHub');
    expect(url).toContain('secret=JBSWY3DPEHPK3PXP');
  });
});
