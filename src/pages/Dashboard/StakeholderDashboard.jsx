import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfilePage from '../Profile/ProfilePage';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
import { ROLES, ROLE_DASHBOARD_PATHS } from '../../constants';
import { getStakeholderType, getStakeholderLabel } from '../../constants/funding';
import { RATING_CATEGORIES } from '../../constants/ratings';
import { formatWardForDisplay } from '../../constants/wards';
import Rating from '../../components/common/Rating';
import { normalizeRole } from '../../constants/roleMapping';
import { firestoreService } from '../../services/firestoreService';
import { downloadBase64File } from '../../utils/fileHelpers';
import { completeApprovedFunding } from '../../utils/fundingRepair';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'fa-th-large' },
  { id: 'funding-requests', label: 'Funding Requests', icon: 'fa-hand-holding-usd' },
  { id: 'approved', label: 'Approved Projects', icon: 'fa-check-circle' },
  { id: 'profile', label: 'Profile', icon: 'fa-user' },
];

const EMPTY_APPROVE_FORM = {
  amountApproved: '',
  referenceNumber: '',
  notes: '',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount) {
  return `K ${Number(amount ?? 0).toLocaleString()}`;
}

export default function StakeholderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tab: tabParam } = useParams();

  const displayRole = user?.rawRole ?? user?.role ?? 'open-member';
  const role = normalizeRole(user?.role ?? displayRole);
  const roleLabel = ROLES[displayRole] ?? ROLES[role] ?? role;
  const stakeholderType = getStakeholderType(user);
  const basePath = ROLE_DASHBOARD_PATHS[displayRole] ?? ROLE_DASHBOARD_PATHS[role] ?? '/dashboard/open-member';

  const VALID_TABS = new Set(TABS.map((t) => t.id));
  const activeTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : 'overview';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [requests, setRequests] = useState([]);
  const [reviewRequest, setReviewRequest] = useState(null);
  const [linkedProposal, setLinkedProposal] = useState(null);
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveForm, setApproveForm] = useState(EMPTY_APPROVE_FORM);
  const [saving, setSaving] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const backfillAttempted = useRef(new Set());

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await firestoreService.getFundingRequests(stakeholderType);
      setRequests(
        data.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)),
      );
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load funding requests.');
    } finally {
      setLoading(false);
    }
  }, [stakeholderType]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const loadRatings = useCallback(async () => {
    setRatingsLoading(true);
    try {
      const data = await firestoreService.getRatingsForStakeholder(stakeholderType);
      setRatings(
        data.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setRatingsLoading(false);
    }
  }, [stakeholderType]);

  useEffect(() => {
    if (activeTab === 'approved') {
      loadRatings();
    }
  }, [activeTab, loadRatings]);

  async function deliverFundingNotifications(request) {
    const amount = Number(request.amountApproved ?? 0);
    if (!amount) return { sent: 0, failed: 0, total: 0 };

    const result = await completeApprovedFunding(request);
    return { sent: result.sent, failed: 0, total: result.sent };
  }

  async function handleResendNotifications(request) {
    setResendingId(request.id);
    setError('');
    try {
      const { sent } = await deliverFundingNotifications(request);
      setSuccessMessage(`Notifications sent to ${sent} recipient(s).`);
    } catch (err) {
      setError(err.message || 'Failed to send notifications.');
    } finally {
      setResendingId(null);
    }
  }

  useEffect(() => {
    if (tabParam && !VALID_TABS.has(tabParam)) {
      navigate(basePath, { replace: true });
    }
  }, [tabParam, basePath, navigate, VALID_TABS]);

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === 'pending'),
    [requests],
  );
  const approvedRequests = useMemo(
    () => requests.filter((r) => r.status === 'approved'),
    [requests],
  );
  const totalFunding = useMemo(
    () => approvedRequests.reduce((sum, r) => sum + Number(r.amountApproved ?? 0), 0),
    [approvedRequests],
  );

  // Backfill project record + notifications for approvals saved before full workflow ran
  useEffect(() => {
    approvedRequests.forEach((request) => {
      if (request.repairCompleted && request.notificationsSent) return;
      if (backfillAttempted.current.has(request.id)) return;
      backfillAttempted.current.add(request.id);
      deliverFundingNotifications(request)
        .then(({ sent }) => {
          if (sent > 0) {
            setSuccessMessage(`Project repaired and notifications sent to ${sent} recipient(s).`);
          }
        })
        .catch((err) => console.warn('Funding repair/backfill failed:', err));
    });
  }, [approvedRequests, stakeholderType]);

  async function openReview(request) {
    setReviewRequest(request);
    setLinkedProposal(null);
    if (request.proposalId) {
      try {
        const proposal = await firestoreService.getProjectProposal(request.proposalId);
        setLinkedProposal(proposal);
      } catch {
        /* proposal optional */
      }
    }
  }

  function closeReview() {
    setReviewRequest(null);
    setLinkedProposal(null);
    setApproveModal(false);
    setRejectModal(false);
    setApproveForm(EMPTY_APPROVE_FORM);
    setRejectReason('');
  }

  function handleDownloadProposal() {
    const fileData = linkedProposal?.proposalFileData ?? reviewRequest?.proposalFileData;
    const fileName = linkedProposal?.proposalFileName ?? reviewRequest?.proposalFileName ?? 'proposal.pdf';

    if (fileData) {
      downloadBase64File(fileData, fileName);
      return;
    }
    if (linkedProposal?.proposalFileUrl) {
      window.open(linkedProposal.proposalFileUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    window.alert('No proposal file attached.');
  }

  async function notifyFundingRejected(request, reason) {
    const title = request.projectTitle || request.category;
    const notifyIds = new Set();
    if (request.mayorId) notifyIds.add(request.mayorId);
    if (request.councillorId) notifyIds.add(request.councillorId);
    const mayor = await firestoreService.findMayor();
    if (mayor?.uid) notifyIds.add(mayor.uid);

    await Promise.all(
      Array.from(notifyIds).map((userId) =>
        firestoreService.createNotification({
          userId,
          type: 'funding_rejected',
          title: 'Funding Rejected',
          message: `${getStakeholderLabel(stakeholderType)} rejected funding for ${title}: ${reason}`,
          wardId: request.wardId,
          proposalId: request.proposalId,
        }).catch(() => null),
      ),
    );
  }

  async function handleApproveFunding(e) {
    e.preventDefault();
    if (!reviewRequest) return;

    const amountApproved = Number(approveForm.amountApproved);
    if (!amountApproved || amountApproved <= 0) {
      setError('Enter a valid funding amount.');
      return;
    }

    const stakeholderId = user?.uid ?? user?.id;
    if (!stakeholderId) {
      setError('You must be signed in to approve funding.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const fundingDate = new Date().toISOString();
      const referenceNumber = approveForm.referenceNumber.trim();
      const notes = approveForm.notes.trim();

      const allRequests = await firestoreService.getFundingRequests();
      const siblingCloses = allRequests
        .filter(
          (r) =>
            r.proposalId === reviewRequest.proposalId
            && r.id !== reviewRequest.id
            && r.status === 'pending',
        )
        .map((r) => ({
          id: r.id,
          data: {
            status: 'closed',
            closedReason: `Funded by ${stakeholderType.toUpperCase()}`,
            stakeholderId,
          },
        }));

      await firestoreService.commitFundingApproval({
        fundingRequestId: reviewRequest.id,
        fundingRequestUpdate: {
          status: 'approved',
          stakeholderId,
          stakeholderType,
          amountApproved,
          fundingDate,
          referenceNumber,
          notes,
        },
        proposalId: reviewRequest.proposalId,
        proposalUpdate: reviewRequest.proposalId
          ? {
              status: 'funded',
              fundedBy: stakeholderType,
              fundedAmount: amountApproved,
              fundedAt: fundingDate,
              fundingSource: stakeholderType.toUpperCase(),
              budget: amountApproved,
              stakeholderId,
            }
          : null,
        communityNeedId: reviewRequest.communityNeedId,
        projectData: {
          name: reviewRequest.projectTitle || reviewRequest.category,
          category: reviewRequest.category,
          description: reviewRequest.description || `${reviewRequest.category} — stakeholder funded`,
          ward: reviewRequest.ward,
          wardId: reviewRequest.wardId,
          zone: reviewRequest.zone,
          budget: amountApproved,
          fundingSource: stakeholderType.toUpperCase(),
          status: 'Funded',
          dateLogged: fundingDate,
          fundingRequestId: reviewRequest.id,
          proposalId: reviewRequest.proposalId,
        },
        siblingCloses,
      });

      await deliverFundingNotifications({
        ...reviewRequest,
        amountApproved,
        stakeholderType,
      });

      setSuccessMessage('Funding approved and project updated.');
      closeReview();
      await loadRequests();
    } catch (err) {
      setError(err.message || 'Failed to approve funding.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRejectFunding() {
    if (!reviewRequest || !rejectReason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await firestoreService.updateFundingRequest(reviewRequest.id, {
        status: 'rejected',
        stakeholderId: user?.uid ?? user?.id,
        rejectionReason: rejectReason.trim(),
      });

      if (reviewRequest.proposalId) {
        await firestoreService.updateProjectProposal(reviewRequest.proposalId, {
          status: 'funding_rejected',
          stakeholderId: user?.uid ?? user?.id,
        });
      }

      await notifyFundingRejected(reviewRequest, rejectReason.trim());

      setSuccessMessage('Funding request rejected.');
      closeReview();
      await loadRequests();
    } catch (err) {
      setError(err.message || 'Failed to reject funding.');
    } finally {
      setSaving(false);
    }
  }

  function renderTabNav() {
    return (
      <nav className="flex flex-wrap gap-2 border-b border-slate-border pb-3">
        {TABS.map((tab) => {
          const path = tab.id === 'overview' ? basePath : `${basePath}/${tab.id}`;
          const active = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/40'
                  : 'text-cyber-muted hover:text-cyber-text hover:bg-slate-bg'
              }`}
            >
              <i className={`fas ${tab.icon} mr-2`} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  function renderOverview() {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Pending Requests" value={pendingRequests.length} icon="fa-clock" accent="text-status-pending" />
          <StatCard label="Approved / Funded" value={approvedRequests.length} icon="fa-check-circle" accent="text-status-completed" />
          <StatCard label="Total Funding" value={formatCurrency(totalFunding)} icon="fa-coins" accent="text-cyber-accent" />
        </div>

        <section className="cyber-card mt-6">
          <h2 className="text-lg font-semibold text-cyber-text mb-4">Recent Pending Requests</h2>
          {loading ? (
            <p className="text-cyber-muted text-sm animate-pulse">Loading…</p>
          ) : pendingRequests.length === 0 ? (
            <p className="text-cyber-muted text-sm">No pending funding requests assigned to {getStakeholderLabel(stakeholderType)}.</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 5).map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-lg bg-slate-bg border border-slate-border flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-cyber-text">{req.projectTitle || req.category}</p>
                    <p className="text-sm text-cyber-muted mt-1">
                      {formatWardForDisplay(req.ward)} · {formatCurrency(req.amountRequested)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openReview(req)}
                    className="cyber-btn-primary text-xs py-1.5 px-3"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  function renderFundingRequests() {
    return (
      <section className="cyber-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-cyber-text">Funding Requests Pending</h2>
            <p className="text-sm text-cyber-muted mt-1">
              Assigned to {getStakeholderLabel(stakeholderType)}
            </p>
          </div>
          <DataSourceIndicator source="firestore" />
        </div>

        {loading ? (
          <p className="text-cyber-muted text-sm animate-pulse">Loading funding requests…</p>
        ) : pendingRequests.length === 0 ? (
          <p className="text-cyber-muted text-sm">No pending funding requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-cyber-muted border-b border-slate-border">
                  <th className="py-3 pr-4 font-medium">Project</th>
                  <th className="py-3 pr-4 font-medium">Ward</th>
                  <th className="py-3 pr-4 font-medium">Amount</th>
                  <th className="py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-border/60">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-cyber-text">{req.projectTitle || req.category}</p>
                      <p className="text-xs text-cyber-muted">{req.zone || 'All Ward'}</p>
                    </td>
                    <td className="py-3 pr-4">{formatWardForDisplay(req.ward)}</td>
                    <td className="py-3 pr-4">{formatCurrency(req.amountRequested)}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => openReview(req)}
                        className="cyber-btn-secondary text-xs py-1.5 px-3"
                      >
                        Review
                      </button>
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

  function renderApproved() {
    return (
      <div className="space-y-6">
        <section className="cyber-card">
          <h2 className="text-lg font-semibold text-cyber-text mb-4">Approved Projects</h2>
          {approvedRequests.length === 0 ? (
            <p className="text-cyber-muted text-sm">No approved funding yet.</p>
          ) : (
            <div className="space-y-3">
              {approvedRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-lg bg-slate-bg border border-slate-border"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-cyber-text">{req.projectTitle || req.category}</p>
                      <p className="text-sm text-cyber-muted mt-1">
                        {formatWardForDisplay(req.ward)} · {formatCurrency(req.amountApproved)}
                      </p>
                      <p className="text-xs text-cyber-muted mt-1">
                        Ref: {req.referenceNumber || '—'} · {formatDate(req.fundingDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status="Funded" />
                      <button
                        type="button"
                        onClick={() => handleResendNotifications(req)}
                        disabled={resendingId === req.id}
                        className="text-xs text-cyber-accent hover:underline disabled:opacity-50"
                      >
                        {resendingId === req.id ? 'Sending…' : 'Resend notifications'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="cyber-card">
          <h2 className="text-lg font-semibold text-cyber-text mb-1">Resident Ratings & Evidence</h2>
          <p className="text-sm text-cyber-muted mb-4">
            Residents rate funded projects in their ward and upload photo evidence. WDC handles acquittal
            and formal project reports.
          </p>
          {ratingsLoading ? (
            <p className="text-cyber-muted text-sm animate-pulse">Loading ratings…</p>
          ) : ratings.length === 0 ? (
            <p className="text-cyber-muted text-sm">No resident ratings submitted yet for your funded projects.</p>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <article
                  key={rating.id}
                  className="p-4 rounded-lg bg-slate-bg border border-slate-border"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-cyber-text">{rating.projectName || 'Project'}</p>
                      <p className="text-sm text-cyber-muted mt-1">
                        {formatWardForDisplay(rating.ward)} · {rating.residentName || 'Resident'}
                        {rating.isAnonymous ? ' (anonymous)' : ''}
                      </p>
                      <p className="text-xs text-cyber-muted mt-1">
                        Overall {rating.overallScore ?? rating.score ?? rating.rating ?? '—'}/5 ·{' '}
                        {formatDate(rating.createdAt)}
                      </p>
                    </div>
                    <Rating value={Math.round(Number(rating.overallScore ?? rating.score ?? 0))} readonly size="lg" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs">
                    {RATING_CATEGORIES.map((category) => (
                      <div key={category.key} className="flex justify-between gap-3 text-cyber-muted">
                        <span>{category.label}</span>
                        <span className="text-cyber-text">{rating[category.key] ?? '—'}/5</span>
                      </div>
                    ))}
                  </div>

                  {rating.comment && (
                    <p className="text-sm text-cyber-muted mt-3 italic">&ldquo;{rating.comment}&rdquo;</p>
                  )}

                  {rating.evidencePhotoData && (
                    <div className="mt-4">
                      <p className="text-xs text-cyber-muted mb-2">
                        Photo evidence{rating.evidencePhotoName ? `: ${rating.evidencePhotoName}` : ''}
                      </p>
                      <img
                        src={rating.evidencePhotoData}
                        alt={`Evidence for ${rating.projectName || 'project'}`}
                        className="max-h-56 rounded-lg border border-slate-border object-cover"
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-cyber-accent">{roleLabel} Dashboard</h1>
        <p className="text-cyber-muted text-sm mt-1">
          {user?.name ?? user?.fullName} · {getStakeholderLabel(stakeholderType)} · Madang Province
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

      {renderTabNav()}

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'funding-requests' && renderFundingRequests()}
      {activeTab === 'approved' && renderApproved()}
      {activeTab === 'profile' && <ProfilePage />}

      <Modal
        open={!!reviewRequest && !approveModal && !rejectModal}
        onClose={closeReview}
        title="Review Funding Request"
        wide
      >
        {reviewRequest && (
          <div className="space-y-4">
            <div>
              <p className="font-medium text-cyber-text text-lg">
                {reviewRequest.projectTitle || reviewRequest.category}
              </p>
              <p className="text-sm text-cyber-muted mt-1">
                {formatWardForDisplay(reviewRequest.ward)} · {reviewRequest.zone || 'All Ward'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-cyber-muted">Councillor</p>
                <p className="font-medium">{reviewRequest.councillorName || '—'}</p>
              </div>
              <div>
                <p className="text-cyber-muted">Residents</p>
                <p className="font-medium">{reviewRequest.residentCount ?? 0}</p>
              </div>
              <div>
                <p className="text-cyber-muted">Amount Requested</p>
                <p className="font-medium">{formatCurrency(reviewRequest.amountRequested)}</p>
              </div>
              <div>
                <p className="text-cyber-muted">Stakeholder</p>
                <p className="font-medium">{getStakeholderLabel(reviewRequest.stakeholderType)}</p>
              </div>
            </div>

            {reviewRequest.mayorNotes && (
              <div className="p-3 rounded-lg bg-slate-bg border border-slate-border text-sm">
                <p className="text-cyber-muted text-xs uppercase mb-1">Mayor&apos;s Notes</p>
                <p>{reviewRequest.mayorNotes}</p>
              </div>
            )}

            {(linkedProposal?.proposalFileData || reviewRequest.proposalFileName) && (
              <button
                type="button"
                onClick={handleDownloadProposal}
                className="cyber-btn-primary text-sm"
              >
                <i className="fas fa-file-download mr-2" />
                Download Proposal
              </button>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setApproveForm({
                    ...EMPTY_APPROVE_FORM,
                    amountApproved: String(reviewRequest.amountRequested ?? ''),
                  });
                  setApproveModal(true);
                }}
                className="cyber-btn-primary flex-1 min-w-[140px]"
              >
                Approve Funding
              </button>
              <button
                type="button"
                onClick={() => setRejectModal(true)}
                className="cyber-btn-secondary flex-1 min-w-[140px] text-status-rejected border-status-rejected/40"
              >
                Reject Funding
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={approveModal} onClose={() => setApproveModal(false)} title="Approve Funding">
        <form onSubmit={handleApproveFunding} className="space-y-4">
          <div>
            <label className="block text-sm text-cyber-muted mb-1">Amount Approved (K)</label>
            <input
              type="number"
              min="1"
              className="cyber-input w-full"
              value={approveForm.amountApproved}
              onChange={(e) => setApproveForm({ ...approveForm, amountApproved: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-cyber-muted mb-1">Reference Number</label>
            <input
              type="text"
              className="cyber-input w-full"
              placeholder={`${stakeholderType.toUpperCase()}-2026-001`}
              value={approveForm.referenceNumber}
              onChange={(e) => setApproveForm({ ...approveForm, referenceNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-cyber-muted mb-1">Notes</label>
            <textarea
              className="cyber-input w-full min-h-[80px]"
              value={approveForm.notes}
              onChange={(e) => setApproveForm({ ...approveForm, notes: e.target.value })}
              placeholder="Funding approved for community project"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setApproveModal(false)} className="cyber-btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="cyber-btn-primary flex-1">
              {saving ? 'Saving…' : 'Confirm Approval'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Reject Funding">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-cyber-muted mb-1">Rejection Reason</label>
            <textarea
              className="cyber-input w-full min-h-[100px]"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why funding cannot be approved"
              required
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setRejectModal(false)} className="cyber-btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRejectFunding}
              disabled={saving}
              className="cyber-btn-primary flex-1 bg-status-rejected/80"
            >
              {saving ? 'Saving…' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
