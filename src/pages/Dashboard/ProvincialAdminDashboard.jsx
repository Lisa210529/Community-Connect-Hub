import { useCallback, useEffect, useMemo, useState } from 'react';
import QuickActions from '../../components/ui/QuickActions';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';

const DISTRICT_MAP = {
  'Madang District': ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6', 'Madang'],
  'Bogia District': ['Ward 12', 'Bogia'],
  'Rai Coast District': ['Ward 7', 'Ward 10', 'Bilibil', 'Tabibuga'],
  'Sumkar District': ['Ward 8', 'Kar Kar'],
  'Usino-Bundi District': ['Ward 9', 'Ward 11', 'Usino', 'Bundi'],
  'Middle Ramu': ['Ward 6', 'Simbai'],
};

function resolveDistrict(ward = '', location = '') {
  const text = `${ward} ${location}`.toLowerCase();
  for (const [district, keys] of Object.entries(DISTRICT_MAP)) {
    if (keys.some((k) => text.includes(k.toLowerCase().replace('ward ', 'ward')))) {
      return district;
    }
  }
  if (text.includes('madang')) return 'Madang District';
  return 'Other';
}

function buildDistrictSummary(projects) {
  const districts = {};
  projects.forEach((p) => {
    const district = resolveDistrict(p.ward, p.location);
    if (!districts[district]) {
      districts[district] = { total: 0, inProgress: 0, completed: 0, pending: 0, budget: 0 };
    }
    districts[district].total += 1;
    districts[district].budget += Number(p.budget ?? 0);
    if (p.status === 'In Progress') districts[district].inProgress += 1;
    if (p.status === 'Completed') districts[district].completed += 1;
    if (String(p.status ?? '').includes('Pending')) districts[district].pending += 1;
  });

  return Object.entries(districts)
    .map(([name, stats]) => ({
      name,
      ...stats,
      completionRate: stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100),
    }))
    .sort((a, b) => b.total - a.total);
}

