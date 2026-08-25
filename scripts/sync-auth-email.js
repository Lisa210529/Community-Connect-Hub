/**
 * Sync Firebase Authentication email to match Firestore profile email.
 *
 * Usage (PowerShell):
 *   $env:ACCOUNT_PASSWORD="YourPassword"; node scripts/sync-auth-email.js
 *
 * Optional env vars:
 *   OLD_EMAIL  (default: JoddyNumbunda@gmail.com)
 *   NEW_EMAIL  (default: iyama@gmail.com)
 */
const PROJECT_ID = 'community-connecthub';
const API_KEY = 'AIzaSyDl3sy-4FAYh1e7tKg3MO3wKlxR9LhzM-k';
const AUTH = 'https://identitytoolkit.googleapis.com/v1';

const OLD_EMAIL = (process.env.OLD_EMAIL ?? 'JoddyNumbunda@gmail.com').trim();
const NEW_EMAIL = (process.env.NEW_EMAIL ?? 'iyama@gmail.com').trim().toLowerCase();
const PASSWORD = process.env.ACCOUNT_PASSWORD ?? process.env.MAYOR_PASSWORD ?? '';

async function signIn(email, password) {
  const res = await fetch(`${AUTH}/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Sign-in failed (${res.status})`);
  }
  return body;
}

async function updateAuthEmail(idToken, email) {
  const res = await fetch(`${AUTH}/accounts:update?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, email, returnSecureToken: true }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Email update failed (${res.status})`);
  }
  return body;
}

async function main() {
  if (!PASSWORD) {
    console.error('❌ Set ACCOUNT_PASSWORD (or MAYOR_PASSWORD) to the current account password.');
    process.exit(1);
  }

  console.log(`🔐 Signing in as ${OLD_EMAIL}…`);
  const session = await signIn(OLD_EMAIL, PASSWORD);
  console.log(`✅ Signed in (uid: ${session.localId})`);

  if ((session.email ?? '').toLowerCase() === NEW_EMAIL) {
    console.log(`🟢 Auth email is already ${NEW_EMAIL}. Nothing to do.`);
    return;
  }

  console.log(`📧 Updating sign-in email to ${NEW_EMAIL}…`);
  const updated = await updateAuthEmail(session.idToken, NEW_EMAIL);
  console.log(`✅ Sign-in email updated to ${updated.email}`);
  console.log('\nYou can now sign in with:', NEW_EMAIL);
  console.log('The old email will no longer work for this account.');
}

main().catch((err) => {
  console.error('❌ Sync failed:', err.message);
  if (err.message.includes('EMAIL_EXISTS')) {
    console.error('\nThe new email may already belong to another Firebase account.');
    console.error('Remove or merge that account in Firebase Console → Authentication.');
  }
  process.exit(1);
});
