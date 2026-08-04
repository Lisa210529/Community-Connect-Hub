/**
 * Firebase web app configuration.
 * Override values via Vite env vars (see .env.example).
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyDl3sy-4FAYh1e7tKg3MO3wKlxR9LhzM-k',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'community-connecthub.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'community-connecthub',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'community-connecthub.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '808276472946',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:808276472946:web:350f83cdd6a84612af3eeb',
};

export const emulatorConfig = {
  authUrl: import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL ?? 'http://localhost:9099',
  firestoreHost: import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST ?? 'localhost',
  firestorePort: Number(import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT ?? 8081),
};