export default function ProvincialAdminDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('firestore');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reviewProject, setReviewProject] = useState(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loadHybridCollection('projects', () => firestoreService.getProjects());
      setProjects(result.data);
      setDataSource(result.dataSource);
    } catch (err) {
      setError(err.message || 'Failed to load provincial data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const pendingProvincial = useMemo(
    () => projects.filter((p) => p.status === 'Pending Provincial'),
    [projects],
  );
  const inProgress = projects.filter((p) => p.status === 'In Progress');
  const completed = projects.filter((p) => p.status === 'Completed');
  const completionRate = projects.length ? Math.round((completed.length / projects.length) * 100) : 0;
  const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget ?? 0), 0);
  const districtSummary = buildDistrictSummary(projects);

  const quickActions = [
    { label: 'Provincial Projects', to: '/projects', icon: 'fa-folder-open' },
    { label: 'Performance Reports', to: '/reports', icon: 'fa-chart-pie' },
    { label: 'Acquittal Review', to: '/acquittals', icon: 'fa-file-invoice-dollar' },
    { label: 'Announcements', to: '/announcements', icon: 'fa-bullhorn' },
  ];

  async function handleProvincialDecision(approved) {
    if (!reviewProject) return;
    setSaving(true);
    setError('');
    try {
      const updates = {
        status: approved ? 'Funded' : 'Rejected',
        provincialComment: comment.trim(),
        provincialReviewedAt: new Date().toISOString(),
        provincialReviewerId: user?.uid ?? user?.id,
      };
      await firestoreService.updateProject(reviewProject.id, updates);

      const mayor = await firestoreService.findMayor();
      const notifyIds = new Set([mayor?.uid, reviewProject.councillorId].filter(Boolean));
      await Promise.all(
        Array.from(notifyIds).map((userId) =>
          firestoreService.createNotification({
            userId,
            type: approved ? 'project_approved' : 'project_rejected',
            title: approved ? 'Project Approved (Provincial)' : 'Project Rejected (Provincial)',
            message: `${reviewProject.name} was ${approved ? 'approved' : 'rejected'} by Provincial Admin.${comment.trim() ? ` Comment: ${comment.trim()}` : ''}`,
            wardId: reviewProject.wardId,
            projectId: reviewProject.id,
          }).catch(() => null),
        ),
      );

      setSuccessMessage(`Project ${approved ? 'approved' : 'rejected'} successfully.`);
      setReviewProject(null);
      setComment('');
      await loadProjects();
    } catch (err) {
      setError(err.message || 'Failed to update project.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-cyber-accent">Provincial Admin Dashboard</h1>
          <DataSourceIndicator source={dataSource} />
        </div>
        <p className="text-cyber-muted text-sm mt-1">
          Madang Province · {user?.name} · Provincial oversight and analytics
        </p>
      </header>

      {successMessage && (
        <div className="p-3 rounded-lg bg-status-completed/10 border border-status-completed/30 text-status-completed text-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-cyber-muted text-sm animate-pulse">Loading provincial data…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Projects" value={projects.length} icon="fa-folder-open" />
            <StatCard label="Pending Provincial" value={pendingProvincial.length} icon="fa-clock" accent="text-status-pending" />
            <StatCard label="Total Budget" value={`K ${totalBudget.toLocaleString()}`} icon="fa-coins" accent="text-cyber-accent" />
            <StatCard label="Completion Rate" value={`${completionRate}%`} icon="fa-chart-line" accent="text-status-completed" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Districts Covered" value={districtSummary.length} icon="fa-map" />
            <StatCard label="In Progress" value={inProgress.length} icon="fa-spinner" accent="text-status-active" />
            <StatCard label="Completed" value={completed.length} icon="fa-check-circle" accent="text-status-completed" />
          </div>

          <section>
            <h2 className="text-sm font-semibold text-cyber-muted uppercase tracking-wide mb-3">Quick Actions</h2>
            <QuickActions actions={quickActions} />
          </section>

          <section className="cyber-card">
            <h2 className="text-lg font-semibold text-cyber-text mb-4">District Performance Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-cyber-muted border-b border-slate-border text-left">
                    <th className="py-2 pr-4 font-medium">District</th>
                    <th className="py-2 pr-4 font-medium">Total</th>
                    <th className="py-2 pr-4 font-medium">Budget (K)</th>
                    <th className="py-2 pr-4 font-medium">Pending</th>
                    <th className="py-2 font-medium">Completion %</th>
                  </tr>
                </thead>
                <tbody>
                  {districtSummary.map((row) => (
                    <tr key={row.name} className="border-b border-slate-border/50">
                      <td className="py-3 pr-4 font-medium">{row.name}</td>
                      <td className="py-3 pr-4 text-cyber-muted">{row.total}</td>
                      <td className="py-3 pr-4 text-cyber-muted">{row.budget.toLocaleString()}</td>
                      <td className="py-3 pr-4">{row.pending > 0 ? <StatusBadge status="Pending" /> : '0'}</td>
                      <td className="py-3 text-cyber-accent font-medium">{row.completionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="cyber-card">
            <h2 className="text-lg font-semibold text-cyber-text mb-4">Provincial Approvals</h2>
            {pendingProvincial.length === 0 ? (
              <p className="text-cyber-muted text-sm">No projects awaiting provincial review.</p>
            ) : (
              <div className="space-y-3">
                {pendingProvincial.map((p) => (
                  <div key={p.id} className="p-4 rounded-lg bg-slate-bg border border-slate-border flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-cyber-muted">{p.ward} · K {Number(p.budget ?? 0).toLocaleString()} · {p.fundingSource || '—'}</p>
                    </div>
                    <button type="button" onClick={() => setReviewProject(p)} className="cyber-btn-primary text-sm">
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Modal open={!!reviewProject} onClose={() => setReviewProject(null)} title="Provincial Project Review" wide>
        {reviewProject && (
          <div className="space-y-4">
            <p className="font-medium text-lg">{reviewProject.name}</p>
            <p className="text-sm text-cyber-muted">{reviewProject.ward} · K {Number(reviewProject.budget ?? 0).toLocaleString()}</p>
            <textarea
              className="cyber-input min-h-[80px]"
              placeholder="Approval comments (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex gap-3">
              <button type="button" disabled={saving} onClick={() => handleProvincialDecision(true)} className="cyber-btn-success flex-1">
                Approve
              </button>
              <button type="button" disabled={saving} onClick={() => handleProvincialDecision(false)} className="cyber-btn-danger flex-1">
                Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
