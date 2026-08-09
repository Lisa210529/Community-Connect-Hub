import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants';
import { fetchAllUsers, setUserActive } from '../../services/authService';
import StatusBadge from '../../components/ui/StatusBadge';

export default function ManageUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message ?? 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  let filtered = users;
  if (roleFilter) filtered = filtered.filter((u) => u.role === roleFilter);
  if (statusFilter === 'active') filtered = filtered.filter((u) => u.isActive && u.isApproved);
  if (statusFilter === 'pending') filtered = filtered.filter((u) => !u.isApproved);
  if (statusFilter === 'inactive') filtered = filtered.filter((u) => !u.isActive);

  async function toggleActive(uid, currentActive) {
    try {
      await setUserActive(uid, !currentActive);
      await loadUsers();
    } catch (err) {
      setError(err.message ?? 'Failed to update user.');
    }
  }

  const roles = [...new Set(users.map((u) => u.role))];

  return (
    <div>
      <div className="mb-6">
        <Link to="/dashboard/system-admin" className="text-cyber-accent text-sm hover:underline">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-cyber-accent mt-2">Manage Users</h1>
        <p className="text-cyber-muted text-sm">{filtered.length} users shown</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          className="cyber-select w-auto"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>{ROLES[r] ?? r}</option>
          ))}
        </select>
        <select
          className="cyber-select w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending Approval</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="cyber-card overflow-x-auto">
        {loading ? (
          <p className="text-cyber-muted text-center py-8">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-cyber-muted border-b border-slate-border text-left">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">NID</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">Ward</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.uid} className="border-b border-slate-border/50">
                  <td className="py-3 pr-4 font-medium">{u.name}</td>
                  <td className="py-3 pr-4 font-mono">{u.nid}</td>
                  <td className="py-3 pr-4">{u.email}</td>
                  <td className="py-3 pr-4">{ROLES[u.role] ?? u.role}</td>
                  <td className="py-3 pr-4 text-cyber-muted">{u.ward ?? '—'}</td>
                  <td className="py-3 pr-4">
                    {!u.isApproved ? (
                      <StatusBadge status="Pending" />
                    ) : u.isActive ? (
                      <StatusBadge status="Completed" />
                    ) : (
                      <StatusBadge status="Rejected" />
                    )}
                  </td>
                  <td className="py-3">
                    {u.role !== 'system-admin' && u.uid !== user?.uid && (
                      <button
                        type="button"
                        onClick={() => toggleActive(u.uid, u.isActive)}
                        className="text-cyber-accent text-xs hover:underline"
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
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
