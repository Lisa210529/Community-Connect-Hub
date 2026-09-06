import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole, normalizeRole } from '../../constants/roleMapping';
import {
  EMPTY_CONTRACTOR,
  EMPTY_EXPENDITURE,
  FUNDING_SOURCES,
  fundingSourceToStakeholderType,
  getFundingSourceLabel,
} from '../../constants/acquittals';
import { WDC_POSITION_LABELS } from '../../constants/wdcRoles';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';
import { buildAcquittalReport } from '../../utils/letterTemplates';
import { matchesWard, resolveWardId } from '../../utils/wdcHelpers';
import {
  downloadDocumentAsPdf,
  hasDocumentSignatureMarker,
  insertDocumentSignatureMarker,
  readFileAsDataUrl,
  removeDocumentSignatureMarker,
} from '../../utils/fileHelpers';
import SignaturePad from '../../components/forms/SignaturePad';
import StatusBadge from '../../components/ui/StatusBadge';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
import Modal from '../../components/ui/Modal';

const MAX_PHOTO_BYTES = 750 * 1024;

const EMPTY_FORM = {
  projectId: '',
  fundingSource: 'DDA',
  amountAllocated: '',
  amountSpent: '',
  periodCovered: '',
  expenditureBreakdown: [{ ...EMPTY_EXPENDITURE }],
  contractorDetails: { ...EMPTY_CONTRACTOR },
  comments: '',
  photoData: '',
  photoName: '',
  documentContent: '',
  signatureDataUrl: null,
};

function resolvePreparerPosition(user) {
  const position = user?.wdcPosition ?? user?.position ?? '';
  if (position) return position;
  return WDC_POSITION_LABELS.treasurer;
}

