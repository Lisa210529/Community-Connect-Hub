import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole } from '../../constants/roleMapping';
import { addItem, updateItem } from '../../services/localStorageService';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';
import { resolveWardId } from '../../utils/wdcHelpers';
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

export default function ResolutionsPage() {
  const { user } = useAuth();
  const wardId = resolveWardId(user);
  const canManage = hasAnyRole(user?.role, ['wdc-member', 'councillor', 'system-admin']);

  const [resolutions, setResolutions] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [dataSource, setDataSource] = useState('firestore');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', meetingId: '', description: '' });
  const [meetingFilter, setMeetingFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [resResult, mtgResult] = await Promise.all([
        loadHybridCollection('resolutions', () => firestoreService.getResolutions(wardId || undefined)),
        loadHybridCollection('meetings', () => firestoreService.getMeetings(wardId || undefined)),
      ]);
      setResolutions(
        resResult.data.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)),
      );
      setMeetings(mtgResult.data);
      setDataSource(resResult.dataSource === 'firestore' && mtgResult.dataSource === 'firestore'
        ? 'firestore'
        : resResult.dataSource === 'localstorage' && mtgResult.dataSource === 'localstorage'
          ? 'localstorage'
          : 'mixed');
    } catch (err) {
      setError(err.message || 'Failed to load resolutions.');
    } finally {
      setLoading(false);
    }
  }, [wardId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const meetingTitleById = useMemo(
    () => Object.fromEntries(meetings.map((m) => [m.id, m.title])),
    [meetings],
  );

  const filteredResolutions = useMemo(() => {
    if (meetingFilter === 'all') return resolutions;
    return resolutions.filter((r) => r.meetingId === meetingFilter);
  }, [resolutions, meetingFilter]);

  async function createResolution(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      id: `res_${Date.now()}`,
      ...form,
      status: 'Pending',
      votesFor: 0,
      votesAgainst: 0,
      votes: { yes: 0, no: 0, abstain: 0 },
      proposedBy: user?.uid ?? user?.id,
      proposedByName: user?.name ?? user?.fullName ?? 'WDC Member',
      ward: user?.ward ?? '',
      wardId,
      createdAt: new Date().toISOString(),
    };

    try {
      await firestoreService.createResolution(payload);
      setDataSource('firestore');
      setSuccessMessage('Resolution created.');
    } catch (err) {
      addItem('resolutions', payload);
      setDataSource((current) => (current === 'firestore' ? 'mixed' : 'localstorage'));
      console.error('Firestore createResolution failed, saved to localStorage:', err);
      setSuccessMessage('Resolution saved locally.');
    }

    await loadData();
    setSaving(false);
    setModal(false);
    setForm({ title: '', meetingId: '', description: '' });
  }

  async function vote(id, approve) {
    const res = resolutions.find((r) => r.id === id);
    if (!res || res.status !== 'Pending') return;

    const votesFor = (res.votesFor ?? res.votes?.yes ?? 0) + (approve ? 1 : 0);
    const votesAgainst = (res.votesAgainst ?? res.votes?.no ?? 0) + (approve ? 0 : 1);
    const status = approve
      ? 'Approved'
      : votesAgainst >= 2
        ? 'Rejected'
        : 'Pending';

    const updates = {
      votesFor,
      votesAgainst,
      votes: { yes: votesFor, no: votesAgainst, abstain: res.votes?.abstain ?? 0 },
      status,
      ...(status === 'Approved' ? { approvedAt: new Date().toISOString() } : {}),
    };

    setSaving(true);
    try {
      await firestoreService.updateResolution(id, updates);
      setDataSource('firestore');
    } catch (err) {
      updateItem('resolutions', id, updates);
      setDataSource((current) => (current === 'firestore' ? 'mixed' : 'localstorage'));
      console.error('Firestore updateResolution failed:', err);
    }
    await loadData();
    setSaving(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-cyber-accent">WDC Resolutions</h1>
            <DataSourceIndicator source={dataSource} />
          </div>
          <p className="text-cyber-muted text-sm">Create and vote on ward development resolutions linked to meetings</p>
        </div>
        {canManage && (
          <button type="button" onClick={() => setModal(true)} className="cyber-btn-primary">
            <i className="fas fa-gavel mr-2" /> Create Resolution
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
        <label className="text-xs text-cyber-muted mr-2">Filter by meeting</label>
        <select
          className="cyber-input inline-block w-auto min-w-[200px]"
          value={meetingFilter}
          onChange={(e) => setMeetingFilter(e.target.value)}
        >
          <option value="all">All meetings</option>
          {meetings.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-cyber-muted text-sm animate-pulse">Loading resolutions…</p>
      ) : filteredResolutions.length === 0 ? (
        <p className="text-cyber-muted text-sm">No resolutions yet.</p>
      ) : (
        <div className="space-y-3">
          {filteredResolutions.map((r) => (
            <div key={r.id} className="cyber-card">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{r.title}</h3>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-cyber-muted text-sm">{r.description}</p>
                  <p className="text-xs text-cyber-muted mt-2">
                    Meeting: {meetingTitleById[r.meetingId] || '—'} · Proposed by {r.proposedByName || 'WDC'}
                  </p>
                  <p className="text-xs text-cyber-muted mt-1">
                    Votes: {r.votesFor ?? r.votes?.yes ?? 0} for · {r.votesAgainst ?? r.votes?.no ?? 0} against
                    · {formatDate(r.createdAt)}
                  </p>
                </div>
                {canManage && r.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => vote(r.id, true)}
                      className="cyber-btn-success text-sm"
                    >
                      Vote For
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => vote(r.id, false)}
                      className="cyber-btn-danger text-sm"
                    >
                      Vote Against
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Create Resolution">
        <form onSubmit={createResolution} className="space-y-3">
          <div>
            <label className="text-xs text-cyber-muted">Title</label>
            <input
              className="cyber-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Meeting</label>
            <select
              className="cyber-input"
              value={form.meetingId}
              onChange={(e) => setForm({ ...form, meetingId: e.target.value })}
              required
            >
              <option value="">Select meeting…</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>{m.title} ({m.date})</option>
              ))}
            </select>
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
            {saving ? 'Creating…' : 'Create'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
