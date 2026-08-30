import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfilePage from '../Profile/ProfilePage';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
import Modal from '../../components/ui/Modal';
import ProposalFormModal from '../../components/Councillor/ProposalFormModal';
import SignaturePad from '../../components/forms/SignaturePad';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';
import {
  getWardNumber,
  resolveWardId,
  matchesWard,
  normalizeRequestStatus,
  LETTER_TYPES,
} from '../../utils/wdcHelpers';
import { computeScorecard } from '../../utils/scorecardHelpers';
import { notifyResidentsOfAnnouncement } from '../../utils/announcementNotifications';
import { buildLetterContent } from '../../utils/letterTemplates';
import { getUserData } from '../../services/authService';

const SCORECARD_CATEGORIES = [
  { key: 'engagement', label: 'Community Engagement', icon: 'fa-users' },
  { key: 'delivery', label: 'Project Delivery', icon: 'fa-tasks' },
  { key: 'response', label: 'Request Response', icon: 'fa-reply' },
  { key: 'proposals', label: 'Proposals Submitted', icon: 'fa-file-signature' },
  { key: 'transparency', label: 'Transparency', icon: 'fa-file-alt' },
];

const EMPTY_ANNOUNCEMENT = {
  title: '',
  content: '',
  priority: 'medium',
  targetAudience: 'ward_only',
};

const EMPTY_LETTER = {
  content: '',
  attachments: '',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StarRating({ rating, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <i
          key={i}
          className={`fas fa-star text-sm ${i < rating ? 'text-cyber-accent' : 'text-slate-border'}`}
        />
      ))}
    </div>
  );
}

async function loadWardCollection(collectionName, user, fetchAllFn) {
  const result = await loadHybridCollection(collectionName, fetchAllFn);
  return {
    ...result,
    data: result.data.filter((item) => matchesWard(item, user)),
  };
}

