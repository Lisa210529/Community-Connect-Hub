import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole } from '../../constants/roleMapping';
import { addItem } from '../../services/localStorageService';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';
import StatusBadge from '../../components/ui/StatusBadge';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
import Modal from '../../components/ui/Modal';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const wardId = user?.wardId || '';
  const canPost = hasAnyRole(user?.role, [
    'councillor',
    'wdc-member',
    'mayor',
    'provincial-admin',
    'system-admin',
  ]);

  const [announcements, setAnnouncements] = useState([]);
  const [dataSource, setDataSource] = useState('firestore');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'medium',
    targetAudience: 'ward_only',
    ward: 'Ward 5 Nabasa',
  });

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loadHybridCollection('announcements', () =>
        firestoreService.getAnnouncements(wardId || undefined),
      );
      setAnnouncements(result.data);
      setDataSource(result.dataSource);
    } catch (err) {
      setError(err.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, [wardId]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  async function postAnnouncement(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      id: `ann_${Date.now()}`,
      ...form,
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      isActive: true,
      wardId: user?.wardId || '',
    };

    try {
      await firestoreService.createAnnouncement(payload);
      setDataSource('firestore');
    } catch (err) {
      addItem('announcements', payload);
      setDataSource((current) => (current === 'firestore' ? 'mixed' : 'localstorage'));
      console.error('Firestore createAnnouncement failed, saved to localStorage:', err);
    }

    await loadAnnouncements();
    setSaving(false);
    setModal(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-cyber-accent">Announcements</h1>
            <DataSourceIndicator source={dataSource} />
          </div>
          <p className="text-cyber-muted text-sm">Community notices and ward updates</p>
        </div>
        {canPost && (
          <button type="button" onClick={() => setModal(true)} className="cyber-btn-primary">
            <i className="fas fa-bullhorn mr-2" /> Post Announcement
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-cyber-muted text-sm animate-pulse">Loading announcements…</p>
      ) : (
        <div className="space-y-3">
          {announcements.filter((a) => a.isActive).length === 0 && (
            <p className="text-cyber-muted text-sm">No active announcements.</p>
          )}
          {announcements
            .filter((a) => a.isActive)
            .map((a) => (
              <div key={a.id} className="cyber-card">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{a.title}</h3>
                  <StatusBadge status={a.priority} />
                </div>
                <p className="text-cyber-muted text-sm">{a.content}</p>
                <p className="text-xs text-cyber-muted mt-3">
                  {a.createdBy} · {a.ward} · {a.targetAudience} ·{' '}
                  {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Post Announcement" wide>
        <form onSubmit={postAnnouncement} className="space-y-3">
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
            <label className="text-xs text-cyber-muted">Content</label>
            <textarea
              className="cyber-input min-h-[100px]"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-cyber-muted">Priority</label>
              <select
                className="cyber-input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {['low', 'medium', 'high'].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Audience</label>
              <select
                className="cyber-input"
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
              >
                <option value="ward_only">Ward Only</option>
                <option value="llg">LLG Wide</option>
                <option value="provincial">Provincial</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} className="cyber-btn-primary w-full">
            {saving ? 'Publishing…' : 'Publish'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
