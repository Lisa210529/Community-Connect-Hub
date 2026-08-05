import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ROLES } from '../../constants';
import { updateItem, addAuditLog } from '../../services/localStorageService';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';

export default function ManageUsersPage() {
  const { user } = useAuth();
  const { getData, refresh } = useData();
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  let users = getData()?.users ?? [];

  if (roleFilter) users = users.filter((u) => u.role === roleFilter);
  if (statusFilter === 'active') users = users.filter((u) => u.isActive && u.isApproved);
  if (statusFilter === 'pending') users = users.filter((u) => !u.isApproved);
  if (statusFilter === 'inactive') users = users.filter((u) => !u.isActive);

  function toggleActive(id) {
    const target = getData()?.users?.find((u) => u.id === id);
    if (!target) return;
    const next = !target.isActive;
    updateItem('users', id, { isActive: next, updatedAt: new Date().toISOString() });
    addAuditLog(
      next ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      user?.name,
      user?.role,
      `${next ? 'Activated' : 'Deactivated'} ${target.name}`,
    );
    refresh();
  }

  const roles = [...new Set((getData()?.users ?? []).map((u) => u.role))];

  return (
    <div>
      <div className="mb-6">
        <Link to="/dashboard/system-admin" className="text-cyber-accent text-sm hover:underline">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-cyber-accent mt-2">Manage Users</h1>
        <p className="text-cyber-muted text-sm">{users.length} users shown</p>
      </div>

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
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-border/50">
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
                  {u.role !== 'system-admin' && (
                    <button
                      type="button"
                      onClick={() => toggleActive(u.id)}
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
      </div>
    </div>
  );
}
