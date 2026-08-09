import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants';
import { fetchPreRegisteredUsers } from '../../services/authService';
import PreRegisterForm from '../../components/forms/PreRegisterForm';
import StatusBadge from '../../components/ui/StatusBadge';

export default function PreRegisterUsersPage() {
  const { user, preRegisterOfficial } = useAuth();
  const [preRegistered, setPreRegistered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await fetchPreRegisteredUsers();
      setPreRegistered(data);
    } catch (err) {
      setError(err.message ?? 'Failed to load pre-registered officials.');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  async function handleSubmit(form, setFormError) {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await preRegisterOfficial(form, user);
      setMessage('Official pre-registered successfully.');
      await loadList();
    } catch (err) {
      const msg = err.message ?? 'Failed to pre-register official.';
      if (setFormError) setFormError(msg);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/dashboard/system-admin" className="text-cyber-accent text-sm hover:underline">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-cyber-accent mt-2">Pre-Register Officials</h1>
        <p className="text-cyber-muted text-sm">
          Add government officials before they complete registration
        </p>
      </div>

      <div className="cyber-card mb-8">
        <h2 className="font-semibold mb-4">New Pre-Registration</h2>
        {message && (
          <div className="mb-4 p-3 rounded-lg bg-status-completed/10 border border-status-completed/30 text-status-completed text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
            {error}
          </div>
        )}
        <PreRegisterForm onSubmit={handleSubmit} loading={loading} />
      </div>

      <div className="cyber-card overflow-x-auto">
        <h2 className="font-semibold mb-4">Pre-Registered Officials ({preRegistered.length})</h2>
        {listLoading ? (
          <p className="text-cyber-muted text-center py-8">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-cyber-muted border-b border-slate-border text-left">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">NID</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">Position</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {preRegistered.map((o) => (
                <tr key={o.id} className="border-b border-slate-border/50">
                  <td className="py-3 pr-4 font-medium">{o.fullName}</td>
                  <td className="py-3 pr-4 font-mono">{o.nid}</td>
                  <td className="py-3 pr-4">{o.email}</td>
                  <td className="py-3 pr-4">{ROLES[o.role] ?? o.role}</td>
                  <td className="py-3 pr-4 text-cyber-muted">{o.position}</td>
                  <td className="py-3">
                    <StatusBadge status={o.isRegistered ? 'Completed' : 'Pending'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
