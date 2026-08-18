import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from './firebase';
import { firestoreService } from './firestoreService';
import { updateUserData } from './authService';

const VAPID_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY
  ?? import.meta.env.VITE_FIREBASE_VAPID_KEY
  ?? '';

/**
 * Notification service — Firestore in-app + Firebase Cloud Messaging (browser push).
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

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

export async function requestNotificationPermission(userId) {
  try {
    if (!(await isSupported())) {
      console.warn('FCM not supported in this browser.');
      return null;
    }
    if (!VAPID_KEY) {
      console.warn('Missing VITE_VAPID_PUBLIC_KEY — add to .env and Firebase Console Web Push certificates.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    await registerServiceWorker();
    const messaging = getMessaging(app);
    const registration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token && userId) {
      await updateUserData(userId, {
        fcmToken: token,
        pushEnabled: true,
        pushUpdatedAt: new Date().toISOString(),
      });
    }

    return token;
  } catch (err) {
    console.warn('Push notification setup failed:', err.message);
    return null;
  }
}

/** @deprecated Use requestNotificationPermission */
export async function registerPushToken(userId) {
  return requestNotificationPermission(userId);
}

export async function subscribeToForegroundMessages(callback) {
  if (!(await isSupported())) return () => {};
  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
}

export function onMessageListener() {
  return new Promise((resolve) => {
    subscribeToForegroundMessages((payload) => resolve(payload));
  });
}

export const notificationService = {
  sendNotification,
  sendProjectApprovalNotification,
  getNotifications,
  markAsRead,
  registerServiceWorker,
  requestNotificationPermission,
  registerPushToken,
  subscribeToForegroundMessages,
  onMessageListener,
};
