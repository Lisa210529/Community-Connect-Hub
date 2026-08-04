// =============================================
// FIREBASE CONFIG — Community Connect Hub
// Project: community-connecthub
// =============================================
//
// This matches your Firebase Web SDK configuration.
// The app uses the compat CDN (firebase.*) — same project, same keys.
//
// Production (real Auth + Firestore): open http://localhost:3000
// Local emulators (offline dev):      http://localhost:3000?emulators=1
//   or: localStorage.setItem('useFirebaseEmulators', 'true') then refresh
//
const firebaseConfig = {
    apiKey: "AIzaSyDl3sy-4FAYh1e7tKg3MO3wKlxR9LhzM-k",
    authDomain: "community-connecthub.firebaseapp.com",
    projectId: "community-connecthub",
    storageBucket: "community-connecthub.firebasestorage.app",
    messagingSenderId: "808276472946",
    appId: "1:808276472946:web:350f83cdd6a84612af3eeb"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

function shouldUseEmulators() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('emulators') === '1') return true;
    if (params.get('emulators') === '0') return false;
    return localStorage.getItem('useFirebaseEmulators') === 'true';
}

const USE_EMULATORS = shouldUseEmulators();

if (USE_EMULATORS) {
    db.useEmulator('localhost', 8081);
    auth.useEmulator('http://localhost:9099');
    console.log('🟢 Firebase: LOCAL EMULATORS (Auth :9099, Firestore :8081)');
    console.log('   Tip: run firebase emulators:start && node seed-emulator.js');
} else {
    console.log('🌐 Firebase: PRODUCTION — community-connecthub');
    console.log('   Auth domain:', firebaseConfig.authDomain);
    console.log('   For offline dev add ?emulators=1 to the URL');
}

console.log('🚀 Community Connect Hub loaded');
