import { firestoreService } from './firestoreService';

/**
 * Notification service — Firestore in-app notifications with optional FCM hook.
 * Browser push requires HTTPS, service worker, and Firebase Cloud Messaging setup.
 */
export async function sendNotification({ userId, type, title, message, ...meta }) {
  return firestoreService.createNotification({
    userId,
    type,
    title,
    message,
    ...meta,
  });
}

export async function sendProjectApprovalNotification({ userId, projectName, approved, comment = '' }) {
  return sendNotification({
    userId,
    type: approved ? 'project_approved' : 'project_rejected',
    title: approved ? 'Project Approved' : 'Project Rejected',
    message: `${projectName} was ${approved ? 'approved' : 'rejected'}.${comment ? ` ${comment}` : ''}`,
  });
}

export async function getNotifications(userId) {
  return firestoreService.getNotifications(userId);
}

export async function markAsRead(notificationId) {
  return firestoreService.markNotificationRead(notificationId);
}

/** Register FCM token when messaging is configured (optional — Spark plan: in-app only). */
export async function registerPushToken(userId) {
  try {
    const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
    const { app } = await import('./firebase');
    if (!(await isSupported())) return null;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (token && userId) {
      console.info('FCM token registered (store in user profile when profile update API is available).');
    }
    return token;
  } catch (err) {
    console.warn('FCM not available — using in-app notifications only:', err.message);
    return null;
  }
}

export const notificationService = {
  sendNotification,
  sendProjectApprovalNotification,
  getNotifications,
  markAsRead,
  registerPushToken,
};