export default function AcquittalsPage() {
  const { user } = useAuth();
  const wardId = resolveWardId(user);
  const userId = user?.uid ?? user?.id;
  const role = normalizeRole(user?.role);
  const canCreate = hasAnyRole(user?.role, ['councillor', 'wdc-member']);
  const preparerName = user?.name ?? user?.fullName ?? 'WDC Member';

  const [acquittals, setAcquittals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dataSource, setDataSource] = useState('firestore');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formModal, setFormModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const textareaRef = useRef(null);
  const signatureAnchorRef = useRef(0);

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

  const pendingStakeholder = useMemo(
    () => acquittals.filter((a) => ['Submitted to Stakeholder', 'Submitted'].includes(a.status)),
    [acquittals],
  );

  const buildTemplateFromForm = useCallback((formState = form) => {
    const project = projects.find((p) => p.id === formState.projectId);
    const allocated = Number(formState.amountAllocated) || Number(project?.budget ?? project?.fundedAmount ?? 0);
    const spent = Number(formState.amountSpent) || 0;
    return buildAcquittalReport({
      projectName: project?.name ?? '',
      projectNumber: project?.id ?? '',
      ward: user?.ward ?? project?.ward ?? '',
      wardNumber: user?.wardNumber ?? project?.wardNumber ?? '',
      fundingSource: formState.fundingSource,
      amountAllocated: allocated,
      amountSpent: spent,
      balance: allocated - spent,
      periodCovered: formState.periodCovered,
      contractorName: formState.contractorDetails?.name ?? '',
      contractorContact: formState.contractorDetails?.contact ?? '',
      expenditureBreakdown: formState.expenditureBreakdown,
      comments: formState.comments,
      preparerName,
      preparerPosition: resolvePreparerPosition(user),
      chairmanName: '',
      date: new Date(),
    });
  }, [form, projects, user, preparerName]);

  function openCreateModal() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, documentContent: buildAcquittalReport({ preparerName, preparerPosition: resolvePreparerPosition(user), ward: user?.ward ?? '', wardNumber: user?.wardNumber ?? '' }) });
    setFormModal(true);
    setError('');
  }

  function openEditDraft(item) {
    setEditingId(item.id);
    setForm({
      projectId: item.projectId ?? '',
      fundingSource: item.fundingSource ?? 'DDA',
      amountAllocated: item.amountAllocated ?? '',
      amountSpent: item.amountSpent ?? '',
      periodCovered: item.periodCovered ?? '',
      expenditureBreakdown: item.expenditureBreakdown?.length ? item.expenditureBreakdown : [{ ...EMPTY_EXPENDITURE }],
      contractorDetails: { ...EMPTY_CONTRACTOR, ...item.contractorDetails },
      comments: item.comments ?? '',
      photoData: item.photos?.[0]?.url ?? '',
      photoName: item.photos?.[0]?.name ?? '',
      documentContent: item.documentContent ?? buildAcquittalReport({ preparerName }),
      signatureDataUrl: item.signatureDataUrl ?? null,
    });
    setFormModal(true);
    setError('');
  }

  function handleProjectChange(projectId) {
    const project = projects.find((p) => p.id === projectId);
    const rawSource = String(project?.fundingSource ?? '').toUpperCase();
    const fundingSource = FUNDING_SOURCES.includes(rawSource) ? rawSource : form.fundingSource;
    const amountAllocated = project?.budget ?? project?.fundedAmount ?? form.amountAllocated;
    const nextForm = {
      ...form,
      projectId,
      fundingSource,
      amountAllocated: amountAllocated || form.amountAllocated,
    };
    nextForm.documentContent = buildTemplateFromForm(nextForm);
    setForm(nextForm);
  }

  function handleResetTemplate() {
    setForm((prev) => ({
      ...prev,
      documentContent: buildTemplateFromForm(prev),
      signatureDataUrl: null,
    }));
  }

  function trackSignatureCursor() {
    const el = textareaRef.current;
    if (!el) return;
    signatureAnchorRef.current = el.selectionStart ?? 0;
  }

  function handleSignatureChange(dataUrl) {
    setForm((prev) => {
      let documentContent = prev.documentContent;
      if (dataUrl) {
        documentContent = insertDocumentSignatureMarker(documentContent, signatureAnchorRef.current);
      } else {
        documentContent = removeDocumentSignatureMarker(documentContent);
      }
      return { ...prev, signatureDataUrl: dataUrl, documentContent };
    });
  }

  function handleDocumentContentChange(nextContent) {
    setForm((prev) => {
      const signatureDataUrl = prev.signatureDataUrl && !hasDocumentSignatureMarker(nextContent)
        ? null
        : prev.signatureDataUrl;
      return { ...prev, documentContent: nextContent, signatureDataUrl };
    });
  }

  function updateExpenditure(index, field, value) {
    setForm((prev) => {
      const expenditureBreakdown = prev.expenditureBreakdown.map((row, i) => (
        i === index ? { ...row, [field]: value } : row
      ));
      return { ...prev, expenditureBreakdown };
    });
  }

  function addExpenditureRow() {
    setForm((prev) => ({
      ...prev,
      expenditureBreakdown: [...prev.expenditureBreakdown, { ...EMPTY_EXPENDITURE }],
    }));
  }

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

  async function notifyStakeholders(payload, stakeholderType) {
    const stakeholders = await firestoreService.findStakeholdersByFundingSource(payload.fundingSource);
    const notifyIds = new Set(stakeholders.map((s) => s.uid ?? s.id).filter(Boolean));

    await Promise.all(
      Array.from(notifyIds).map((uid) =>
        firestoreService.createNotification({
          userId: uid,
          type: 'acquittal_received',
          title: 'Acquittal Report Received',
          message: `${payload.projectName} — acquittal submitted by ${payload.ward} WDC. Allocated ${payload.amountAllocated}, spent ${payload.amountSpent}.`,
          wardId: payload.wardId,
          projectId: payload.projectId,
          acquittalId: payload.id,
          fundingSource: payload.fundingSource,
        }).catch(() => null),
      ),
    );

    const mayor = await firestoreService.findMayor();
    const wdcMembers = await firestoreService.findWdcMembers(wardId);
    const internalIds = new Set([mayor?.uid, ...wdcMembers.map((w) => w.uid ?? w.id)].filter(Boolean));
    await Promise.all(
      Array.from(internalIds).map((uid) =>
        firestoreService.createNotification({
          userId: uid,
          type: 'acquittal_submitted',
          title: 'Acquittal Sent to Funding Stakeholder',
          message: `${payload.projectName} acquittal sent to ${getFundingSourceLabel(payload.fundingSource)}.`,
          wardId: payload.wardId,
          projectId: payload.projectId,
          acquittalId: payload.id,
        }).catch(() => null),
      ),
    );

    return { stakeholderType, notified: notifyIds.size };
  }

  async function saveAcquittal(submit = false) {
    if (submit && !form.signatureDataUrl) {
      setError('Draw your signature in the document before submitting to the funding stakeholder.');
      return;
    }
    if (submit && !fundingSourceToStakeholderType(form.fundingSource)) {
      setError('Select a funding source (PSIP, DSIP, DDA, or NGO) so the acquittal can be routed to the correct stakeholder.');
      return;
    }

    setSaving(true);
    setError('');
    const project = projects.find((p) => p.id === form.projectId);
    const stakeholderType = fundingSourceToStakeholderType(form.fundingSource);
    const payload = {
      id: editingId ?? `acq_${Date.now()}`,
      projectId: form.projectId,
      projectName: project?.name ?? 'Project',
      ward: user?.ward ?? project?.ward ?? '',
      wardId,
      councillorId: userId,
      councillorName: preparerName,
      preparerName,
      preparerPosition: resolvePreparerPosition(user),
      fundingSource: form.fundingSource,
      stakeholderType,
      amountAllocated: Number(form.amountAllocated) || 0,
      amountSpent: Number(form.amountSpent) || 0,
      periodCovered: form.periodCovered.trim(),
      expenditureBreakdown: form.expenditureBreakdown.filter((e) => e.category || e.amount),
      contractorDetails: form.contractorDetails,
      documentContent: form.documentContent,
      signatureDataUrl: form.signatureDataUrl,
      photos: form.photoData ? [{ name: form.photoName, url: form.photoData, uploadedAt: new Date().toISOString() }] : [],
      receipts: [],
      comments: form.comments.trim(),
      status: submit ? 'Submitted to Stakeholder' : 'Draft',
      submittedBy: userId,
      submittedAt: submit ? new Date().toISOString() : null,
      sentToStakeholderAt: submit ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    };

    try {
      if (editingId) {
        await firestoreService.updateAcquittal(editingId, payload);
      } else {
        await firestoreService.createAcquittal(payload);
      }

      if (submit) {
        const { notified } = await notifyStakeholders(payload, stakeholderType);
        if (notified === 0) {
          setSuccessMessage(`Acquittal submitted. No ${getFundingSourceLabel(form.fundingSource)} account is registered yet — register the stakeholder so they can receive it in their dashboard.`);
        } else {
          setSuccessMessage(`Acquittal signed and sent to ${getFundingSourceLabel(form.fundingSource)}.`);
        }
      } else {
        setSuccessMessage('Acquittal saved as draft.');
      }

      setFormModal(false);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to save acquittal.');
    } finally {
      setSaving(false);
    }
  }

  async function downloadAcquittalPdf(item) {
    try {
      await downloadDocumentAsPdf({
        content: item.documentContent ?? '',
        signatureDataUrl: item.signatureDataUrl,
        fileName: `acquittal-${slugify(item.projectName)}.pdf`,
        title: 'Ward Development Committee — Acquittal Report',
      });
    } catch {
      setError('Could not export PDF.');
    }
  }

  function slugify(value) {
    return String(value ?? 'report').trim().replace(/\s+/g, '-').slice(0, 40);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-cyber-accent">Acquittal Reports</h1>
            <DataSourceIndicator source={dataSource} />
          </div>
          <p className="text-cyber-muted text-sm">
            Compile, edit, sign, and submit financial acquittals to the funding stakeholder (DDA, PSIP, DSIP, NGO)
          </p>
        </div>
        {canCreate && (
          <button type="button" onClick={openCreateModal} className="cyber-btn-primary">
            <i className="fas fa-file-invoice-dollar mr-2" /> New Acquittal
          </button>
        )}
      </div>

      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-status-completed/10 border border-status-completed/30 text-status-completed text-sm">{successMessage}</div>
      )}
      {error && !formModal && (
        <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">{error}</div>
      )}

      {pendingStakeholder.length > 0 && (
        <section className="cyber-card mb-6">
          <h2 className="font-semibold mb-3">Awaiting Stakeholder Response ({pendingStakeholder.length})</h2>
          <div className="space-y-3">
            {pendingStakeholder.map((a) => (
              <div key={a.id} className="p-4 rounded-lg bg-slate-bg border border-slate-border flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-medium">{a.projectName}</p>
                  <p className="text-sm text-cyber-muted">
                    Sent to {getFundingSourceLabel(a.fundingSource)} · Spent K {Number(a.amountSpent).toLocaleString()} / K {Number(a.amountAllocated).toLocaleString()}
                  </p>
                </div>
                <button type="button" onClick={() => setViewItem(a)} className="cyber-btn-secondary text-sm">View</button>
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
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{a.projectName}</h3>
                  <StatusBadge status={a.status} />
                </div>
                <div className="flex gap-2">
                  {a.status === 'Draft' && canCreate && (
                    <button type="button" onClick={() => openEditDraft(a)} className="cyber-btn-secondary text-xs py-1 px-2">Edit draft</button>
                  )}
                  <button type="button" onClick={() => setViewItem(a)} className="cyber-btn-secondary text-xs py-1 px-2">View</button>
                  {a.documentContent && (
                    <button type="button" onClick={() => downloadAcquittalPdf(a)} className="cyber-btn-secondary text-xs py-1 px-2">PDF</button>
                  )}
                </div>
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
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {error && (
            <div className="p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">{error}</div>
          )}

          <section>
            <h3 className="text-sm font-semibold text-cyber-accent mb-2">1. Project &amp; financial details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-cyber-muted">Funded project</label>
                <select className="cyber-input" value={form.projectId} onChange={(e) => handleProjectChange(e.target.value)} required>
                  <option value="">Select project…</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-cyber-muted">Funding source (recipient)</label>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-cyber-muted">Period covered</label>
                  <input className="cyber-input" placeholder="e.g. Jan–Jun 2026" value={form.periodCovered} onChange={(e) => setForm({ ...form, periodCovered: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-cyber-muted">Contractor name</label>
                  <input className="cyber-input" value={form.contractorDetails.name} onChange={(e) => setForm({ ...form, contractorDetails: { ...form.contractorDetails, name: e.target.value } })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-cyber-muted">Expenditure breakdown</label>
                <div className="space-y-2 mt-1">
                  {form.expenditureBreakdown.map((row, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2">
                      <input className="cyber-input" placeholder="Category" value={row.category} onChange={(e) => updateExpenditure(index, 'category', e.target.value)} />
                      <input type="number" className="cyber-input" placeholder="Amount (K)" value={row.amount} onChange={(e) => updateExpenditure(index, 'amount', e.target.value)} />
                      <input className="cyber-input" placeholder="Description" value={row.description} onChange={(e) => updateExpenditure(index, 'description', e.target.value)} />
                    </div>
                  ))}
                  <button type="button" onClick={addExpenditureRow} className="text-xs text-cyber-accent hover:underline">+ Add line item</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-cyber-muted">Photo evidence</label>
                <input type="file" accept="image/*" className="cyber-input" onChange={handlePhotoChange} />
              </div>
              <textarea className="cyber-input min-h-[60px]" placeholder="Internal comments / notes for the template" value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
            </div>
          </section>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold text-cyber-accent">2. Acquittal document (edit before signing)</h3>
              <button type="button" onClick={handleResetTemplate} className="text-xs text-cyber-accent hover:underline">Reset template from details</button>
            </div>
            <p className="text-xs text-cyber-muted mb-2">
              Click inside the document at the &ldquo;Signature:&rdquo; line, then draw your signature below.
            </p>
            <textarea
              ref={textareaRef}
              className="cyber-input min-h-[280px] font-mono text-xs leading-relaxed"
              value={form.documentContent}
              onChange={(e) => handleDocumentContentChange(e.target.value)}
              onClick={trackSignatureCursor}
              onKeyUp={trackSignatureCursor}
            />
          </section>

          <section>
            <h3 className="text-sm font-semibold text-cyber-accent mb-2">3. Sign &amp; submit to funding stakeholder</h3>
            <SignaturePad onSignatureChange={handleSignatureChange} signerName={preparerName} />
            <p className="text-xs text-cyber-muted mt-2">
              Submitting sends this signed acquittal to {getFundingSourceLabel(form.fundingSource)} for review and acknowledgement.
            </p>
          </section>

          <div className="flex gap-3 pt-2">
            <button type="button" disabled={saving} onClick={() => saveAcquittal(false)} className="cyber-btn-secondary flex-1">Save Draft</button>
            <button type="button" disabled={saving || !form.projectId} onClick={() => saveAcquittal(true)} className="cyber-btn-primary flex-1">
              Sign &amp; Send to {form.fundingSource}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Acquittal Report" wide>
        {viewItem && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={viewItem.status} />
              <span className="text-sm text-cyber-muted">{getFundingSourceLabel(viewItem.fundingSource)}</span>
            </div>
            {viewItem.documentContent ? (
              <pre className="whitespace-pre-wrap text-xs bg-slate-bg p-4 rounded-lg border border-slate-border font-mono">{viewItem.documentContent}</pre>
            ) : (
              <p className="text-sm text-cyber-muted">No document content stored for this acquittal.</p>
            )}
            {viewItem.signatureDataUrl && (
              <div>
                <p className="text-xs text-cyber-muted mb-1">WDC signature</p>
                <img src={viewItem.signatureDataUrl} alt="Signature" className="h-16 bg-white rounded border border-slate-border p-1" />
              </div>
            )}
            {viewItem.stakeholderResponse && (
              <p className="text-sm text-cyber-muted">Stakeholder response: {viewItem.stakeholderResponse}</p>
            )}
            <button type="button" onClick={() => downloadAcquittalPdf(viewItem)} className="cyber-btn-secondary text-sm">Download PDF</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
