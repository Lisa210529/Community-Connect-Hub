import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig, emulatorConfig } from '../config/firebase.config';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

function shouldUseEmulators() {
  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') return true;
  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'false') return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get('emulators') === '1') return true;
  if (params.get('emulators') === '0') return false;

  return localStorage.getItem('useFirebaseEmulators') === 'true';
}

export const USE_EMULATORS = shouldUseEmulators();

if (USE_EMULATORS) {
  connectAuthEmulator(auth, emulatorConfig.authUrl, { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorConfig.firestoreHost, emulatorConfig.firestorePort);
  connectStorageEmulator(storage, 'localhost', 9199);
  console.info('Firebase: LOCAL EMULATORS');
} else {
  console.info('Firebase: PRODUCTION —', firebaseConfig.projectId);
}

export default app;
