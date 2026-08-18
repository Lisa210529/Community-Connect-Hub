import { firestoreService } from '../services/firestoreService';
import { matchesWard } from './wdcHelpers';

export const ANNOUNCEMENT_NOTIFICATION_TYPES = new Set([
  'announcement',
  'funding_approved',
  'ward_notice',
]);

export function isAnnouncementVisibleToUser(announcement, user) {
  if (announcement?.isActive === false) return false;

  const audience = String(announcement?.targetAudience ?? 'ward_only').toLowerCase();
  if (audience === 'provincial' || audience === 'llg') return true;
  if (announcement?.ward === 'All Wards') return true;

  if (audience === 'all' || audience === 'residents' || audience === 'public') {
    return matchesWard(announcement, user) || !announcement?.wardId;
  }

  return matchesWard(announcement, user);
}

export function notificationToAnnouncementFallback(notification, user) {
  return {
    id: `notif_${notification.id}`,
    title: notification.title,
    content: notification.message,
    priority: notification.type === 'funding_approved' ? 'high' : 'medium',
    createdAt: notification.createdAt,
    createdBy: 'Community Connect Hub',
    ward: user?.ward ?? '',
    wardId: notification.wardId ?? user?.wardId,
    targetAudience: 'residents',
    isActive: true,
    isNotificationFallback: true,
    notificationId: notification.id,
  };
}

export function getNotificationRoute(notification) {
  if (notification?.announcementId) {
    return `/announcements?open=${notification.announcementId}`;
  }
  if (ANNOUNCEMENT_NOTIFICATION_TYPES.has(notification?.type)) {
    return `/announcements?open=notif_${notification.id}`;
  }
  if (notification?.type === 'letter_ready') return '/requests';
  if (notification?.type === 'project_rating') return '/projects';
  return '/announcements';
}

export async function notifyResidentsOfAnnouncement(announcement, { wardId, ward, type = 'announcement' }) {
  const residents = await firestoreService.findResidentsByWard(wardId, ward);
  await Promise.all(
    residents.map((r) =>
      firestoreService.createNotification({
        userId: r.uid ?? r.id,
        type,
        title: announcement.title,
        message: announcement.content,
        wardId: announcement.wardId ?? wardId,
        announcementId: announcement.id,
      }).catch(() => null),
    ),
  );
}
