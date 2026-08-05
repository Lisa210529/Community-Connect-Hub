import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { validatePassword } from '../../utils/validation';
import { getStore, setCollection } from '../../services/localStorageService';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    ward: user?.ward ?? '',
  });
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled ?? false);

  function saveProfile(e) {
    e.preventDefault();
    updateProfile(form);
    setMessage('Profile updated successfully.');
    setError('');
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

  function toggleMfa() {
    const next = !mfaEnabled;
    setMfaEnabled(next);
    updateProfile({ mfaEnabled: next });
    setMessage(next ? 'MFA enabled (UI demo).' : 'MFA disabled.');
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-cyber-accent mb-6">Profile &amp; Settings</h1>

      {message && <div className="mb-4 p-3 rounded-lg bg-status-completed/10 border border-status-completed/30 text-status-completed text-sm">{message}</div>}
      {error && <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">{error}</div>}

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
              <input className="cyber-input" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
            </div>
          ))}
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
          <button type="submit" className="cyber-btn-primary">Save Profile</button>
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
        <p className="text-cyber-muted text-sm mb-4">Enable MFA for additional account security (UI demonstration only).</p>
        <button type="button" onClick={toggleMfa} className={mfaEnabled ? 'cyber-btn-danger' : 'cyber-btn-primary'}>
          {mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
        </button>
        {mfaEnabled && (
          <div className="mt-4 p-4 border border-slate-border rounded-lg">
            <p className="text-sm text-cyber-muted">Scan QR code with authenticator app (demo):</p>
            <div className="mt-2 w-32 h-32 bg-slate-bg border border-slate-border flex items-center justify-center text-cyber-muted text-xs">
              QR Placeholder
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
