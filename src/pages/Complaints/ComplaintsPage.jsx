import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole, normalizeRole } from '../../constants/roleMapping';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
} from '../../constants/complaints';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';
import { matchesWard, resolveWardId } from '../../utils/wdcHelpers';
import StatusBadge from '../../components/ui/StatusBadge';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
import Modal from '../../components/ui/Modal';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ComplaintsPage() {
  const { user } = useAuth();
  const wardId = resolveWardId(user);
  const userId = user?.uid ?? user?.id;
  const role = normalizeRole(user?.role);
  const isResident = role === 'resident';
  const canManage = hasAnyRole(user?.role, ['wdc-member', 'councillor', 'system-admin']);

  const [complaints, setComplaints] = useState([]);
  const [dataSource, setDataSource] = useState('firestore');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitModal, setSubmitModal] = useState(false);
  const [manageComplaint, setManageComplaint] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({
    title: '',
    category: COMPLAINT_CATEGORIES[0],
    description: '',
    priority: 'Medium',
  });
  const [manageForm, setManageForm] = useState({
    status: 'Pending',
    response: '',
    assignedToName: '',
  });

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loadHybridCollection('complaints', () =>
        firestoreService.getComplaints(wardId || undefined),
      );
      let items = result.data.filter((c) => matchesWard(c, user));
      if (isResident) {
        items = items.filter((c) => c.residentId === userId);
      }
      items.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
      setComplaints(items);
      setDataSource(result.dataSource);
    } catch (err) {
      setError(err.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }, [user, wardId, userId, isResident]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const filteredComplaints = useMemo(() => {
    if (statusFilter === 'all') return complaints;
    return complaints.filter((c) => c.status === statusFilter);
  }, [complaints, statusFilter]);

  async function submitComplaint(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await firestoreService.createComplaint({
        id: `cmp_${Date.now()}`,
        residentId: userId,
        residentName: user?.name ?? user?.fullName ?? 'Resident',
        ward: user?.ward ?? '',
        wardId,
        category: form.category,
        title: form.title,
        description: form.description,
        priority: form.priority,
        status: 'Pending',
        response: '',
        assignedTo: null,
        assignedToName: '',
        createdAt: new Date().toISOString(),
      });

      const wdcMembers = await firestoreService.findWdcMembers(wardId);
      await Promise.all(
        wdcMembers.map((w) =>
          firestoreService.createNotification({
            userId: w.uid ?? w.id,
            type: 'complaint_submitted',
            title: 'New Ward Complaint',
            message: `${user?.name ?? 'A resident'} submitted: ${form.title}`,
            wardId,
          }).catch(() => null),
        ),
      );

      setSuccessMessage('Complaint submitted. WDC will review and respond.');
      setSubmitModal(false);
      setForm({ title: '', category: COMPLAINT_CATEGORIES[0], description: '', priority: 'Medium' });
      await loadComplaints();
    } catch (err) {
      setError(err.message || 'Failed to submit complaint.');
    } finally {
      setSaving(false);
    }
  }

  function openManage(complaint) {
    setManageComplaint(complaint);
    setManageForm({
      status: complaint.status ?? 'Pending',
      response: complaint.response ?? '',
      assignedToName: complaint.assignedToName ?? user?.name ?? '',
    });
  }

  async function saveComplaintUpdate(e) {
    e.preventDefault();
    if (!manageComplaint) return;
    setSaving(true);
    setError('');
    try {
      const updates = {
        status: manageForm.status,
        response: manageForm.response.trim(),
        assignedTo: userId,
        assignedToName: manageForm.assignedToName.trim() || user?.name,
        updatedAt: new Date().toISOString(),
        ...(manageForm.status === 'Resolved' ? { resolvedAt: new Date().toISOString() } : {}),
      };
      await firestoreService.updateComplaint(manageComplaint.id, updates);

      if (manageComplaint.residentId) {
        await firestoreService.createNotification({
          userId: manageComplaint.residentId,
          type: 'complaint_update',
          title: 'Complaint Update',
          message: `Your complaint "${manageComplaint.title}" is now ${manageForm.status}.`,
          wardId,
        }).catch(() => null);
      }

      setSuccessMessage('Complaint updated.');
      setManageComplaint(null);
      await loadComplaints();
    } catch (err) {
      setError(err.message || 'Failed to update complaint.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-cyber-accent">Complaints</h1>
            <DataSourceIndicator source={dataSource} />
          </div>
          <p className="text-cyber-muted text-sm">
            {isResident
              ? 'Submit and track complaints about ward services'
              : 'Review, assign, and respond to resident complaints'}
          </p>
        </div>
        {isResident && (
          <button type="button" onClick={() => setSubmitModal(true)} className="cyber-btn-primary">
            <i className="fas fa-exclamation-circle mr-2" /> Submit Complaint
          </button>
        )}
      </div>

      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-status-completed/10 border border-status-completed/30 text-status-completed text-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="text-xs text-cyber-muted mr-2">Status</label>
        <select
          className="cyber-input inline-block w-auto min-w-[160px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          {COMPLAINT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-cyber-muted text-sm animate-pulse">Loading complaints…</p>
      ) : filteredComplaints.length === 0 ? (
        <p className="text-cyber-muted text-sm">
          {isResident ? 'You have no complaints yet.' : 'No complaints for this ward.'}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredComplaints.map((c) => (
            <div key={c.id} className="cyber-card">
              <div className="flex flex-wrap justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold">{c.title}</h3>
                    <StatusBadge status={c.status} />
                    <span className="text-xs px-2 py-0.5 rounded border border-slate-border text-cyber-muted">
                      {c.priority}
                    </span>
                  </div>
                  <p className="text-cyber-muted text-sm">{c.description}</p>
                  <p className="text-xs text-cyber-muted mt-2">
                    {c.category} · {isResident ? formatDate(c.createdAt) : `${c.residentName} · ${formatDate(c.createdAt)}`}
                  </p>
                  {c.response && (
                    <p className="text-sm text-cyber-text mt-2 p-3 rounded-lg bg-slate-bg border border-slate-border">
                      <span className="text-cyber-accent font-medium">Response: </span>
                      {c.response}
                    </p>
                  )}
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => openManage(c)}
                    className="cyber-btn-secondary text-sm shrink-0"
                  >
                    Manage
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={submitModal} onClose={() => setSubmitModal(false)} title="Submit Complaint">
        <form onSubmit={submitComplaint} className="space-y-3">
          <div>
            <label className="text-xs text-cyber-muted">Title</label>
            <input
              className="cyber-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-cyber-muted">Category</label>
              <select
                className="cyber-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Priority</label>
              <select
                className="cyber-input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {COMPLAINT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Description</label>
            <textarea
              className="cyber-input min-h-[100px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <button type="submit" disabled={saving} className="cyber-btn-primary w-full">
            {saving ? 'Submitting…' : 'Submit Complaint'}
          </button>
        </form>
      </Modal>

      <Modal open={!!manageComplaint} onClose={() => setManageComplaint(null)} title="Manage Complaint" wide>
        {manageComplaint && (
          <form onSubmit={saveComplaintUpdate} className="space-y-3">
            <p className="text-sm text-cyber-muted">{manageComplaint.title} — {manageComplaint.residentName}</p>
            <div>
              <label className="text-xs text-cyber-muted">Status</label>
              <select
                className="cyber-input"
                value={manageForm.status}
                onChange={(e) => setManageForm({ ...manageForm, status: e.target.value })}
              >
                {COMPLAINT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Assigned to</label>
              <input
                className="cyber-input"
                value={manageForm.assignedToName}
                onChange={(e) => setManageForm({ ...manageForm, assignedToName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Response to resident</label>
              <textarea
                className="cyber-input min-h-[100px]"
                value={manageForm.response}
                onChange={(e) => setManageForm({ ...manageForm, response: e.target.value })}
                placeholder="Explain actions taken or next steps…"
              />
            </div>
            <button type="submit" disabled={saving} className="cyber-btn-primary w-full">
              {saving ? 'Saving…' : 'Save Update'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
