import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../services/firebase';
import { validatePassword } from '../../utils/validation';
import { buildOtpAuthUrl, generateMfaSecret, verifyTotpCode, generateSmsCode } from '../../utils/mfaHelpers';
import { getStore, setCollection } from '../../services/localStorageService';

export default function ProfilePage() {
  const { user, updateProfile, signInEmail, emailSyncRequired } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    ward: user?.ward ?? '',
  });
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [emailPassword, setEmailPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled ?? false);
  const [mfaType, setMfaType] = useState(user?.mfaType ?? 'totp');
  const [mfaSecret, setMfaSecret] = useState(user?.mfaSecret ?? '');
  const [verifyCode, setVerifyCode] = useState('');
  const [setupStep, setSetupStep] = useState(false);

  const authSignInEmail = signInEmail || auth.currentUser?.email || '';
  const emailChanged =
    form.email.trim().toLowerCase() !== authSignInEmail.trim().toLowerCase();

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setMessage('');
    setError('');

    try {
      await updateProfile(form, emailChanged ? { currentPassword: emailPassword } : {});
      setMessage(
        emailChanged
          ? 'Profile updated. Use your new email address the next time you sign in.'
          : 'Profile updated successfully.',
      );
      setEmailPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  function changePassword(e) {
    e.preventDefault();
    if (passwordForm.current !== user.password) {
      setError('Current password is incorrect.');
      return;
    }
    const check = validatePassword(passwordForm.newPass);
    if (!check.valid) {
      setError(check.message);
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setError('New passwords do not match.');
      return;
    }
    const store = getStore();
    const users = store.users.map((u) =>
      u.id === user.id ? { ...u, password: passwordForm.newPass } : u,
    );
    setCollection('users', users);
    updateProfile({ password: passwordForm.newPass });
    setMessage('Password changed successfully.');
    setError('');
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  }

  async function startMfaSetup(type) {
    const secret = generateMfaSecret();
    setMfaType(type);
    setMfaSecret(secret);
    setSetupStep(true);
    if (type === 'sms') {
      const code = generateSmsCode();
      sessionStorage.setItem('mfaSetupSmsCode', code);
      setMessage(`Demo SMS code (use to verify): ${code}`);
    } else {
      setMessage('Add this secret to Google Authenticator or scan the OTP URL below.');
    }
  }

  async function confirmMfaSetup(e) {
    e.preventDefault();
    if (mfaType === 'sms') {
      if (verifyCode !== sessionStorage.getItem('mfaSetupSmsCode')) {
        setError('Invalid SMS code.');
        return;
      }
    } else {
      const valid = await verifyTotpCode(mfaSecret, verifyCode);
      if (!valid) {
        setError('Invalid authenticator code.');
        return;
      }
    }
    await updateProfile({ mfaEnabled: true, mfaType, mfaSecret: mfaType === 'totp' ? mfaSecret : null });
    setMfaEnabled(true);
    setSetupStep(false);
    setVerifyCode('');
    setMessage('MFA enabled successfully.');
    setError('');
  }

  async function disableMfa() {
    await updateProfile({ mfaEnabled: false, mfaType: null, mfaSecret: null });
    setMfaEnabled(false);
    setMfaSecret('');
    setSetupStep(false);
    setMessage('MFA disabled.');
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-cyber-accent mb-6">Profile &amp; Settings</h1>

      {message && <div className="mb-4 p-3 rounded-lg bg-status-completed/10 border border-status-completed/30 text-status-completed text-sm">{message}</div>}
      {error && <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">{error}</div>}

      {emailSyncRequired && (
        <div className="mb-4 p-4 rounded-lg bg-status-pending/10 border border-status-pending/40 text-sm">
          <p className="font-medium text-status-pending mb-1">Update your sign-in email</p>
          <p className="text-cyber-muted">
            You currently sign in with <strong className="text-text-primary">{authSignInEmail}</strong>.
            Enter your password below and save to sign in with{' '}
            <strong className="text-text-primary">{form.email.trim()}</strong> instead.
          </p>
        </div>
      )}

      <div className="cyber-card mb-6">
        <h2 className="font-semibold mb-4">Edit Profile</h2>
        <form onSubmit={saveProfile} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-cyber-muted">First Name</label>
              <input className="cyber-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Last Name</label>
              <input className="cyber-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          {['email', 'phone', 'ward'].map((f) => (
            <div key={f}>
              <label className="text-xs text-cyber-muted capitalize">{f}</label>
              <input
                className="cyber-input"
                type={f === 'email' ? 'email' : 'text'}
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              />
            </div>
          ))}
          {emailChanged && (
            <div>
              <label className="text-xs text-cyber-muted">Current Password</label>
              <input
                type="password"
                className="cyber-input"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder="Required to update your sign-in email"
                required
              />
              <p className="text-xs text-cyber-muted mt-1">
                {authSignInEmail && authSignInEmail !== form.email.trim().toLowerCase()
                  ? `You currently sign in with ${authSignInEmail}. Enter your password to sign in with ${form.email.trim()} instead.`
                  : `Your sign-in email will change to ${form.email.trim()}. Use that address after you sign out.`}
              </p>
            </div>
          )}
          <div>
            <label className="text-xs text-cyber-muted">NID (National Identification Number)</label>
            <input
              className="cyber-input opacity-70 cursor-not-allowed"
              value={user?.nid ?? '—'}
              readOnly
              aria-readonly="true"
            />
            <p className="text-xs text-cyber-muted mt-1">Your NID cannot be changed after registration.</p>
          </div>
          <button type="submit" className="cyber-btn-primary" disabled={savingProfile}>
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>

      <div className="cyber-card mb-6">
        <h2 className="font-semibold mb-4">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-3">
          {['current', 'newPass', 'confirm'].map((f) => (
            <div key={f}>
              <label className="text-xs text-cyber-muted">{f === 'newPass' ? 'New Password' : f === 'confirm' ? 'Confirm Password' : 'Current Password'}</label>
              <input type="password" className="cyber-input" value={passwordForm[f]} onChange={(e) => setPasswordForm({ ...passwordForm, [f]: e.target.value })} />
            </div>
          ))}
          <button type="submit" className="cyber-btn-primary">Update Password</button>
        </form>
      </div>

      <div className="cyber-card">
        <h2 className="font-semibold mb-4">Multi-Factor Authentication</h2>
        <p className="text-cyber-muted text-sm mb-4">Enable TOTP (authenticator app) or demo SMS verification at login.</p>
        {mfaEnabled ? (
          <button type="button" onClick={disableMfa} className="cyber-btn-danger">Disable MFA</button>
        ) : !setupStep ? (
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => startMfaSetup('totp')} className="cyber-btn-primary">Enable TOTP</button>
            <button type="button" onClick={() => startMfaSetup('sms')} className="cyber-btn-secondary">Enable SMS (Demo)</button>
          </div>
        ) : (
          <form onSubmit={confirmMfaSetup} className="space-y-3">
            {mfaType === 'totp' && mfaSecret && (
              <div className="p-3 rounded-lg bg-slate-bg border border-slate-border text-xs break-all">
                <p className="text-cyber-muted mb-1">Secret: {mfaSecret}</p>
                <p className="text-cyber-accent">{buildOtpAuthUrl(user?.email, mfaSecret)}</p>
              </div>
            )}
            <input
              className="cyber-input"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              required
            />
            <button type="submit" className="cyber-btn-primary">Verify &amp; Enable</button>
          </form>
        )}
      </div>
    </div>
  );
}
