import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const ACTION_COLORS = {
  LOGIN: 'text-status-completed',
  LOGOUT: 'text-cyber-muted',
  USER_APPROVED: 'text-status-completed',
  USER_REJECTED: 'text-status-rejected',
  REGISTER: 'text-status-active',
  PRE_REGISTER: 'text-cyber-accent',
};

export default function AuditLogsPage() {
  const { getData } = useData();
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');

  let logs = [...(getData()?.auditLogs ?? [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  );

  if (actionFilter) logs = logs.filter((l) => l.action === actionFilter);
  if (search.trim()) {
    const q = search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.user?.toLowerCase().includes(q) ||
        l.details?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q),
    );
  }

  const actions = [...new Set((getData()?.auditLogs ?? []).map((l) => l.action))];

  function exportCsv() {
    const rows = [
      ['Timestamp', 'Action', 'User', 'Role', 'Details'],
      ...logs.map((l) => [
        l.timestamp,
        l.action,
        l.user,
        l.role,
        l.details?.replace(/,/g, ';') ?? '',
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/dashboard/system-admin" className="text-cyber-accent text-sm hover:underline">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-cyber-accent mt-2">Audit Logs</h1>
          <p className="text-cyber-muted text-sm">{logs.length} entries</p>
        </div>
        <button type="button" onClick={exportCsv} className="cyber-btn-secondary">
          <i className="fas fa-download mr-2" /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="cyber-input w-auto min-w-[200px]"
          placeholder="Search user or details…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="cyber-select w-auto"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="cyber-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-cyber-muted border-b border-slate-border text-left">
              <th className="pb-3 pr-4">Timestamp</th>
              <th className="pb-3 pr-4">Action</th>
              <th className="pb-3 pr-4">User</th>
              <th className="pb-3 pr-4">Role</th>
              <th className="pb-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-border/50">
                <td className="py-3 pr-4 text-cyber-muted whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className={`py-3 pr-4 font-medium ${ACTION_COLORS[log.action] ?? ''}`}>
                  {log.action}
                </td>
                <td className="py-3 pr-4">{log.user}</td>
                <td className="py-3 pr-4 text-cyber-muted">{log.role}</td>
                <td className="py-3 text-cyber-muted">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
