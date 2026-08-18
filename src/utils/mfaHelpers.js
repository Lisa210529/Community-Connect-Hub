/**
 * Generate a random base32 secret for TOTP MFA.
 */
export function generateMfaSecret(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const random = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i += 1) {
    secret += chars[random[i] % chars.length];
  }
  return secret;
}

export function buildOtpAuthUrl(email, secret) {
  const label = encodeURIComponent(`CommunityConnectHub:${email || 'user'}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=CommunityConnectHub`;
}

/**
 * Simple TOTP verify using HMAC-SHA1 (RFC 6238) — 6 digits, 30s window.
 */
export async function verifyTotpCode(secret, code, window = 1) {
  const normalized = String(code ?? '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(normalized)) return false;

  const epoch = Math.floor(Date.now() / 1000);
  for (let offset = -window; offset <= window; offset += 1) {
    const counter = Math.floor((epoch + offset * 30) / 30);
    const expected = await generateTotp(secret, counter);
    if (expected === normalized) return true;
  }
  return false;
}

function base32Decode(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = input.toUpperCase().replace(/=+$/, '');
  let bits = '';
  for (const char of cleaned) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

async function generateTotp(secret, counter) {
  const key = base32Decode(secret);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(4, counter, false);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, buffer));
  const offset = signature[signature.length - 1] & 0x0f;
  const binary =
    ((signature[offset] & 0x7f) << 24)
    | ((signature[offset + 1] & 0xff) << 16)
    | ((signature[offset + 2] & 0xff) << 8)
    | (signature[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

/** Demo SMS code — stores 6-digit code in session for verification (no SMS provider on Spark). */
export function generateSmsCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
