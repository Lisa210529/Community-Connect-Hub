/* Firebase Cloud Messaging service worker (background push) */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDl3sy-4FAYh1e7tKg3MO3wKlxR9LhzM-k',
  authDomain: 'community-connecthub.firebaseapp.com',
  projectId: 'community-connecthub',
  storageBucket: 'community-connecthub.firebasestorage.app',
  messagingSenderId: '808276472946',
  appId: '1:808276472946:web:350f83cdd6a84612af3eeb',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? payload.data?.title ?? 'Community Connect Hub';
  const options = {
    body: payload.notification?.body ?? payload.data?.body ?? '',
    icon: '/favicon.svg',
    data: payload.data ?? {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? '/';
  event.waitUntil(clients.openWindow(target));
});
