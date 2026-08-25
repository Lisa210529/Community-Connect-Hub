import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
import Modal from '../../components/ui/Modal';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';
import {
  getWardNumber,
  extractWardIdFromItem,
  resolveWardId,
  matchesWard,
  filterProjectRequests,
  groupRequestsByCategory,
  getGroupStatusLabel,
  normalizeRequestStatus,
  normalizeProjectStatus,
  REQUESTS_THRESHOLD,
  REPORT_STATUSES,
  reportStatusLabel,
  resolveWdcPositionLabel,
} from '../../utils/wdcHelpers';
import {
  getWdcRoleDashboard,
  wdcRoleCanAccessTab,
} from '../../constants/wdcRoles';
import { Link } from 'react-router-dom';

const EMPTY_REPORT = {
  projectId: '',
  title: '',
  content: '',
  budget: '',
  actual: '',
  variance: '',
  notes: '',
};

async function loadWardCollection(collectionName, user, fetchAllFn) {
  const result = await loadHybridCollection(collectionName, fetchAllFn);
  return {
    ...result,
    data: result.data.filter((item) => matchesWard(item, user)),
  };
}

export default function WDCDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const wardNumber = getWardNumber(user);
  const wardId = resolveWardId(user);
  const llg = user?.llg ?? 'Madang Urban LLG';
  const activeTab = searchParams.get('tab') || 'overview';
  const roleDashboard = getWdcRoleDashboard(user);
  const positionLabel = resolveWdcPositionLabel(user);
  const tabAllowed = wdcRoleCanAccessTab(user, activeTab);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dataSource, setDataSource] = useState('firestore');
  const [requests, setRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [communityNeeds, setCommunityNeeds] = useState([]);
  const [requestFilter, setRequestFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [requestSearch, setRequestSearch] = useState('');
  const [forwardingKey, setForwardingKey] = useState('');
  const [viewGroup, setViewGroup] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [reportModal, setReportModal] = useState(false);
  const [reportForm, setReportForm] = useState(EMPTY_REPORT);
  const [savingReport, setSavingReport] = useState(false);

  const projectRequests = useMemo(() => filterProjectRequests(requests), [requests]);

  const groupedRequests = useMemo(
    () => groupRequestsByCategory(projectRequests, REQUESTS_THRESHOLD),
    [projectRequests],
  );

  const communityNeedGroups = useMemo(
    () => groupedRequests.filter((g) => g.isCommunityNeed),
    [groupedRequests],
  );

  const overviewStats = useMemo(() => {
    const newRequests = projectRequests.filter((r) => {
      const status = normalizeRequestStatus(r.status);
      return status === 'pending' || status === 'pending_wdc';
    }).length;

    const activeProjects = projects.filter(
      (p) => normalizeProjectStatus(p.status) === 'in_progress',
    ).length;

    const pendingReports = reports.filter((r) => normalizeRequestStatus(r.status) === 'draft').length;

    const communityNeedsCount = communityNeedGroups.filter((g) => !g.alreadyForwarded).length;

    return { newRequests, communityNeedsCount, activeProjects, pendingReports };
  }, [projectRequests, projects, reports, communityNeedGroups]);

  const availableZones = useMemo(() => {
    const zones = new Set(groupedRequests.map((g) => g.zone).filter(Boolean));
    return ['all', ...Array.from(zones).sort()];
  }, [groupedRequests]);

  const availableCategories = useMemo(() => {
    const categories = new Set(groupedRequests.map((g) => g.category).filter(Boolean));
    return ['all', ...Array.from(categories).sort()];
  }, [groupedRequests]);

  const filteredGroupedRequests = useMemo(() => {
    let list = [...groupedRequests];

    if (requestFilter === 'individual') {
      list = list.filter((g) => !g.isCommunityNeed);
    } else if (requestFilter === 'community') {
      list = list.filter((g) => g.isCommunityNeed);
    }

    if (zoneFilter !== 'all') {
      list = list.filter((g) => g.zone === zoneFilter);
    }

    if (categoryFilter !== 'all') {
      list = list.filter((g) => g.category === categoryFilter);
    }

    if (requestSearch.trim()) {
      const q = requestSearch.trim().toLowerCase();
      list = list.filter(
        (g) =>
          g.category.toLowerCase().includes(q) ||
          g.zone.toLowerCase().includes(q) ||
          g.residentNames.some((name) => name.toLowerCase().includes(q)),
      );
    }

    return list.sort((a, b) => b.residentCount - a.residentCount);
  }, [groupedRequests, requestFilter, zoneFilter, categoryFilter, requestSearch]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reqResult, projResult, reportResult, needsResult] = await Promise.all([
        loadWardCollection('requests', user, () => firestoreService.getRequests()),
        loadWardCollection('projects', user, () => firestoreService.getProjects()),
        loadWardCollection('reports', user, () => firestoreService.getReports()),
        loadWardCollection('communityNeeds', user, () => firestoreService.getCommunityNeeds()),
      ]);

      setRequests(reqResult.data);
      setProjects(projResult.data);
      setReports(reportResult.data);
      setCommunityNeeds(needsResult.data);

      const sources = new Set([
        reqResult.dataSource,
        projResult.dataSource,
        reportResult.dataSource,
        needsResult.dataSource,
      ]);
      if (sources.has('mixed') || sources.size > 1) setDataSource('mixed');
      else if (sources.has('localstorage')) setDataSource('localstorage');
      else setDataSource('firestore');
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [user, wardId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  async function handleForwardToCouncillor(group) {
    if (!group.canForward) return;

    setForwardingKey(group.groupKey);
    setError('');
    setSuccessMessage('');

    try {
      const councillor = await firestoreService.findCouncillorByWard(wardId);
      const councillorId = councillor?.uid ?? councillor?.id ?? null;

      await firestoreService.createCommunityNeed({
        category: group.category,
        projectType: group.category,
        wardId,
        ward: user?.ward ?? `Ward ${wardNumber}`,
        zone: group.zone,
        residentCount: group.residentCount,
        residentIds: group.residentIds,
        requestIds: group.requestIds,
        status: 'forwarded_to_councillor',
        forwardedAt: new Date().toISOString(),
        forwardedBy: user?.uid ?? user?.id,
        councillorId,
        reason: 'High demand from residents',
      });

      await Promise.all(
        group.requestIds.map((id) => firestoreService.updateRequest(id, { status: 'forwarded' })),
      );

      if (councillorId) {
        await firestoreService.createNotification({
          userId: councillorId,
          type: 'community_need_forwarded',
          title: 'New Community Need forwarded from WDC',
          message: `${group.category} in ${group.zone} (${group.residentCount} residents) was forwarded by WDC Ward ${wardNumber}.`,
          wardId,
          zone: group.zone,
          relatedRequestIds: group.requestIds,
          fromUserId: user?.uid ?? user?.id,
        });
      }

      setSuccessMessage(`"${group.category}" (${group.zone}) forwarded to the Ward Councillor.`);
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to forward community need.');
    } finally {
      setForwardingKey('');
    }
  }

  async function handleCreateReport(e) {
    e.preventDefault();
    setSavingReport(true);
    setError('');

    const budget = Number(reportForm.budget) || 0;
    const actual = Number(reportForm.actual) || 0;

    try {
      await firestoreService.createReport({
        projectId: reportForm.projectId,
        wdcId: user?.uid ?? user?.id,
        wardId,
        title: reportForm.title,
        content: reportForm.content,
        financialDetails: {
          budget,
          actual,
          variance: budget - actual,
          notes: reportForm.notes,
        },
        attachments: [],
        status: 'draft',
        createdAt: new Date().toISOString(),
      });

      setReportModal(false);
      setReportForm(EMPTY_REPORT);
      setSuccessMessage('Report draft created successfully.');
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to create report.');
    } finally {
      setSavingReport(false);
    }
  }

  function renderOverview() {
    const statDefs = {
      newRequests: { label: 'New Requests', value: overviewStats.newRequests, icon: 'fa-inbox' },
      communityNeedsCount: {
        label: 'Community Needs',
        value: overviewStats.communityNeedsCount,
        icon: 'fa-users',
        accent: 'text-status-pending',
      },
      activeProjects: {
        label: 'Active Projects',
        value: overviewStats.activeProjects,
        icon: 'fa-folder-open',
        accent: 'text-status-active',
      },
      pendingReports: {
        label: 'Pending Reports',
        value: overviewStats.pendingReports,
        icon: 'fa-file-alt',
        accent: 'text-cyber-muted',
      },
    };

    return (
      <div className="space-y-6">
        <section className="cyber-card">
          <h2 className="text-lg font-semibold text-cyber-text mb-2">Your WDC responsibilities</h2>
          <p className="text-sm text-cyber-muted mb-3">{roleDashboard.subtitle}</p>
          <ul className="text-sm text-cyber-muted space-y-1 list-disc list-inside">
            {roleDashboard.duties.map((duty) => (
              <li key={duty}>{duty}</li>
            ))}
          </ul>
        </section>

        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${roleDashboard.statLabels.length > 2 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'}`}>
          {roleDashboard.statLabels.map((key) => {
            const stat = statDefs[key];
            if (!stat) return null;
            return (
              <StatCard
                key={key}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                accent={stat.accent}
              />
            );
          })}
        </div>

        {roleDashboard.overviewSection === 'communityNeeds' && (
          <section className="cyber-card">
            <h2 className="text-lg font-semibold text-cyber-text mb-4">Recent Community Needs</h2>
            {communityNeedGroups.length === 0 ? (
              <p className="text-cyber-muted text-sm">No grouped community needs yet (requires {REQUESTS_THRESHOLD}+ residents).</p>
            ) : (
              <div className="space-y-3">
                {communityNeedGroups.slice(0, 5).map((group) => (
                  <div
                    key={group.groupKey}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-bg border border-slate-border"
                  >
                    <div>
                      <p className="font-medium text-cyber-text">{group.category}</p>
                      <p className="text-xs text-cyber-muted">
                        {group.zone} · {group.residentCount} residents · Ward {wardNumber}
                      </p>
                    </div>
                    <StatusBadge status={getGroupStatusLabel(group)} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {roleDashboard.overviewSection === 'secretariat' && (
          <section className="cyber-card">
            <h2 className="text-lg font-semibold text-cyber-text mb-4">Secretariat quick actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/meetings" className="cyber-btn-secondary text-sm">WDC Meetings</Link>
              <Link to="/resolutions" className="cyber-btn-secondary text-sm">Resolutions</Link>
              <Link to="/documents" className="cyber-btn-primary text-sm">WDC Documents</Link>
            </div>
          </section>
        )}

        {roleDashboard.overviewSection === 'finance' && (
          <section className="cyber-card">
            <h2 className="text-lg font-semibold text-cyber-text mb-4">Finance &amp; acquittal</h2>
            <p className="text-sm text-cyber-muted mb-3">
              Prepare project reports and acquittal documents, then obtain Chairman co-signature before LLG submission.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard/wdc?tab=reports" className="cyber-btn-secondary text-sm">Ward Reports</Link>
              <Link to="/documents" className="cyber-btn-primary text-sm">Acquittal Documents</Link>
              <Link to="/acquittals" className="cyber-btn-secondary text-sm">Acquittals</Link>
            </div>
          </section>
        )}

        {roleDashboard.overviewSection === 'projects' && (
          <section className="cyber-card">
            <h2 className="text-lg font-semibold text-cyber-text mb-4">Ward projects</h2>
            <p className="text-sm text-cyber-muted mb-3">
              Review progress on funded and in-progress ward projects for Ward {wardNumber}.
            </p>
            <Link to="/projects" className="cyber-btn-primary text-sm">View Projects</Link>
          </section>
        )}
      </div>
    );
  }

  function renderRequests() {
    return (
      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-cyber-accent">Resident Project Requests</h2>
            <p className="text-sm text-cyber-muted">
              Grouped by project category and zone ({REQUESTS_THRESHOLD}+ residents = Community Need)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              className="cyber-select w-auto text-sm"
              value={requestFilter}
              onChange={(e) => setRequestFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="individual">Individual (&lt;{REQUESTS_THRESHOLD} residents)</option>
              <option value="community">Community Need ({REQUESTS_THRESHOLD}+ residents)</option>
            </select>
            <select
              className="cyber-select w-auto text-sm"
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
            >
              {availableZones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone === 'all' ? 'All Zones' : zone}
                </option>
              ))}
            </select>
            <select
              className="cyber-select w-auto text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <input
              className="cyber-input w-48 text-sm"
              placeholder="Search…"
              value={requestSearch}
              onChange={(e) => setRequestSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="cyber-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-cyber-muted border-b border-slate-border text-left">
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">Zone / Area</th>
                <th className="pb-3 pr-4">Residents</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroupedRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-cyber-muted">
                    No project requests found for this ward.
                  </td>
                </tr>
              )}
              {filteredGroupedRequests.map((group) => (
                <tr key={group.groupKey} className="border-b border-slate-border/50">
                  <td className="py-3 pr-4 font-medium">{group.category}</td>
                  <td className="py-3 pr-4 text-cyber-muted">{group.zone}</td>
                  <td className="py-3 pr-4 text-cyber-muted">
                    {group.residentCount} Resident{group.residentCount === 1 ? '' : 's'}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={getGroupStatusLabel(group)} />
                  </td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => setViewGroup(group)}
                      className="text-cyber-accent text-xs hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderCommunityNeeds() {
    const pendingNeeds = communityNeedGroups.filter((g) => g.isCommunityNeed);

    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-cyber-accent">
          Community Needs ({REQUESTS_THRESHOLD}+ Residents)
        </h2>
        <p className="text-sm text-cyber-muted">
          Confirm and forward project types with {REQUESTS_THRESHOLD} or more residents in the same zone
          to the Ward Councillor.
        </p>

        <div className="space-y-3">
          {pendingNeeds.length === 0 && (
            <div className="cyber-card text-center py-10">
              <p className="text-cyber-muted text-sm">
                No community needs meet the {REQUESTS_THRESHOLD}-resident threshold yet.
              </p>
            </div>
          )}
          {pendingNeeds.map((group) => (
            <div key={group.groupKey} className="cyber-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-cyber-text">{group.category}</h3>
                  <p className="text-sm text-cyber-muted mt-1">
                    {group.zone} · {group.residentCount} residents · Ward {wardNumber}
                  </p>
                  {group.residentNames?.length > 0 && (
                    <p className="text-xs text-cyber-muted mt-2">
                      Residents: {group.residentNames.join(', ')}
                    </p>
                  )}
                  <div className="mt-2">
                    <StatusBadge status={getGroupStatusLabel(group)} />
                  </div>
                </div>
                {group.alreadyForwarded ? (
                  <span className="text-sm text-status-completed font-medium">Forwarded to Councillor</span>
                ) : (
                  <button
                    type="button"
                    disabled={forwardingKey === group.groupKey}
                    onClick={() => handleForwardToCouncillor(group)}
                    className="cyber-btn-primary text-sm"
                  >
                    {forwardingKey === group.groupKey ? 'Forwarding…' : 'Forward to Councillor'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderReports() {
    return (
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-cyber-accent">Accountability Reports</h2>
          <button type="button" onClick={() => setReportModal(true)} className="cyber-btn-primary text-sm">
            <i className="fas fa-plus mr-2" aria-hidden="true" />
            New Report
          </button>
        </div>

        <div className="space-y-3">
          {reports.length === 0 && (
            <div className="cyber-card text-center py-10">
              <p className="text-cyber-muted text-sm">No reports yet. Create one for a completed project.</p>
            </div>
          )}
          {reports.map((report) => (
            <div key={report.id} className="cyber-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-cyber-text">{report.title}</h3>
                  <p className="text-sm text-cyber-muted mt-1 line-clamp-2">{report.content}</p>
                  {report.financialDetails && (
                    <p className="text-xs text-cyber-muted mt-2">
                      Budget K{report.financialDetails.budget?.toLocaleString?.() ?? '—'} · Actual K
                      {report.financialDetails.actual?.toLocaleString?.() ?? '—'}
                    </p>
                  )}
                </div>
                <StatusBadge status={reportStatusLabel(report.status)} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderTabContent() {
    if (loading) {
      return <p className="text-cyber-muted text-sm animate-pulse py-8">Loading dashboard data…</p>;
    }

    if (activeTab !== 'overview' && !tabAllowed) {
      return (
        <section className="cyber-card text-center py-10">
          <p className="text-cyber-text font-medium mb-2">Section not available for your WDC role</p>
          <p className="text-sm text-cyber-muted mb-4">
            {positionLabel} accounts do not access this dashboard tab. Use the menu items for your office.
          </p>
          <Link to="/dashboard/wdc" className="cyber-btn-primary text-sm">Back to Overview</Link>
        </section>
      );
    }

    switch (activeTab) {
      case 'requests':
        return renderRequests();
      case 'community-needs':
        return renderCommunityNeeds();
      case 'reports':
        return renderReports();
      default:
        return renderOverview();
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Community Connect Hub
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary mt-1">
            {roleDashboard.title}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {positionLabel} · Ward {wardNumber}, {llg}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DataSourceIndicator source={dataSource} />
        </div>
      </header>

      {error && (
        <div className="p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg bg-status-completed/10 border border-status-completed/30 text-status-completed text-sm">
          {successMessage}
        </div>
      )}

      {renderTabContent()}

      <Modal
        open={!!viewGroup}
        onClose={() => setViewGroup(null)}
        title={viewGroup ? `${viewGroup.category} — ${viewGroup.zone}` : 'Request Details'}
        wide
      >
        {viewGroup && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={getGroupStatusLabel(viewGroup)} />
              <span className="text-sm text-cyber-muted">
                {viewGroup.residentCount} residents · Ward {wardNumber}
              </span>
            </div>
            <div className="space-y-2">
              {viewGroup.requests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-lg bg-slate-bg border border-slate-border text-sm"
                >
                  <p className="font-medium text-cyber-text">{req.residentName || 'Unknown resident'}</p>
                  <p className="text-cyber-muted mt-1">{req.description}</p>
                  <p className="text-xs text-cyber-muted mt-2">
                    {req.createdAt
                      ? new Date(req.createdAt).toLocaleDateString('en-PG')
                      : '—'}{' '}
                    · {normalizeRequestStatus(req.status)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={reportModal} onClose={() => setReportModal(false)} title="Create Report Draft" wide>
        <form onSubmit={handleCreateReport} className="space-y-3">
          <div>
            <label className="text-xs text-cyber-muted">Project ID (optional)</label>
            <select
              className="cyber-input"
              value={reportForm.projectId}
              onChange={(e) => setReportForm({ ...reportForm, projectId: e.target.value })}
            >
              <option value="">Select project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Title</label>
            <input
              className="cyber-input"
              value={reportForm.title}
              onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
              placeholder="Accountability Report - Water Supply"
              required
            />
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Content</label>
            <textarea
              className="cyber-input min-h-[120px]"
              value={reportForm.content}
              onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-cyber-muted">Budget (K)</label>
              <input
                type="number"
                className="cyber-input"
                value={reportForm.budget}
                onChange={(e) => setReportForm({ ...reportForm, budget: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Actual (K)</label>
              <input
                type="number"
                className="cyber-input"
                value={reportForm.actual}
                onChange={(e) => setReportForm({ ...reportForm, actual: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Financial Notes</label>
            <input
              className="cyber-input"
              value={reportForm.notes}
              onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
              placeholder="Under budget, etc."
            />
          </div>
          <p className="text-xs text-cyber-muted">
            Status: {REPORT_STATUSES.find((s) => s.value === 'draft')?.label}
          </p>
          <button type="submit" disabled={savingReport} className="cyber-btn-primary w-full">
            {savingReport ? 'Saving…' : 'Save Draft Report'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
