import { useState } from 'react';
import QuickActions from '../../components/ui/QuickActions';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants';
import { normalizeRole } from '../../constants/roleMapping';
import { normalizeAllUserRoles } from '../../services/authService';
import { updateItem, addAuditLog, isDataMigrated } from '../../services/localStorageService';
import { firestoreService } from '../../services/firestoreService';

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString('en-PG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ACTION_COLORS = {
  LOGIN: 'text-status-completed',
  LOGOUT: 'text-cyber-muted',
  USER_LOGIN: 'text-status-completed',
  USER_APPROVED: 'text-status-completed',
  REGISTER: 'text-status-active',
  REGISTRATION_PENDING: 'text-status-pending',
  PROJECT_CREATED: 'text-cyber-accent',
  PROJECT_STATUS_UPDATED: 'text-status-active',
  RESOLUTION_APPROVED: 'text-status-completed',
  ANNOUNCEMENT_PUBLISHED: 'text-cyber-accent',
  REPORT_EXPORTED: 'text-cyber-muted',
};

export default function SystemAdminDashboard() {
  const { user } = useAuth();
  const { getData, refresh } = useData();
  const data = getData();
  const [migrationResults, setMigrationResults] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState('');
  const [normalizingRoles, setNormalizingRoles] = useState(false);
  const [normalizeMessage, setNormalizeMessage] = useState('');
  const showMigration = !isDataMigrated();
  const adminRole = normalizeRole(user?.role);

  const users = data?.users ?? [];
  const auditLogs = [...(data?.auditLogs ?? [])]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const pendingApproval = users.filter((u) => !u.isApproved).length;
  const inactiveUsers = users.filter((u) => !u.isActive).length;

  const roleBreakdown = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const pendingUsers = users
    .filter((u) => !u.isApproved && u.role === 'resident')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const preregistered = (data?.preRegisteredUsers ?? data?.preregisteredOfficials ?? [])
    .filter((o) => !o.isRegistered)
    .slice(0, 6);

  const quickActions = [
    { label: 'Manage Users', to: '/admin/users', icon: 'fa-users' },
    { label: 'Pre-Register Officials', to: '/admin/pre-register', icon: 'fa-user-plus' },
    { label: 'Pending Approvals', to: '/admin/approvals', icon: 'fa-user-clock' },
    { label: 'Audit Logs', to: '/admin/audit-logs', icon: 'fa-clipboard-list' },
    { label: 'System Settings', to: '/profile', icon: 'fa-cog' },
  ];

  function handleUserApproval(id, approved) {
    updateItem('users', id, { isApproved: approved, isActive: approved });
    const target = users.find((u) => u.id === id);
    addAuditLog(
      approved ? 'USER_APPROVED' : 'USER_REJECTED',
      user?.name,
      user?.role,
      `${approved ? 'Approved' : 'Rejected'} ${target?.name} (NID: ${target?.nid ?? '—'})`,
    );
    refresh();
  }

  async function handleMigration() {
    setMigrating(true);
    setMigrationError('');
    try {
      const results = await firestoreService.migrateFromLocalStorage();
      setMigrationResults(results);
      addAuditLog(
        'DATA_MIGRATED',
        user?.name,
        adminRole,
        'Migrated localStorage data to Firestore',
      );
      refresh();
    } catch (err) {
      setMigrationError(err.message || 'Migration failed.');
    } finally {
      setMigrating(false);
    }
  }

  async function handleNormalizeRoles() {
    setNormalizingRoles(true);
    setNormalizeMessage('');
    try {
      const count = await normalizeAllUserRoles();
      setNormalizeMessage(`Normalized ${count} user role${count === 1 ? '' : 's'}.`);
      addAuditLog(
        'ROLES_NORMALIZED',
        user?.name,
        adminRole,
        `Normalized ${count} user roles in Firestore`,
      );
      refresh();
    } catch (err) {
      setNormalizeMessage(err.message || 'Role normalization failed.');
    } finally {
      setNormalizingRoles(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-cyber-accent">System Admin Dashboard</h1>
        <p className="text-cyber-muted text-sm mt-1">
          Community ConnectHub · {user?.name} · Platform administration and audit
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={totalUsers} icon="fa-users" />
        <StatCard
          label="Active Users"
          value={activeUsers}
          icon="fa-user-check"
          accent="text-status-completed"
        />
        <StatCard
          label="Pending Approval"
          value={pendingApproval}
          icon="fa-user-clock"
          accent="text-status-pending"
        />
        <StatCard
          label="Inactive Accounts"
          value={inactiveUsers}
          icon="fa-user-slash"
          accent="text-status-inactive"
        />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-cyber-muted uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <QuickActions actions={quickActions} />
      </section>

      {showMigration && (
        <section className="cyber-card migration-section">
          <h3 className="text-lg font-semibold text-cyber-text mb-2">Data Migration</h3>
          <p className="text-cyber-muted text-sm mb-4">
            Migrate requests, projects, announcements, and meetings from localStorage to Firestore.
            Existing localStorage data is kept as a backup.
          </p>
          {migrationError && (
            <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
              {migrationError}
            </div>
          )}
          <button
            type="button"
            onClick={handleMigration}
            disabled={migrating}
            className="cyber-btn-primary"
          >
            {migrating ? 'Syncing to Firestore…' : 'Sync to Firestore'}
          </button>
          <div className="migration-status mt-4">
            {migrationResults && (
              <pre className="text-xs bg-slate-bg border border-slate-border rounded-lg p-4 overflow-x-auto text-cyber-muted">
                {JSON.stringify(migrationResults, null, 2)}
              </pre>
            )}
          </div>
        </section>
      )}

      <section className="cyber-card">
        <h3 className="text-lg font-semibold text-cyber-text mb-2">Role Normalization</h3>
        <p className="text-cyber-muted text-sm mb-4">
          Update legacy role keys in Firestore (e.g. wdc_chairman, system_admin, pec) to standard names.
        </p>
        <button
          type="button"
          onClick={handleNormalizeRoles}
          disabled={normalizingRoles}
          className="cyber-btn-secondary"
        >
          {normalizingRoles ? 'Normalizing roles…' : 'Normalize All User Roles'}
        </button>
        {normalizeMessage && (
          <p className="text-sm text-cyber-muted mt-4">{normalizeMessage}</p>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="cyber-card">
          <h2 className="text-lg font-semibold text-cyber-text mb-4">Users by Role</h2>
          <div className="space-y-2">
            {Object.entries(roleBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([role, count]) => (
                <div
                  key={role}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-bg border border-slate-border"
                >
                  <span className="text-sm text-cyber-text">{ROLES[role] ?? role}</span>
                  <span className="text-sm font-semibold text-cyber-accent">{count}</span>
                </div>
              ))}
          </div>
        </section>

        <section className="cyber-card">
          <h2 className="text-lg font-semibold text-cyber-text mb-4">
            Pending Resident Approvals
          </h2>
          {pendingUsers.length === 0 ? (
            <p className="text-cyber-muted text-sm">No accounts awaiting approval.</p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-lg bg-slate-bg border border-slate-border"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-cyber-text">{u.name}</p>
                    <StatusBadge status="Pending" />
                  </div>
                  <p className="text-xs text-cyber-muted mt-1">
                    {ROLES[u.role] ?? u.role} · {u.ward}
                  </p>
                  <p className="text-xs text-cyber-muted">NID: {u.nid ?? '—'} · {u.email}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => handleUserApproval(u.id, true)}
                      className="cyber-btn-success text-xs"
                    >
                      <i className="fas fa-check mr-1" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUserApproval(u.id, false)}
                      className="cyber-btn-danger text-xs"
                    >
                      <i className="fas fa-times mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="cyber-card">
        <h2 className="text-lg font-semibold text-cyber-text mb-4">
          Pre-Registered Officials (Awaiting Signup)
        </h2>
        {preregistered.length === 0 ? (
          <p className="text-cyber-muted text-sm">All pre-registered officials have completed signup.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cyber-muted border-b border-slate-border text-left">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">NID</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 font-medium">Ward</th>
                </tr>
              </thead>
              <tbody>
                {preregistered.map((o) => (
                  <tr key={o.id} className="border-b border-slate-border/50">
                    <td className="py-3 pr-4 text-cyber-text">{o.fullName}</td>
                    <td className="py-3 pr-4 text-cyber-muted font-mono">{o.nid}</td>
                    <td className="py-3 pr-4 text-cyber-muted">{o.email}</td>
                    <td className="py-3 pr-4 text-cyber-muted">{ROLES[o.role] ?? o.role}</td>
                    <td className="py-3 text-cyber-muted">{o.ward}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="cyber-card">
        <h2 className="text-lg font-semibold text-cyber-text mb-4">Recent Audit Logs</h2>
        {auditLogs.length === 0 ? (
          <p className="text-cyber-muted text-sm">No audit log entries recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cyber-muted border-b border-slate-border text-left">
                  <th className="py-2 pr-4 font-medium">Timestamp</th>
                  <th className="py-2 pr-4 font-medium">Action</th>
                  <th className="py-2 pr-4 font-medium">User</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-border/50 hover:bg-slate-bg/50"
                  >
                    <td className="py-3 pr-4 text-cyber-muted whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`font-medium ${ACTION_COLORS[log.action] ?? 'text-cyber-accent'}`}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-cyber-text">{log.user}</td>
                    <td className="py-3 pr-4 text-cyber-muted">
                      {ROLES[log.role] ?? log.role}
                    </td>
                    <td className="py-3 text-cyber-muted max-w-xs truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
