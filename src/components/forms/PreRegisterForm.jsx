import { useState } from 'react';
import { PRE_REGISTER_ROLES } from '../../constants';

const WARD_OPTIONS = Array.from({ length: 10 }, (_, i) => `Ward ${i + 1}`);

const EMPTY = {
  fullName: '',
  nid: '',
  email: '',
  role: 'councillor',
  position: '',
  ward: 'Ward 5',
  province: 'Madang',
  district: 'Madang',
  llg: 'Madang Urban',
};

export default function PreRegisterForm({ onSubmit, loading }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    onSubmit(form, setError);
  }

  const needsWard = ['councillor'].includes(form.role);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-cyber-muted mb-1">Full Name</label>
          <input
            className="cyber-input"
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-cyber-muted mb-1">NID (10 digits)</label>
          <input
            className="cyber-input"
            value={form.nid}
            onChange={(e) => update('nid', e.target.value.replace(/\D/g, '').slice(0, 10))}
            maxLength={10}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-cyber-muted mb-1">Email</label>
          <input
            type="email"
            className="cyber-input"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-cyber-muted mb-1">Role</label>
          <select
            className="cyber-select"
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
          >
            {PRE_REGISTER_ROLES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-cyber-muted mb-1">Position Title</label>
          <input
            className="cyber-input"
            value={form.position}
            onChange={(e) => update('position', e.target.value)}
            placeholder="e.g. Ward 5 Councillor"
            required
          />
        </div>
        {needsWard && (
          <div>
            <label className="block text-sm text-cyber-muted mb-1">Ward</label>
            <select
              className="cyber-select"
              value={form.ward}
              onChange={(e) => update('ward', e.target.value)}
              required
            >
              {WARD_OPTIONS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <button type="submit" className="cyber-btn-primary" disabled={loading}>
        {loading ? 'Saving…' : 'Pre-Register Official'}
      </button>
    </form>
  );
}
