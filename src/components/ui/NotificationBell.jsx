import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { firestoreService } from '../../services/firestoreService';
import {
  getNotificationRoute,
} from '../../utils/announcementNotifications';
import {
  requestNotificationPermission,
  subscribeToForegroundMessages,
} from '../../services/notificationService';

function formatWhen(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-PG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.uid ?? user?.id;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [pushToast, setPushToast] = useState('');
  const panelRef = useRef(null);
  const pushRegistered = useRef(false);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const items = await firestoreService.getNotifications(userId);
      setNotifications(items);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!userId || pushRegistered.current) return;
    pushRegistered.current = true;

    requestNotificationPermission(userId).catch(() => null);

    let unsubscribe = () => {};
    subscribeToForegroundMessages((payload) => {
      const title = payload.notification?.title ?? 'New notification';
      setPushToast(title);
      loadNotifications();
      setTimeout(() => setPushToast(''), 4000);
    }).then((unsub) => {
      unsubscribe = unsub ?? (() => {});
    });

    return () => unsubscribe();
  }, [userId, loadNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) await loadNotifications();
  }

  async function markRead(notification) {
    if (notification.read) return;
    try {
      await firestoreService.markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  }

  async function handleNotificationClick(notification) {
    await markRead(notification);
    setOpen(false);
    navigate(getNotificationRoute(notification));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!userId) return null;

  return (
    <div className="relative" ref={panelRef}>
      {pushToast && (
        <div className="absolute right-0 top-full mt-1 z-50 px-3 py-2 rounded-lg bg-primary text-background text-xs shadow-lg whitespace-nowrap">
          {pushToast}
        </div>
      )}
      <button
        type="button"
        onClick={handleOpen}
        className="relative p-2 rounded-lg border border-border text-text-secondary hover:text-primary hover:border-primary transition-colors"
        aria-label="Notifications"
      >
        <i className="fas fa-bell text-lg" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-background text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-card shadow-xl z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-text-primary">Notifications</p>
            {unreadCount > 0 && (
              <p className="text-xs text-text-secondary mt-0.5">{unreadCount} unread</p>
            )}
          </div>

          {loading ? (
            <p className="px-4 py-6 text-sm text-text-secondary animate-pulse">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-text-secondary">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 hover:bg-background transition-colors ${
                      notification.read ? 'opacity-70' : 'bg-primary/5'
                    }`}
                  >
                    <p className="text-sm font-medium text-text-primary">{notification.title}</p>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-text-secondary mt-2">
                      {formatWhen(notification.createdAt)}
                    </p>
                    <p className="text-[10px] text-primary mt-1">
                      {getNotificationRoute(notification).startsWith('/announcements')
                        ? 'Tap to view in Announcements'
                        : 'Tap to view details'}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
