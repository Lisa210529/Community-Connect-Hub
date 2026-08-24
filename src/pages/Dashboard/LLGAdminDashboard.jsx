import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import QuickActions from '../../components/ui/QuickActions';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';
import { downloadBase64File } from '../../utils/fileHelpers';
import { WARDS, LLG_NAME, getWardById, getWardDisplayName, formatWardForDisplay } from '../../constants/wards';
import {
  buildWardSummary,
  findCouncillorForWard,
  filterByWard,
  sumFunding,
  computeCompletionRate,
} from '../../utils/wardMetrics';
import { ALL_STAKEHOLDER_TYPES } from '../../constants/funding';
import { normalizeRequestStatus } from '../../utils/wdcHelpers';
import { completeApprovedFunding } from '../../utils/fundingRepair';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StarRating({ rating }) {
  const rounded = Math.round(Number(rating) || 0);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-cyber-accent font-medium">{Number(rating).toFixed(1)}</span>
      <i className="fas fa-star text-cyber-accent text-xs" aria-hidden="true" />
      <span className="sr-only">{rounded} of 5 stars</span>
    </span>
  );
}

function needStatusLabel(status) {
  const normalized = normalizeRequestStatus(status);
  if (normalized === 'forwarded_to_councillor') return 'Forwarded';
  if (normalized === 'proposal_submitted_to_mayor') return 'Proposal Submitted';
  if (normalized === 'submitted_to_stakeholders') return 'Submitted to Stakeholders';
  if (normalized === 'returned_to_wdc') return 'Returned to WDC';
  return status || 'Pending';
}

