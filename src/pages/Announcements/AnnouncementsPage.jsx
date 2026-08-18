import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole } from '../../constants/roleMapping';
import { addItem } from '../../services/localStorageService';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';
import StatusBadge from '../../components/ui/StatusBadge';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
import Modal from '../../components/ui/Modal';
import {
  ANNOUNCEMENT_NOTIFICATION_TYPES,
  isAnnouncementVisibleToUser,
  notificationToAnnouncementFallback,
} from '../../utils/announcementNotifications';
import { resolveWardId } from '../../utils/wdcHelpers';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const wardId = resolveWardId(user);
  const userId = user?.uid ?? user?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get('open');

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
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'medium',
    targetAudience: 'ward_only',
    ward: user?.ward ?? 'Ward 5 Nabasa',
  });

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loadHybridCollection('announcements', () =>
        firestoreService.getAnnouncements(),
      );

      let items = result.data.filter((a) => isAnnouncementVisibleToUser(a, user));

      if (userId && !canPost) {
        const notifications = await firestoreService.getNotifications(userId);
        const linkedIds = new Set(
          items.map((a) => a.id).concat(
            notifications.map((n) => n.announcementId).filter(Boolean),
          ),
        );

        notifications
          .filter((n) => ANNOUNCEMENT_NOTIFICATION_TYPES.has(n.type) && !n.announcementId)
          .forEach((notification) => {
            const fallbackId = `notif_${notification.id}`;
            if (!linkedIds.has(fallbackId)) {
              items.push(notificationToAnnouncementFallback(notification, user));
            }
          });
      }

      items.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
      setAnnouncements(items);
      setDataSource(result.dataSource);
    } catch (err) {
      setError(err.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, [user, userId, canPost]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const visibleAnnouncements = useMemo(
    () => announcements.filter((a) => a.isActive !== false),
    [announcements],
  );

  useEffect(() => {
    if (!openId || loading) return;
    const match = visibleAnnouncements.find((a) => a.id === openId);
    if (match) {
      setSelectedAnnouncement(match);
    }
  }, [openId, loading, visibleAnnouncements]);

  function openAnnouncement(announcement) {
    setSelectedAnnouncement(announcement);
    setSearchParams({ open: announcement.id });
  }

  function closeAnnouncement() {
    setSelectedAnnouncement(null);
    setSearchParams({});
  }

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
      wardId: wardId || user?.wardId || '',
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
          <p className="text-cyber-muted text-sm">
            Community notices and ward updates from your councillor and funding alerts
          </p>
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
      ) : visibleAnnouncements.length === 0 ? (
        <p className="text-cyber-muted text-sm">No active announcements.</p>
      ) : (
        <div className="space-y-3">
          {visibleAnnouncements.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => openAnnouncement(a)}
              className={`cyber-card w-full text-left hover:border-cyber-accent/40 transition-colors ${
                openId === a.id ? 'border-cyber-accent/50 ring-1 ring-cyber-accent/20' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{a.title}</h3>
                <StatusBadge status={a.priority} />
              </div>
              <p className="text-cyber-muted text-sm line-clamp-2">{a.content}</p>
              <p className="text-xs text-cyber-muted mt-3">
                {a.createdBy} · {a.ward} · {formatDate(a.createdAt)}
              </p>
              <p className="text-xs text-cyber-accent mt-2">Click to view full announcement</p>
            </button>
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

      <Modal open={!!selectedAnnouncement} onClose={closeAnnouncement} title="Announcement" wide>
        {selectedAnnouncement && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-cyber-text">{selectedAnnouncement.title}</h2>
              <StatusBadge status={selectedAnnouncement.priority} />
            </div>
            <p className="text-sm text-cyber-muted whitespace-pre-wrap">{selectedAnnouncement.content}</p>
            <div className="text-xs text-cyber-muted border-t border-slate-border pt-3">
              <p>Posted by {selectedAnnouncement.createdBy}</p>
              <p>
                {selectedAnnouncement.ward} · {formatDate(selectedAnnouncement.createdAt)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