export default function CouncillorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tab: tabParam } = useParams();
  const [searchParams] = useSearchParams();

  const wardNumber = getWardNumber(user);
  const wardId = resolveWardId(user);
  const ward = user?.ward ?? `Ward ${wardNumber}`;

  const VALID_TABS = new Set(['overview', 'projects', 'requests', 'announcements', 'letters', 'profile']);
  const queryTab = searchParams.get('tab');
  const activeTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : queryTab && VALID_TABS.has(queryTab) ? queryTab : 'overview';

  useEffect(() => {
    if (queryTab && VALID_TABS.has(queryTab) && !tabParam) {
      const path = queryTab === 'overview' ? '/dashboard/councillor' : `/dashboard/councillor/${queryTab}`;
      navigate(path, { replace: true });
    }
  }, [queryTab, tabParam, navigate]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [dataSource, setDataSource] = useState('firestore');
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [communityNeeds, setCommunityNeeds] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [letters, setLetters] = useState([]);

  const [reviewNeed, setReviewNeed] = useState(null);
  const [relatedRequests, setRelatedRequests] = useState([]);
  const [returnModal, setReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [proposalModal, setProposalModal] = useState(false);
  const [announcementModal, setAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState(EMPTY_ANNOUNCEMENT);
  const [letterModal, setLetterModal] = useState(false);
  const [letterRequest, setLetterRequest] = useState(null);
  const [letterForm, setLetterForm] = useState(EMPTY_LETTER);
  const [letterSignatureDataUrl, setLetterSignatureDataUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  const forwardedNeeds = useMemo(
    () =>
      communityNeeds.filter(
        (n) => normalizeRequestStatus(n.status) === 'forwarded_to_councillor',
      ),
    [communityNeeds],
  );

  const letterRequests = useMemo(
    () =>
      requests.filter(
        (r) =>
          String(r.requestType ?? '').toLowerCase() === 'letter' &&
          normalizeRequestStatus(r.status) === 'pending',
      ),
    [requests],
  );

  const scorecard = useMemo(
    () => computeScorecard(projects, communityNeeds, proposals, announcements),
    [projects, communityNeeds, proposals, announcements],
  );

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projResult, reqResult, needsResult, propResult, annResult, letterResult] =
        await Promise.all([
          loadWardCollection('projects', user, () => firestoreService.getProjects()),
          loadWardCollection('requests', user, () => firestoreService.getRequests()),
          loadWardCollection('communityNeeds', user, () => firestoreService.getCommunityNeeds()),
          loadWardCollection('projectProposals', user, () => firestoreService.getProjectProposals()),
          loadWardCollection('announcements', user, () => firestoreService.getAnnouncements()),
          loadWardCollection('letters', user, () => firestoreService.getLetters()),
        ]);

      setProjects(projResult.data);
      setRequests(reqResult.data);
      setCommunityNeeds(needsResult.data);
      setProposals(propResult.data);
      setAnnouncements(annResult.data);
      setLetters(letterResult.data);

      const sources = new Set([
        projResult.dataSource,
        reqResult.dataSource,
        needsResult.dataSource,
        propResult.dataSource,
        annResult.dataSource,
        letterResult.dataSource,
      ]);
      if (sources.has('mixed') || sources.size > 1) setDataSource('mixed');
      else if (sources.has('localstorage')) setDataSource('localstorage');
      else setDataSource('firestore');
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  async function openReview(need) {
    setReviewNeed(need);
    const related = requests.filter((r) => (need.requestIds ?? []).includes(r.id));
    setRelatedRequests(related);
  }

  function startProposal() {
    if (!reviewNeed) return;
    setProposalModal(true);
  }

  async function handleReturnToWdc() {
    if (!reviewNeed || !returnReason.trim()) return;
    setSaving(true);
    setError('');
    try {
      await firestoreService.updateCommunityNeed(reviewNeed.id, {
        status: 'returned_to_wdc',
        returnReason: returnReason.trim(),
        returnedAt: new Date().toISOString(),
        returnedBy: user?.uid ?? user?.id,
      });

      if (reviewNeed.forwardedBy) {
        await firestoreService.createNotification({
          userId: reviewNeed.forwardedBy,
          type: 'community_need_returned',
          title: 'Community Need returned by Councillor',
          message: `${reviewNeed.category} (${reviewNeed.zone}) was returned: ${returnReason.trim()}`,
          wardId,
        });
      }

      setSuccessMessage('Community need returned to WDC.');
      setReturnModal(false);
      setReturnReason('');
      setReviewNeed(null);
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to return community need.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitProposal(proposalData) {
    if (!reviewNeed) return;
    setSaving(true);
    setError('');
    try {
      const mayor = await firestoreService.findMayor();
      const mayorId = mayor?.uid ?? mayor?.id ?? null;

      await firestoreService.createProjectProposal({
        ...proposalData,
        councillorId: user?.uid ?? user?.id,
      });

      await firestoreService.updateCommunityNeed(reviewNeed.id, {
        status: 'proposal_submitted_to_mayor',
        councillorId: user?.uid ?? user?.id,
        proposalSubmittedAt: new Date().toISOString(),
        proposalFileName: proposalData.proposalFileName,
        hasProposalAttachment: Boolean(proposalData.proposalFileData || proposalData.proposalFileUrl),
      });

      if (mayorId) {
        await firestoreService.createNotification({
          userId: mayorId,
          type: 'proposal_submitted',
          title: 'New Project Proposal Submitted',
          message: `${proposalData.category} proposal (${proposalData.proposalFileName}) submitted for review.`,
          wardId,
          communityNeedId: reviewNeed.id,
          proposalId: proposalData.communityNeedId,
        });
      }

      setSuccessMessage('Proposal document submitted to Mayor.');
      setProposalModal(false);
      setReviewNeed(null);
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to submit proposal.');
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAnnouncement(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const announcementId = `ann_${Date.now()}`;
      const announcement = {
        id: announcementId,
        title: announcementForm.title,
        content: announcementForm.content,
        priority: announcementForm.priority,
        targetAudience: announcementForm.targetAudience,
        type: announcementForm.targetAudience === 'ward_only' ? 'ward_only' : 'public',
        ward,
        wardId,
        createdBy: user?.name,
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      await firestoreService.createAnnouncement(announcement);
      await notifyResidentsOfAnnouncement(announcement, { wardId, ward, type: 'announcement' });
      setSuccessMessage('Announcement posted and residents notified.');
      setAnnouncementModal(false);
      setAnnouncementForm(EMPTY_ANNOUNCEMENT);
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to create announcement.');
    } finally {
      setSaving(false);
    }
  }

  async function openLetterForm(req) {
    const councillorName = user?.name ?? user?.fullName ?? 'Ward Councillor';
    let residentNid = req.residentNid ?? '';

    if (!residentNid && req.residentId) {
      try {
        const profile = await getUserData(req.residentId);
        residentNid = profile?.nid ?? profile?.pid ?? '';
      } catch {
        // Letter can still be drafted without NID
      }
    }

    setLetterRequest({ ...req, residentNid });
    setLetterForm({
      content: buildLetterContent({
        letterType: req.letterType || 'reference',
        category: req.category,
        residentName: req.residentName,
        ward,
        wardNumber,
        councillorName,
        purpose: req.description,
        zone: req.zone ?? req.area,
      }),
      attachments: '',
    });
    setLetterSignatureDataUrl(null);
    setLetterModal(true);
  }

  function resetLetterTemplate() {
    if (!letterRequest) return;
    const councillorName = user?.name ?? user?.fullName ?? 'Ward Councillor';
    setLetterForm((prev) => ({
      ...prev,
      content: buildLetterContent({
        letterType: letterRequest.letterType || 'reference',
        category: letterRequest.category,
        residentName: letterRequest.residentName,
        ward,
        wardNumber,
        councillorName,
        purpose: letterRequest.description,
        zone: letterRequest.zone ?? letterRequest.area,
      }),
    }));
    setLetterSignatureDataUrl(null);
  }

  function closeLetterModal() {
    setLetterModal(false);
    setLetterRequest(null);
    setLetterForm(EMPTY_LETTER);
    setLetterSignatureDataUrl(null);
  }

  async function handleCreateLetter(e) {
    e.preventDefault();
    if (!letterRequest) return;
    if (!letterSignatureDataUrl) {
      setError('Please sign the letter before sending it to the resident.');
      return;
    }

    setSaving(true);
    setError('');
    const signedAt = new Date().toISOString();
    const councillorName = user?.name ?? user?.fullName ?? 'Ward Councillor';

    try {
      await firestoreService.createLetter({
        residentId: letterRequest.residentId,
        residentName: letterRequest.residentName,
        requestId: letterRequest.id,
        letterType: letterRequest.letterType || 'reference',
        category: letterRequest.category,
        content: letterForm.content,
        attachments: letterForm.attachments ? [letterForm.attachments] : [],
        status: 'completed',
        councillorId: user?.uid ?? user?.id,
        councillorName,
        ward,
        wardId,
        signedBy: user?.uid ?? user?.id,
        signedByName: councillorName,
        signedAt,
        signatureDataUrl: letterSignatureDataUrl,
        createdAt: signedAt,
        sentAt: signedAt,
      });

      await firestoreService.updateRequest(letterRequest.id, { status: 'completed' });

      if (letterRequest.residentId) {
        await firestoreService.createNotification({
          userId: letterRequest.residentId,
          type: 'letter_ready',
          title: 'Your letter is ready',
          message: `Your signed ${letterRequest.category} has been prepared by the Ward Councillor.`,
          wardId,
        });
      }

      setSuccessMessage('Signed letter created and resident notified.');
      closeLetterModal();
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to create letter.');
    } finally {
      setSaving(false);
    }
  }

  function renderOverview() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Ward Projects" value={projects.length} icon="fa-folder-open" />
          <StatCard label="Forwarded Needs" value={forwardedNeeds.length} icon="fa-inbox" />
          <StatCard label="Proposals to Mayor" value={proposals.length} icon="fa-file-signature" />
          <StatCard label="Pending Letters" value={letterRequests.length} icon="fa-file-alt" />
        </div>

        <section className="cyber-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-cyber-text">Performance Scorecard</h2>
              <p className="text-sm text-cyber-muted">Ward performance across key categories</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xs text-cyber-muted uppercase tracking-wide">Overall Rating</p>
              <p className="text-3xl font-bold text-cyber-accent">{scorecard.overall}</p>
              <StarRating rating={Math.round(Number(scorecard.overall))} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCORECARD_CATEGORIES.map(({ key, label, icon }) => (
              <div key={key} className="p-4 rounded-lg bg-slate-bg border border-slate-border">
                <div className="flex items-center gap-2 mb-2">
                  <i className={`fas ${icon} text-cyber-accent`} />
                  <p className="text-sm font-medium text-cyber-text">{label}</p>
                </div>
                <StarRating rating={scorecard.ratings[key]} />
                <p className="text-xs text-cyber-muted mt-2">{scorecard.ratings[key]} / 5 stars</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function renderProjects() {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-cyber-text">Ward Projects</h2>
          <p className="text-sm text-cyber-muted">Projects with funding source, budget, and status</p>
        </div>
        <div className="cyber-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-cyber-muted border-b border-slate-border text-left">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Budget</th>
                <th className="pb-3 pr-4">Funding</th>
                <th className="pb-3 pr-4">Location</th>
                <th className="pb-3 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-cyber-muted">
                    No projects found for this ward.
                  </td>
                </tr>
              )}
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-slate-border/50 hover:bg-slate-bg/50">
                  <td className="py-3 pr-4 font-medium">{p.name}</td>
                  <td className="py-3 pr-4 text-cyber-muted">{p.category}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-3 pr-4">K{p.budget?.toLocaleString?.() ?? '—'}</td>
                  <td className="py-3 pr-4 text-cyber-muted">{p.fundingSource}</td>
                  <td className="py-3 pr-4 text-cyber-muted">{p.location}</td>
                  <td className="py-3 pr-4 text-cyber-muted">{formatDate(p.dateLogged)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderRequests() {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-cyber-text">Community Needs Forwarded by WDC</h2>
          <p className="text-sm text-cyber-muted">Review grouped resident requests and prepare proposals</p>
        </div>
        {forwardedNeeds.length === 0 ? (
          <div className="cyber-card text-center py-10">
            <p className="text-cyber-muted text-sm">No community needs forwarded from WDC yet.</p>
          </div>
        ) : (
          <div className="cyber-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cyber-muted border-b border-slate-border text-left">
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Zone</th>
                  <th className="pb-3 pr-4">Residents</th>
                  <th className="pb-3 pr-4">Ward</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {forwardedNeeds.map((need) => (
                  <tr key={need.id} className="border-b border-slate-border/50 hover:bg-slate-bg/50">
                    <td className="py-3 pr-4 font-medium">{need.category}</td>
                    <td className="py-3 pr-4 text-cyber-muted">{need.zone || 'All Ward'}</td>
                    <td className="py-3 pr-4">{need.residentCount ?? need.residentIds?.length ?? 0}</td>
                    <td className="py-3 pr-4 text-cyber-muted">{need.ward || ward}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status="Forwarded to Councillor" />
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => openReview(need)}
                        className="cyber-btn-primary text-xs py-1.5 px-3"
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

  function renderAnnouncements() {
    return (
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-cyber-text">Announcements</h2>
            <p className="text-sm text-cyber-muted">Create and view ward announcements</p>
          </div>
          <button
            type="button"
            onClick={() => setAnnouncementModal(true)}
            className="cyber-btn-primary text-sm"
          >
            <i className="fas fa-bullhorn mr-2" />
            Create Announcement
          </button>
        </div>
        <div className="space-y-3">
          {announcements.filter((a) => a.isActive !== false).length === 0 && (
            <div className="cyber-card text-center py-10">
              <p className="text-cyber-muted text-sm">No active announcements.</p>
            </div>
          )}
          {announcements
            .filter((a) => a.isActive !== false)
            .map((a) => (
              <div key={a.id} className="cyber-card">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{a.title}</h3>
                  <StatusBadge status={a.priority} />
                </div>
                <p className="text-sm text-cyber-muted">{a.content}</p>
                <p className="text-xs text-cyber-muted mt-2">
                  {a.ward} · {formatDate(a.createdAt)} · {a.createdBy}
                </p>
              </div>
            ))}
        </div>
      </section>
    );
  }

  function renderLetters() {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-cyber-text">Reference &amp; Support Letters</h2>
          <p className="text-sm text-cyber-muted">Review resident letter requests and create official letters</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-cyber-muted uppercase tracking-wide mb-3">
            Pending Letter Requests
          </h3>
          {letterRequests.length === 0 ? (
            <div className="cyber-card text-center py-8">
              <p className="text-cyber-muted text-sm">No pending letter requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {letterRequests.map((req) => (
                <div key={req.id} className="cyber-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{req.category}</h4>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-sm text-cyber-muted">{req.description}</p>
                      <p className="text-xs text-cyber-muted mt-2">
                        {req.residentName} · {formatDate(req.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openLetterForm(req)}
                      className="cyber-btn-primary text-sm"
                    >
                      Create Letter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-cyber-muted uppercase tracking-wide mb-3">
            Completed Letters
          </h3>
          {letters.length === 0 ? (
            <p className="text-cyber-muted text-sm">No letters created yet.</p>
          ) : (
            <div className="space-y-3">
              {letters.map((letter) => (
                <div key={letter.id} className="cyber-card">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{letter.residentName}</h4>
                    <StatusBadge status={letter.status} />
                    {letter.signatureDataUrl && (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Signed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-cyber-muted capitalize">
                    {String(letter.letterType ?? 'letter').replace(/_/g, ' ')} · {formatDate(letter.createdAt)}
                  </p>
                  <p className="text-sm text-cyber-muted mt-2 line-clamp-3 whitespace-pre-wrap">
                    {letter.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  function renderTabContent() {
    if (loading) {
      return <p className="text-cyber-muted text-sm animate-pulse py-8">Loading dashboard data…</p>;
    }
    switch (activeTab) {
      case 'projects':
        return renderProjects();
      case 'requests':
        return renderRequests();
      case 'announcements':
        return renderAnnouncements();
      case 'letters':
        return renderLetters();
      case 'profile':
        return <ProfilePage />;
      default:
        return renderOverview();
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-border">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyber-muted">
            Community Connect Hub
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-cyber-accent mt-1">
            Councillor Dashboard – {ward}
          </h1>
          <p className="text-sm text-cyber-muted mt-1">Ward {wardNumber}</p>
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
        open={!!reviewNeed}
        onClose={() => setReviewNeed(null)}
        title={reviewNeed ? `${reviewNeed.category} — ${reviewNeed.zone}` : 'Review Community Need'}
        wide
      >
        {reviewNeed && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <StatusBadge status="Forwarded to Councillor" />
              <span className="text-sm text-cyber-muted">
                {reviewNeed.residentCount ?? reviewNeed.residentIds?.length ?? 0} residents · {ward}
              </span>
            </div>
            {reviewNeed.reason && (
              <p className="text-sm text-cyber-muted">
                <span className="font-medium text-cyber-text">WDC note:</span> {reviewNeed.reason}
              </p>
            )}
            <div>
              <p className="text-xs text-cyber-muted uppercase tracking-wide mb-2">Residents</p>
              <div className="flex flex-wrap gap-2">
                {(reviewNeed.residentNames ?? []).map((name) => (
                  <span
                    key={name}
                    className="px-2 py-1 rounded-full text-xs bg-slate-bg border border-slate-border"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {relatedRequests.length === 0 && (
                <p className="text-sm text-cyber-muted">No individual request details available.</p>
              )}
              {relatedRequests.map((req) => (
                <div key={req.id} className="p-3 rounded-lg bg-slate-bg border border-slate-border text-sm">
                  <p className="font-medium">{req.residentName}</p>
                  <p className="text-cyber-muted mt-1">{req.description}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" onClick={startProposal} className="cyber-btn-success text-sm">
                Approve &amp; Prepare Proposal
              </button>
              <button
                type="button"
                onClick={() => setReturnModal(true)}
                className="cyber-btn-danger text-sm"
              >
                Return to WDC
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={returnModal} onClose={() => setReturnModal(false)} title="Return to WDC">
        <div className="space-y-3">
          <label className="text-xs text-cyber-muted">Reason for return</label>
          <textarea
            className="cyber-input min-h-[100px]"
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="Explain why this need is being returned…"
            required
          />
          <button
            type="button"
            disabled={saving || !returnReason.trim()}
            onClick={handleReturnToWdc}
            className="cyber-btn-danger w-full"
          >
            {saving ? 'Returning…' : 'Return to WDC'}
          </button>
        </div>
      </Modal>

      <ProposalFormModal
        open={proposalModal}
        need={reviewNeed}
        ward={ward}
        wardId={wardId}
        onSubmit={handleSubmitProposal}
        onClose={() => setProposalModal(false)}
      />

      <Modal
        open={announcementModal}
        onClose={() => setAnnouncementModal(false)}
        title="Create Announcement"
        wide
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-3">
          <div>
            <label className="text-xs text-cyber-muted">Title</label>
            <input
              className="cyber-input"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Description</label>
            <textarea
              className="cyber-input min-h-[100px]"
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-cyber-muted">Priority</label>
              <select
                className="cyber-input"
                value={announcementForm.priority}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Audience</label>
              <select
                className="cyber-input"
                value={announcementForm.targetAudience}
                onChange={(e) =>
                  setAnnouncementForm({ ...announcementForm, targetAudience: e.target.value })
                }
              >
                <option value="ward_only">Ward Only</option>
                <option value="all">Public</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} className="cyber-btn-primary w-full">
            {saving ? 'Posting…' : 'Post Announcement'}
          </button>
        </form>
      </Modal>

      <Modal open={letterModal} onClose={closeLetterModal} title="Create Letter" wide>
        {letterRequest && (
          <form onSubmit={handleCreateLetter} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-cyber-muted">Resident Name</label>
                <input className="cyber-input" value={letterRequest.residentName} readOnly />
              </div>
              <div>
                <label className="text-xs text-cyber-muted">Letter Type</label>
                <input
                  className="cyber-input capitalize"
                  value={String(letterRequest.letterType ?? 'reference').replace(/_/g, ' ')}
                  readOnly
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="text-xs text-cyber-muted">Letter Content</label>
                <button
                  type="button"
                  onClick={resetLetterTemplate}
                  className="text-xs text-cyber-accent hover:underline"
                >
                  Reset to template
                </button>
              </div>
              <textarea
                className="cyber-input min-h-[280px] font-mono text-sm leading-relaxed"
                value={letterForm.content}
                onChange={(e) => setLetterForm({ ...letterForm, content: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Attachment reference (optional)</label>
              <input
                className="cyber-input"
                value={letterForm.attachments}
                onChange={(e) => setLetterForm({ ...letterForm, attachments: e.target.value })}
                placeholder="File name or URL"
              />
            </div>
            <div className="pt-2 border-t border-slate-border">
              <p className="text-sm font-medium text-cyber-text mb-2">Ward Councillor signature</p>
              <p className="text-xs text-cyber-muted mb-3">
                Sign before sending — your signature will appear on the official letter PDF.
              </p>
              <SignaturePad
                key={letterRequest.id}
                signerName={user?.name ?? user?.fullName ?? 'Ward Councillor'}
                onSignatureChange={setLetterSignatureDataUrl}
              />
            </div>
            <button
              type="submit"
              disabled={saving || !letterSignatureDataUrl}
              className="cyber-btn-primary w-full disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Sign & Notify Resident'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