export default function LLGAdminDashboard() {
  const { user } = useAuth();
  const { getData } = useData();
  const data = getData();
  const navigate = useNavigate();
  const location = useLocation();
  const { wardId: wardIdParam } = useParams();

  const selectedWard = wardIdParam ? getWardById(wardIdParam) : null;
  const isWardsOverview = location.pathname === '/dashboard/mayor/wards';
  const isWardDetail = Boolean(selectedWard);
  const isOverview = location.pathname === '/dashboard/mayor';

  const [proposals, setProposals] = useState([]);
  const [allProposals, setAllProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [viewProposal, setViewProposal] = useState(null);
  const [escalateForm, setEscalateForm] = useState({
    amountRequested: '',
    mayorNotes: 'Approved by Mayor. Awaiting stakeholder funding.',
  });
  const [submitting, setSubmitting] = useState(false);
  const [mayorMessage, setMayorMessage] = useState('');
  const [reviewLlgProject, setReviewLlgProject] = useState(null);
  const [llgComment, setLlgComment] = useState('');
  const [llgSaving, setLlgSaving] = useState(false);

  const [wardLoading, setWardLoading] = useState(false);
  const [wardDataSource, setWardDataSource] = useState('firestore');
  const [allProjects, setAllProjects] = useState([]);
  const [allNeeds, setAllNeeds] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [allRatings, setAllRatings] = useState([]);
  const [councillors, setCouncillors] = useState([]);

  const loadProposals = useCallback(async () => {
    setLoadingProposals(true);
    try {
      const all = await firestoreService.getProjectProposals();
      setAllProposals(all);
      setProposals(
        all
          .filter((p) => p.status === 'submitted_to_mayor')
          .sort((a, b) => new Date(b.submittedAt ?? 0) - new Date(a.submittedAt ?? 0)),
      );
    } catch (err) {
      console.error('Failed to load proposals:', err);
    } finally {
      setLoadingProposals(false);
    }
  }, []);

  const loadWardData = useCallback(async () => {
    setWardLoading(true);
    try {
      const [projResult, needsResult, reqResult, ratingsResult, councillorList] = await Promise.all([
        loadHybridCollection('projects', () => firestoreService.getProjects()),
        loadHybridCollection('communityNeeds', () => firestoreService.getCommunityNeeds()),
        loadHybridCollection('requests', () => firestoreService.getRequests()),
        loadHybridCollection('ratings', () => firestoreService.getRatings()),
        firestoreService.getCouncillors().catch(() => []),
      ]);

      setAllProjects(projResult.data);
      setAllNeeds(needsResult.data);
      setAllRequests(reqResult.data);
      setAllRatings(ratingsResult.data);
      setCouncillors(councillorList);

      // Repair any partially completed funding approvals (project + notifications)
      try {
        const fundingRequests = await firestoreService.getFundingRequests();
        const incomplete = fundingRequests.filter(
          (r) => r.status === 'approved' && (!r.repairCompleted || !r.notificationsSent),
        );
        await Promise.all(
          incomplete.map((r) => completeApprovedFunding(r).catch((err) => {
            console.warn('Funding completion repair failed:', err);
          })),
        );
        if (incomplete.length > 0) {
          const projRetry = await loadHybridCollection('projects', () => firestoreService.getProjects());
          setAllProjects(projRetry.data);
        }
      } catch (err) {
        console.warn('Could not repair approved funding:', err);
      }

      const sources = new Set([
        projResult.dataSource,
        needsResult.dataSource,
        reqResult.dataSource,
        ratingsResult.dataSource,
      ]);
      if (sources.has('mixed') || sources.size > 1) {
        setWardDataSource('mixed');
      } else {
        setWardDataSource(projResult.dataSource);
      }
    } catch (err) {
      console.error('Failed to load ward data:', err);
    } finally {
      setWardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  useEffect(() => {
    loadWardData();
  }, [loadWardData]);

  useEffect(() => {
    if (wardIdParam && !selectedWard) {
      navigate('/dashboard/mayor/wards', { replace: true });
    }
  }, [wardIdParam, selectedWard, navigate]);

  function handleDownloadProposal(proposal) {
    const fileData = proposal.proposalFileData;
    const fileName = proposal.proposalFileName || 'proposal.pdf';

    if (fileData) {
      downloadBase64File(fileData, fileName);
      return;
    }

    if (proposal.proposalFileUrl) {
      window.open(proposal.proposalFileUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    window.alert('No proposal file attached.');
  }

  async function resolveCouncillorName(councillorId) {
    if (!councillorId) return '—';
    const councillorsList = await firestoreService.getCouncillors();
    const match = councillorsList.find((c) => (c.uid ?? c.id) === councillorId);
    return (
      match?.fullName
      ?? [match?.firstName, match?.lastName].filter(Boolean).join(' ')
      ?? match?.name
      ?? '—'
    );
  }

  function isProposalSubmittedToStakeholders(proposal) {
    return proposal?.status === 'submitted_to_stakeholders' || proposal?.status === 'funded';
  }

  async function handleSubmitToStakeholders(e) {
    e?.preventDefault?.();
    const proposal = viewProposal;
    if (!proposal || isProposalSubmittedToStakeholders(proposal)) return;

    const mayorId = user?.uid ?? user?.id;
    if (!mayorId) {
      setMayorMessage('You must be signed in as Mayor to submit to stakeholders.');
      return;
    }

    const amountRequested = Number(
      escalateForm.amountRequested || proposal.estimatedCost || proposal.amountRequested,
    );
    if (!amountRequested || amountRequested <= 0) {
      setMayorMessage('Enter a valid funding amount before submitting to stakeholders.');
      return;
    }

    setSubmitting(true);
    setMayorMessage('');
    try {
      const councillorName = await resolveCouncillorName(proposal.councillorId);
      const mayorNotes = escalateForm.mayorNotes.trim()
        || 'Approved by Mayor. Awaiting stakeholder funding.';
      const submittedAt = new Date().toISOString();
      const basePayload = {
        proposalId: proposal.id,
        communityNeedId: proposal.communityNeedId,
        projectTitle: proposal.projectTitle || proposal.category,
        category: proposal.category,
        zone: proposal.zone,
        ward: proposal.ward,
        wardId: proposal.wardId,
        residentCount: proposal.residentCount ?? 0,
        residentIds: proposal.residentIds ?? [],
        requestIds: proposal.requestIds ?? [],
        startDate: proposal.startDate ?? null,
        endDate: proposal.endDate ?? null,
        amountRequested,
        fundingGap: amountRequested,
        mayorNotes,
        mayorId,
        councillorId: proposal.councillorId,
        councillorName,
        proposalFileName: proposal.proposalFileName,
        status: 'pending',
      };

      try {
        await Promise.all(
          ALL_STAKEHOLDER_TYPES.map((stakeholderType) =>
            firestoreService.createFundingRequest({ ...basePayload, stakeholderType }),
          ),
        );
      } catch (err) {
        throw new Error(`Could not create funding requests: ${err.message}`);
      }

      try {
        await firestoreService.updateProjectProposal(proposal.id, {
          status: 'submitted_to_stakeholders',
          amountRequested,
          estimatedCost: amountRequested,
          submittedToStakeholdersAt: submittedAt,
          mayorId,
        });
      } catch (err) {
        throw new Error(`Could not update proposal status: ${err.message}`);
      }

      if (proposal.communityNeedId) {
        try {
          await firestoreService.updateCommunityNeed(proposal.communityNeedId, {
            status: 'submitted_to_stakeholders',
            mayorId,
          });
        } catch (err) {
          console.warn('Community need status update failed:', err);
        }
      }

      const stakeholders = await firestoreService.findAllStakeholders();
      const title = proposal.projectTitle || proposal.category;
      await Promise.all(
        stakeholders.map((s) =>
          firestoreService.createNotification({
            userId: s.uid ?? s.id,
            type: 'funding_request',
            title: 'New Funding Request',
            message: `${title} in ${formatWardForDisplay(proposal.ward)} requires funding of K${amountRequested.toLocaleString()}. Please review and approve.`,
            wardId: proposal.wardId,
            proposalId: proposal.id,
          }).catch(() => null),
        ),
      );

      setMayorMessage('Proposal submitted to all stakeholders for funding review.');
      setViewProposal(null);
      setEscalateForm({
        amountRequested: '',
        mayorNotes: 'Approved by Mayor. Awaiting stakeholder funding.',
      });
      await loadProposals();
      await loadWardData();
    } catch (err) {
      setMayorMessage(err.message || 'Failed to submit to stakeholders.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMayorLlgDecision(approved) {
    if (!reviewLlgProject) return;
    setLlgSaving(true);
    setMayorMessage('');
    try {
      await firestoreService.updateProject(reviewLlgProject.id, {
        status: approved ? 'Pending Provincial' : 'Rejected',
        mayorComment: llgComment.trim(),
        mayorReviewedAt: new Date().toISOString(),
        mayorReviewerId: user?.uid ?? user?.id,
      });

      if (reviewLlgProject.councillorId) {
        await firestoreService.createNotification({
          userId: reviewLlgProject.councillorId,
          type: approved ? 'project_approved' : 'project_rejected',
          title: approved ? 'Project Approved (Mayor)' : 'Project Rejected (Mayor)',
          message: `${reviewLlgProject.name} was ${approved ? 'approved by the Mayor and forwarded to Provincial review' : 'rejected by the Mayor'}.${llgComment.trim() ? ` Comment: ${llgComment.trim()}` : ''}`,
          wardId: reviewLlgProject.wardId,
          projectId: reviewLlgProject.id,
        }).catch(() => null);
      }

      setMayorMessage(`Project ${approved ? 'approved' : 'rejected'} successfully.`);
      setReviewLlgProject(null);
      setLlgComment('');
      await loadWardData();
    } catch (err) {
      setMayorMessage(err.message || 'Failed to update project.');
    } finally {
      setLlgSaving(false);
    }
  }

  const llgProjectsFromStore = (data?.projects ?? []).filter((p) =>
    WARDS.some((w) => filterByWard([p], w).length > 0),
  );

  const llgProjects = allProjects.length > 0
    ? WARDS.flatMap((w) => filterByWard(allProjects, w))
    : llgProjectsFromStore;

  const wardSummaries = useMemo(
    () =>
      WARDS.map((ward) =>
        buildWardSummary(
          ward,
          allProjects.length ? allProjects : llgProjectsFromStore,
          allNeeds,
          allRequests,
          allRatings,
          findCouncillorForWard(councillors, ward),
        ),
      ),
    [allProjects, allNeeds, allRequests, allRatings, councillors, llgProjectsFromStore],
  );

  const selectedWardSummary = useMemo(
    () => (selectedWard ? wardSummaries.find((s) => s.ward.id === selectedWard.id) : null),
    [selectedWard, wardSummaries],
  );

  const pendingApprovals = llgProjects.filter((p) => p.status === 'Pending LLG');
  const completedProjects = llgProjects.filter((p) => p.status === 'Completed');
  const completionRate =
    llgProjects.length === 0
      ? 0
      : Math.round((completedProjects.length / llgProjects.length) * 100);

  const totalWards = WARDS.length;

  const recentPending = [...pendingApprovals]
    .sort((a, b) => new Date(b.dateLogged) - new Date(a.dateLogged))
    .slice(0, 5);

  const quickActions = [
    { label: 'Approve Projects', to: '/dashboard/mayor', icon: 'fa-check-double' },
    { label: 'Ward Monitoring', to: '/dashboard/mayor/wards', icon: 'fa-map-marked-alt' },
    { label: 'LLG Reports', to: '/reports', icon: 'fa-chart-bar' },
    { label: 'Acquittals', to: '/acquittals', icon: 'fa-file-invoice-dollar' },
    { label: 'View Projects', to: '/projects', icon: 'fa-folder-open' },
  ];

  function renderOverview() {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Wards" value={totalWards} icon="fa-map-marked-alt" />
          <StatCard label="Total Projects" value={llgProjects.length} icon="fa-folder-open" />
          <StatCard
            label="Pending Approvals"
            value={pendingApprovals.length}
            icon="fa-clock"
            accent="text-status-pending"
          />
          <StatCard
            label="Completion Rate"
            value={`${completionRate}%`}
            icon="fa-chart-line"
            accent="text-status-completed"
          />
        </div>

        <section>
          <h2 className="text-sm font-semibold text-cyber-muted uppercase tracking-wide mb-3">
            Quick Actions
          </h2>
          <QuickActions actions={quickActions} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="cyber-card">
            <h2 className="text-lg font-semibold text-cyber-text mb-4">Pending LLG Approvals</h2>
            {recentPending.length === 0 ? (
              <p className="text-cyber-muted text-sm">No projects awaiting LLG approval.</p>
            ) : (
              <div className="space-y-3">
                {recentPending.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-lg bg-slate-bg border border-slate-border flex flex-wrap justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-cyber-text">{project.name}</p>
                        <StatusBadge status={project.status} />
                      </div>
                      <p className="text-sm text-cyber-muted mt-1">
                        {formatWardForDisplay(project.ward)} · K {Number(project.budget ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-cyber-muted mt-1">{formatDate(project.dateLogged)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReviewLlgProject(project)}
                      className="cyber-btn-primary text-sm shrink-0"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="cyber-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-cyber-text">Ward Coverage</h2>
              <Link
                to="/dashboard/mayor/wards"
                className="text-xs text-cyber-accent hover:underline"
              >
                View all wards
              </Link>
            </div>
            <div className="space-y-2">
              {WARDS.map((ward) => {
                const summary = wardSummaries.find((s) => s.ward.id === ward.id);
                const count = summary?.projectCount ?? 0;
                const active = count > 0;
                return (
                  <div
                    key={ward.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-bg border border-slate-border"
                  >
                    <span className="text-sm text-cyber-text">{getWardDisplayName(ward)}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-cyber-muted">{count} projects</span>
                      <Link
                        to={`/dashboard/mayor/wards/${ward.id}`}
                        className="text-xs text-cyber-accent hover:underline"
                      >
                        View
                      </Link>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          active
                            ? 'border-status-completed/40 text-status-completed bg-status-completed/10'
                            : 'border-slate-border text-cyber-muted'
                        }`}
                      >
                        {active ? 'Active' : 'No projects'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="cyber-card">
          <h2 className="text-lg font-semibold text-cyber-text mb-4">
            Councillor Proposals Pending Review
          </h2>
          {loadingProposals ? (
            <p className="text-cyber-muted text-sm animate-pulse">Loading proposals…</p>
          ) : proposals.length === 0 ? (
            <p className="text-cyber-muted text-sm">No proposals submitted by councillors yet.</p>
          ) : (
            <div className="space-y-3">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="p-4 rounded-lg bg-slate-bg border border-slate-border"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-cyber-text">
                        {proposal.projectTitle || proposal.category}
                      </p>
                      <p className="text-sm text-cyber-muted mt-1">
                        {proposal.category} · {proposal.zone || 'All Ward'} · {formatWardForDisplay(proposal.ward)}
                      </p>
                      <p className="text-xs text-cyber-muted mt-1">
                        {proposal.residentCount ?? 0} residents ·{' '}
                        {proposal.submittedAt ? formatDate(proposal.submittedAt) : '—'}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewProposal(proposal)}
                        className="cyber-btn-secondary text-xs py-1.5 px-3"
                      >
                        Review
                      </button>
                      {(proposal.proposalFileData || proposal.proposalFileUrl) && (
                        <button
                          type="button"
                          onClick={() => handleDownloadProposal(proposal)}
                          className="cyber-btn-primary text-xs py-1.5 px-3"
                        >
                          <i className="fas fa-download mr-1" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  function renderWardsOverview() {
    return (
      <section className="cyber-card">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-cyber-text">Wards Overview</h2>
            <p className="text-sm text-cyber-muted mt-1">
              All {WARDS.length} wards in {LLG_NAME}
            </p>
          </div>
          <DataSourceIndicator source={wardDataSource} />
        </div>

        {wardLoading ? (
          <p className="text-cyber-muted text-sm animate-pulse">Loading ward data…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-cyber-muted border-b border-slate-border">
                  <th className="py-3 pr-4 font-medium">Ward</th>
                  <th className="py-3 pr-4 font-medium">Councillor</th>
                  <th className="py-3 pr-4 font-medium">Projects</th>
                  <th className="py-3 pr-4 font-medium">Community Needs</th>
                  <th className="py-3 pr-4 font-medium">Funding</th>
                  <th className="py-3 pr-4 font-medium">Rating</th>
                  <th className="py-3 font-medium">View</th>
                </tr>
              </thead>
              <tbody>
                {wardSummaries.map((summary) => (
                  <tr
                    key={summary.ward.id}
                    className="border-b border-slate-border/60 hover:bg-slate-bg/50"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium text-cyber-text">{getWardDisplayName(summary.ward)}</p>
                    </td>
                    <td className="py-3 pr-4 text-cyber-text">{summary.councillorName}</td>
                    <td className="py-3 pr-4">{summary.projectCount}</td>
                    <td className="py-3 pr-4">{summary.needCount}</td>
                    <td className="py-3 pr-4">K {summary.totalFunding.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <StarRating rating={summary.rating} />
                    </td>
                    <td className="py-3">
                      <Link
                        to={`/dashboard/mayor/wards/${summary.ward.id}`}
                        className="cyber-btn-secondary text-xs py-1.5 px-3 inline-block"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  function renderWardDetail() {
    if (!selectedWard) return null;

    if (!selectedWardSummary) {
      return (
        <p className="text-cyber-muted text-sm animate-pulse">
          {wardLoading ? 'Loading ward details…' : 'Ward data unavailable.'}
        </p>
      );
    }

    const { ward, councillorName, projects, needs, requests } = selectedWardSummary;
    const totalFunding = sumFunding(projects);
    const completion = computeCompletionRate(projects);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/mayor/wards')}
            className="cyber-btn-secondary text-sm py-2 px-3"
          >
            <i className="fas fa-arrow-left mr-2" />
            Back to Wards
          </button>
          <DataSourceIndicator source={wardDataSource} />
        </div>

        <header className="cyber-card">
          <p className="text-xs uppercase tracking-wide text-cyber-muted mb-1">Ward Detail</p>
          <h2 className="text-xl font-bold text-cyber-accent">
            {getWardDisplayName(ward).toUpperCase()}
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-cyber-muted">Councillor</p>
              <p className="font-medium text-cyber-text mt-1">{councillorName}</p>
            </div>
            <div>
              <p className="text-cyber-muted">Total Projects</p>
              <p className="font-medium text-cyber-text mt-1">{projects.length}</p>
            </div>
            <div>
              <p className="text-cyber-muted">Total Funding</p>
              <p className="font-medium text-cyber-text mt-1">K {totalFunding.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-cyber-muted">Rating · Completion</p>
              <p className="font-medium text-cyber-text mt-1">
                <StarRating rating={selectedWardSummary.rating} /> · {completion}%
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Requests" value={requests.length} icon="fa-inbox" />
          <StatCard label="Community Needs" value={needs.length} icon="fa-users" />
          <StatCard
            label="Completed Projects"
            value={projects.filter((p) => p.status === 'Completed').length}
            icon="fa-check-circle"
            accent="text-status-completed"
          />
        </div>

        <section className="cyber-card">
          <h3 className="text-lg font-semibold text-cyber-text mb-4">
            Projects in {getWardDisplayName(ward)}
          </h3>
          {wardLoading ? (
            <p className="text-cyber-muted text-sm animate-pulse">Loading projects…</p>
          ) : projects.length === 0 ? (
            <p className="text-cyber-muted text-sm">No projects logged for this ward yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-cyber-muted border-b border-slate-border">
                    <th className="py-3 pr-4 font-medium">Project</th>
                    <th className="py-3 pr-4 font-medium">Funding</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Logged</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-b border-slate-border/60">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-cyber-text">{project.name}</p>
                        <p className="text-xs text-cyber-muted">{project.category}</p>
                      </td>
                      <td className="py-3 pr-4">K {Number(project.budget ?? 0).toLocaleString()}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="py-3 text-cyber-muted">{formatDate(project.dateLogged)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="cyber-card">
          <h3 className="text-lg font-semibold text-cyber-text mb-4">Community Needs</h3>
          {needs.length === 0 ? (
            <p className="text-cyber-muted text-sm">No community needs recorded for this ward.</p>
          ) : (
            <div className="space-y-3">
              {needs.map((need) => {
                const linkedProposal = allProposals.find((p) => p.communityNeedId === need.id);
                const submitted = isProposalSubmittedToStakeholders(linkedProposal);
                const canSubmit = linkedProposal?.status === 'submitted_to_mayor';

                return (
                <div
                  key={need.id}
                  className="p-4 rounded-lg bg-slate-bg border border-slate-border flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-cyber-text">
                      {need.category || need.projectType}
                    </p>
                    <p className="text-sm text-cyber-muted mt-1">
                      {need.zone || 'All Ward'} · {need.residentCount ?? 0} residents
                    </p>
                  </div>
                  {submitted ? (
                    <span className="text-xs px-2 py-1 rounded-full border border-status-completed/40 text-status-completed bg-status-completed/10">
                      Submitted to Stakeholders
                    </span>
                  ) : canSubmit ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEscalateForm((prev) => ({
                          ...prev,
                          amountRequested: String(linkedProposal.amountRequested ?? linkedProposal.estimatedCost ?? ''),
                        }));
                        setViewProposal(linkedProposal);
                      }}
                      className="cyber-btn-primary text-xs py-1.5 px-3"
                    >
                      Submit to Stakeholders
                    </button>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full border border-slate-border text-cyber-muted">
                      {needStatusLabel(need.status)}
                    </span>
                  )}
                </div>
              );
              })}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-cyber-accent">
          {isWardDetail
            ? `Ward ${selectedWard?.number}`
            : isWardsOverview
              ? 'Wards'
              : 'LLG Admin Dashboard'}
        </h1>
        <p className="text-cyber-muted text-sm mt-1">
          {LLG_NAME} · {user?.name ?? user?.fullName} ·{' '}
          {isWardDetail
            ? 'Ward progress and performance'
            : isWardsOverview
              ? 'Monitor all wards across the LLG'
              : 'Monitor ward projects and approvals across the LLG'}
        </p>
      </header>

      {isOverview && renderOverview()}
      {isWardsOverview && renderWardsOverview()}
      {isWardDetail && renderWardDetail()}

      {mayorMessage && (
        <div className="p-3 rounded-lg bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent text-sm">
          {mayorMessage}
        </div>
      )}

      <Modal
        open={!!viewProposal}
        onClose={() => setViewProposal(null)}
        title={viewProposal?.projectTitle || 'Proposal Review'}
        wide
      >
        {viewProposal && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <StatusBadge
                status={
                  isProposalSubmittedToStakeholders(viewProposal)
                    ? 'Submitted to Stakeholders'
                    : 'Submitted to Mayor'
                }
              />
              <span className="text-sm text-cyber-muted">
                {viewProposal.category} · {viewProposal.zone} · {formatWardForDisplay(viewProposal.ward)}
              </span>
            </div>
            <p className="text-sm text-cyber-muted">
              {viewProposal.residentCount ?? 0} residents requested this community project.
            </p>
            {(viewProposal.startDate || viewProposal.endDate) && (
              <p className="text-sm text-cyber-muted">
                Project timeline:{' '}
                {viewProposal.startDate
                  ? new Date(viewProposal.startDate).toLocaleDateString('en-PG')
                  : '—'}{' '}
                →{' '}
                {viewProposal.endDate
                  ? new Date(viewProposal.endDate).toLocaleDateString('en-PG')
                  : '—'}
                {viewProposal.estimatedCost
                  ? ` · Est. K${Number(viewProposal.estimatedCost).toLocaleString()}`
                  : ''}
              </p>
            )}
            {viewProposal.proposalFileName && (
              <p className="text-sm">
                <span className="text-cyber-muted">Attached file:</span>{' '}
                {viewProposal.proposalFileName}
                {viewProposal.fileSize
                  ? ` (${(viewProposal.fileSize / 1024).toFixed(1)} KB)`
                  : ''}
              </p>
            )}
            {(viewProposal.proposalFileData || viewProposal.proposalFileUrl) && (
              <button
                type="button"
                onClick={() => handleDownloadProposal(viewProposal)}
                className="cyber-btn-primary text-sm"
              >
                <i className="fas fa-file-download mr-2" />
                Download Proposal
              </button>
            )}

            <form onSubmit={handleSubmitToStakeholders} className="pt-4 border-t border-slate-border space-y-3">
              <p className="text-sm font-semibold text-cyber-text">Submit to All Stakeholders</p>
              <p className="text-xs text-cyber-muted">
                Sends funding requests to PSIP, DSIP, DDA, NGO, and Open Member for review.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-cyber-muted mb-1">Amount Requested (K)</label>
                  <input
                    type="number"
                    min="1"
                    className="cyber-input w-full"
                    value={escalateForm.amountRequested}
                    onChange={(e) => setEscalateForm({ ...escalateForm, amountRequested: e.target.value })}
                    placeholder="30000"
                    required
                    disabled={isProposalSubmittedToStakeholders(viewProposal)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-cyber-muted mb-1">Mayor&apos;s Notes</label>
                <textarea
                  className="cyber-input w-full min-h-[72px]"
                  value={escalateForm.mayorNotes}
                  onChange={(e) => setEscalateForm({ ...escalateForm, mayorNotes: e.target.value })}
                  placeholder="Approved by Mayor. Awaiting stakeholder funding."
                  disabled={isProposalSubmittedToStakeholders(viewProposal)}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || isProposalSubmittedToStakeholders(viewProposal)}
                className="cyber-btn-primary text-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProposalSubmittedToStakeholders(viewProposal)
                  ? 'Submitted to Stakeholders'
                  : submitting
                    ? 'Submitting…'
                    : 'Submit to Stakeholders'}
              </button>
            </form>
          </div>
        )}
      </Modal>

      <Modal open={!!reviewLlgProject} onClose={() => setReviewLlgProject(null)} title="Mayor LLG Approval" wide>
        {reviewLlgProject && (
          <div className="space-y-4">
            <p className="font-medium text-lg">{reviewLlgProject.name}</p>
            <p className="text-sm text-cyber-muted">
              {formatWardForDisplay(reviewLlgProject.ward)} · K {Number(reviewLlgProject.budget ?? 0).toLocaleString()}
            </p>
            <textarea
              className="cyber-input min-h-[80px]"
              placeholder="Approval comments (optional)"
              value={llgComment}
              onChange={(e) => setLlgComment(e.target.value)}
            />
            <div className="flex gap-3">
              <button type="button" disabled={llgSaving} onClick={() => handleMayorLlgDecision(true)} className="cyber-btn-success flex-1">
                Approve → Provincial
              </button>
              <button type="button" disabled={llgSaving} onClick={() => handleMayorLlgDecision(false)} className="cyber-btn-danger flex-1">
                Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
