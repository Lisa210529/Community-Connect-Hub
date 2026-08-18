import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole, normalizeRole } from '../../constants/roleMapping';
import {
  ACQUITTAL_STATUSES,
  EMPTY_CONTRACTOR,
  EMPTY_EXPENDITURE,
  FUNDING_SOURCES,
} from '../../constants/acquittals';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';
import { matchesWard, resolveWardId } from '../../utils/wdcHelpers';
import { readFileAsDataUrl } from '../../utils/fileHelpers';
import StatusBadge from '../../components/ui/StatusBadge';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
import Modal from '../../components/ui/Modal';

const MAX_PHOTO_BYTES = 750 * 1024;

export default function AcquittalsPage() {
  const { user } = useAuth();
  const wardId = resolveWardId(user);
  const userId = user?.uid ?? user?.id;
  const role = normalizeRole(user?.role);
  const canCreate = hasAnyRole(user?.role, ['councillor', 'wdc-member']);
  const canReview = hasAnyRole(user?.role, ['mayor', 'wdc-member', 'provincial-admin', 'system-admin']);

  const [acquittals, setAcquittals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dataSource, setDataSource] = useState('firestore');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formModal, setFormModal] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    projectId: '',
    fundingSource: 'DDA',
    amountAllocated: '',
    amountSpent: '',
    expenditureBreakdown: [{ ...EMPTY_EXPENDITURE }],
    contractorDetails: { ...EMPTY_CONTRACTOR },
    comments: '',
    photoData: '',
    photoName: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [acqResult, projResult] = await Promise.all([
        loadHybridCollection('acquittals', () => firestoreService.getAcquittals(wardId || undefined)),
        loadHybridCollection('projects', () => firestoreService.getProjects(wardId || undefined)),
      ]);
      let items = acqResult.data.filter((a) => matchesWard(a, user));
      if (role === 'councillor') {
        items = items.filter((a) => a.councillorId === userId || a.submittedBy === userId);
      }
      setAcquittals(items.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)));
      setProjects(
        projResult.data.filter(
          (p) => matchesWard(p, user)
            && ['Funded', 'Completed', 'In Progress', 'funded', 'completed'].includes(String(p.status)),
        ),
      );
      setDataSource(acqResult.dataSource);
    } catch (err) {
      setError(err.message || 'Failed to load acquittals.');
    } finally {
      setLoading(false);
    }
  }, [user, wardId, userId, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingReview = useMemo(
    () => acquittals.filter((a) => ['Submitted', 'Under Review'].includes(a.status)),
    [acquittals],
  );

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file || file.size > MAX_PHOTO_BYTES) {
      setError('Photo must be 750 KB or smaller.');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((prev) => ({ ...prev, photoData: dataUrl, photoName: file.name }));
      setError('');
    } catch {
      setError('Could not read photo.');
    }
  }

  async function saveAcquittal(submit = false) {
    setSaving(true);
    setError('');
    const project = projects.find((p) => p.id === form.projectId);
    const payload = {
      id: `acq_${Date.now()}`,
      projectId: form.projectId,
      projectName: project?.name ?? 'Project',
      ward: user?.ward ?? project?.ward ?? '',
      wardId,
      councillorId: userId,
      councillorName: user?.name ?? user?.fullName ?? 'Councillor',
      fundingSource: form.fundingSource,
      amountAllocated: Number(form.amountAllocated) || 0,
      amountSpent: Number(form.amountSpent) || 0,
      expenditureBreakdown: form.expenditureBreakdown.filter((e) => e.category && e.amount),
      contractorDetails: form.contractorDetails,
      photos: form.photoData ? [{ name: form.photoName, url: form.photoData, uploadedAt: new Date().toISOString() }] : [],
      receipts: [],
      comments: form.comments.trim(),
      status: submit ? 'Submitted' : 'Draft',
      submittedBy: userId,
      submittedAt: submit ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    };

    try {
      await firestoreService.createAcquittal(payload);
      if (submit) {
        const mayor = await firestoreService.findMayor();
        const wdcMembers = await firestoreService.findWdcMembers(wardId);
        const notifyIds = new Set([mayor?.uid, ...wdcMembers.map((w) => w.uid ?? w.id)].filter(Boolean));
        await Promise.all(
          Array.from(notifyIds).map((uid) =>
            firestoreService.createNotification({
              userId: uid,
              type: 'acquittal_submitted',
              title: 'Acquittal Report Submitted',
              message: `${payload.projectName} acquittal submitted for review.`,
              wardId,
              projectId: payload.projectId,
            }).catch(() => null),
          ),
        );
      }
      setSuccessMessage(submit ? 'Acquittal submitted for review.' : 'Acquittal saved as draft.');
      setFormModal(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to save acquittal.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReviewDecision(approved) {
    if (!reviewItem) return;
    setSaving(true);
    try {
      await firestoreService.updateAcquittal(reviewItem.id, {
        status: approved ? 'Approved' : 'Rejected',
        comments: reviewComment.trim() || reviewItem.comments,
        approvedBy: userId,
        approvedAt: approved ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      });

      if (approved && reviewItem.projectId) {
        await firestoreService.updateProject(reviewItem.projectId, { status: 'Completed' });
      }

      if (reviewItem.councillorId) {
        await firestoreService.createNotification({
          userId: reviewItem.councillorId,
          type: 'acquittal_update',
          title: approved ? 'Acquittal Approved' : 'Acquittal Rejected',
          message: `Acquittal for ${reviewItem.projectName} was ${approved ? 'approved' : 'rejected'}.`,
          wardId: reviewItem.wardId,
        }).catch(() => null);
      }

      setSuccessMessage(`Acquittal ${approved ? 'approved' : 'rejected'}.`);
      setReviewItem(null);
      setReviewComment('');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update acquittal.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-cyber-accent">Acquittal Reports</h1>
            <DataSourceIndicator source={dataSource} />
          </div>
          <p className="text-cyber-muted text-sm">Financial acquittal for completed ward projects (WDC &amp; Mayor review)</p>
        </div>
        {canCreate && (
          <button type="button" onClick={() => setFormModal(true)} className="cyber-btn-primary">
            <i className="fas fa-file-invoice-dollar mr-2" /> New Acquittal
          </button>
        )}
      </div>

      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-status-completed/10 border border-status-completed/30 text-status-completed text-sm">{successMessage}</div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">{error}</div>
      )}

      {canReview && pendingReview.length > 0 && (
        <section className="cyber-card mb-6">
          <h2 className="font-semibold mb-3">Pending Review ({pendingReview.length})</h2>
          <div className="space-y-3">
            {pendingReview.map((a) => (
              <div key={a.id} className="p-4 rounded-lg bg-slate-bg border border-slate-border flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-medium">{a.projectName}</p>
                  <p className="text-sm text-cyber-muted">Spent {a.amountSpent} / {a.amountAllocated} · {a.fundingSource}</p>
                </div>
                <button type="button" onClick={() => setReviewItem(a)} className="cyber-btn-secondary text-sm">Review</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <p className="text-cyber-muted text-sm animate-pulse">Loading acquittals…</p>
      ) : acquittals.length === 0 ? (
        <p className="text-cyber-muted text-sm">No acquittal reports yet.</p>
      ) : (
        <div className="space-y-3">
          {acquittals.map((a) => (
            <div key={a.id} className="cyber-card">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="font-semibold">{a.projectName}</h3>
                <StatusBadge status={a.status} />
              </div>
              <p className="text-sm text-cyber-muted">
                {a.fundingSource} · Allocated K {Number(a.amountAllocated).toLocaleString()} · Spent K {Number(a.amountSpent).toLocaleString()}
              </p>
              {a.photos?.[0]?.url && (
                <img src={a.photos[0].url} alt="Evidence" className="mt-3 max-h-40 rounded-lg border border-slate-border" />
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={formModal} onClose={() => setFormModal(false)} title="Create Acquittal Report" wide>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-cyber-muted">Project</label>
            <select className="cyber-input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required>
              <option value="">Select project…</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-cyber-muted">Funding Source</label>
              <select className="cyber-input" value={form.fundingSource} onChange={(e) => setForm({ ...form, fundingSource: e.target.value })}>
                {FUNDING_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Allocated (K)</label>
              <input type="number" className="cyber-input" value={form.amountAllocated} onChange={(e) => setForm({ ...form, amountAllocated: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Spent (K)</label>
              <input type="number" className="cyber-input" value={form.amountSpent} onChange={(e) => setForm({ ...form, amountSpent: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Contractor name</label>
            <input className="cyber-input" value={form.contractorDetails.name} onChange={(e) => setForm({ ...form, contractorDetails: { ...form.contractorDetails, name: e.target.value } })} />
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Photo evidence</label>
            <input type="file" accept="image/*" className="cyber-input" onChange={handlePhotoChange} />
          </div>
          <textarea className="cyber-input min-h-[80px]" placeholder="Comments" value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
          <div className="flex gap-3">
            <button type="button" disabled={saving} onClick={() => saveAcquittal(false)} className="cyber-btn-secondary flex-1">Save Draft</button>
            <button type="button" disabled={saving || !form.projectId} onClick={() => saveAcquittal(true)} className="cyber-btn-primary flex-1">Submit for Review</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!reviewItem} onClose={() => setReviewItem(null)} title="Review Acquittal" wide>
        {reviewItem && (
          <div className="space-y-4">
            <p className="font-medium">{reviewItem.projectName}</p>
            <p className="text-sm text-cyber-muted">Balance: K {Number(reviewItem.balance ?? 0).toLocaleString()}</p>
            <textarea className="cyber-input min-h-[80px]" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Review comments" />
            <div className="flex gap-3">
              <button type="button" disabled={saving} onClick={() => handleReviewDecision(true)} className="cyber-btn-success flex-1">Approve</button>
              <button type="button" disabled={saving} onClick={() => handleReviewDecision(false)} className="cyber-btn-danger flex-1">Reject</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
