import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole } from '../../constants/roleMapping';
import { addItem, updateItem } from '../../services/localStorageService';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';
import { REQUEST_TYPES, PROJECT_CATEGORIES, WARD_ZONE_OPTIONS, LETTER_TYPES, matchesWard, resolveWardId } from '../../utils/wdcHelpers';
import StatusBadge from '../../components/ui/StatusBadge';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
import Modal from '../../components/ui/Modal';

export default function RequestsPage() {
  const { user } = useAuth();
  const isResident = hasAnyRole(user?.role, ['resident']);
  const isCouncillor = hasAnyRole(user?.role, ['councillor']);
  const wardId = resolveWardId(user);

  const [requests, setRequests] = useState([]);
  const [dataSource, setDataSource] = useState('firestore');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    requestType: 'project',
    category: '',
    letterType: 'reference',
    zone: 'All Ward',
    description: '',
    documents: '',
  });
  const [saving, setSaving] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loadHybridCollection('requests', () => firestoreService.getRequests());
      setRequests(result.data.filter((r) => matchesWard(r, user)));
      setDataSource(result.dataSource);
    } catch (err) {
      setError(err.message || 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const visible = isResident
    ? requests.filter((r) => r.residentId === user.id || r.residentId === user.uid)
    : requests.filter((r) => matchesWard(r, user));

  async function submitRequest(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      id: `req_${Date.now()}`,
      requestType: form.requestType,
      category:
        form.requestType === 'letter'
          ? LETTER_TYPES.find((t) => t.value === form.letterType)?.label || form.letterType
          : form.category,
      letterType: form.requestType === 'letter' ? form.letterType : null,
      projectType: form.requestType === 'project' ? form.category : null,
      zone: form.requestType === 'project' ? form.zone : null,
      area: form.requestType === 'project' ? form.zone : null,
      description: form.description,
      documents: form.documents ? [form.documents] : [],
      status: 'Pending',
      residentId: user.uid || user.id,
      residentName: user.name,
      ward: user.ward,
      wardId,
      createdAt: new Date().toISOString(),
    };

    try {
      await firestoreService.createRequest(payload);
      setDataSource('firestore');
    } catch (err) {
      addItem('requests', payload);
      setDataSource((current) => (current === 'firestore' ? 'mixed' : 'localstorage'));
      console.error('Firestore createRequest failed, saved to localStorage:', err);
    }

    await loadRequests();
    setSaving(false);
    setModal(false);
    setForm({ requestType: 'project', category: '', letterType: 'reference', zone: 'All Ward', description: '', documents: '' });
  }

  async function handleAction(id, status) {
    setSaving(true);
    setError('');

    try {
      await firestoreService.updateRequest(id, { status });
      setDataSource('firestore');
    } catch (err) {
      updateItem('requests', id, { status });
      setDataSource((current) => (current === 'firestore' ? 'mixed' : 'localstorage'));
      console.error('Firestore updateRequest failed, updated localStorage:', err);
    }

    await loadRequests();
    setSaving(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-cyber-accent">Service Requests</h1>
            <DataSourceIndicator source={dataSource} />
          </div>
          <p className="text-cyber-muted text-sm">Track ward service requests and funding applications</p>
        </div>
        {isResident && (
          <button type="button" onClick={() => setModal(true)} className="cyber-btn-primary">
            <i className="fas fa-plus mr-2" /> Submit Request
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-cyber-muted text-sm animate-pulse">Loading requests…</p>
      ) : (
        <div className="space-y-3">
          {visible.length === 0 && (
            <p className="text-cyber-muted text-sm">No service requests found.</p>
          )}
          {visible.map((r) => (
            <div key={r.id} className="cyber-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold">{r.category}</h3>
                    {r.requestType && (
                      <span className="text-xs text-cyber-muted capitalize">
                        ({r.requestType.replace(/_/g, ' ')})
                      </span>
                    )}
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-cyber-muted text-sm">{r.description}</p>
                  <p className="text-xs text-cyber-muted mt-2">
                    {r.residentName} · {r.zone || r.area || r.ward} ·{' '}
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {isCouncillor && r.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleAction(r.id, 'In Progress')}
                      className="cyber-btn-success text-sm"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleAction(r.id, 'Rejected')}
                      className="cyber-btn-danger text-sm"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {isCouncillor && r.status === 'In Progress' && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleAction(r.id, 'Resolved')}
                    className="cyber-btn-primary text-sm"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Submit Service Request">
        <form onSubmit={submitRequest} className="space-y-3">
          <div>
            <label className="text-xs text-cyber-muted">Request Type</label>
            <select
              className="cyber-input"
              value={form.requestType}
              onChange={(e) => setForm({ ...form, requestType: e.target.value, category: '' })}
              required
            >
              {REQUEST_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-cyber-muted">
              {form.requestType === 'project'
                ? 'Project Category'
                : form.requestType === 'letter'
                  ? 'Letter Type'
                  : 'Category'}
            </label>
            {form.requestType === 'letter' ? (
              <select
                className="cyber-input"
                value={form.letterType}
                onChange={(e) => setForm({ ...form, letterType: e.target.value })}
                required
              >
                {LETTER_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className="cyber-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                <option value="">Select…</option>
                {(form.requestType === 'project'
                  ? PROJECT_CATEGORIES
                  : form.requestType === 'complaint'
                    ? ['Service Issue', 'Infrastructure', 'Safety', 'Other']
                    : ['Suggestion', 'Appreciation', 'Other']
                ).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
          {form.requestType === 'project' && (
            <div>
              <label className="text-xs text-cyber-muted">Zone / Area (optional)</label>
              <select
                className="cyber-input"
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
              >
                {WARD_ZONE_OPTIONS.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs text-cyber-muted">Description</label>
            <textarea
              className="cyber-input min-h-[100px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Document reference (optional)</label>
            <input
              className="cyber-input"
              value={form.documents}
              onChange={(e) => setForm({ ...form, documents: e.target.value })}
              placeholder="File name or reference"
            />
          </div>
          <button type="submit" disabled={saving} className="cyber-btn-primary w-full">
            {saving ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
