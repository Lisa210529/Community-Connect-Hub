import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ROLES } from '../../constants';
import PreRegisterForm from '../../components/forms/PreRegisterForm';
import StatusBadge from '../../components/ui/StatusBadge';

export default function PreRegisterUsersPage() {
  const { user, preRegisterOfficial } = useAuth();
  const { getData, refresh } = useData();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const preRegistered = (getData()?.preRegisteredUsers ?? getData()?.preregisteredOfficials ?? [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  function handleSubmit(form, setFormError) {
    setLoading(true);
    setMessage('');
    try {
      preRegisterOfficial(form, user);
      refresh();
      setMessage('Official pre-registered successfully.');
    } catch (err) {
      if (setFormError) setFormError(err.message);
      else setMessage(err.message);
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
        <PreRegisterForm onSubmit={handleSubmit} loading={loading} />
      </div>

      <div className="cyber-card overflow-x-auto">
        <h2 className="font-semibold mb-4">Pre-Registered Officials ({preRegistered.length})</h2>
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
              <tr key={o.id ?? o.preRegId} className="border-b border-slate-border/50">
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
      </div>
    </div>
  );
}
