import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { collection, query, where, limit, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * Look up a user profile in Firestore by email.
 */
export async function getUserProfileByEmail(email) {
  const snapshot = await getDocs(
    query(collection(db, 'users'), where('email', '==', email), limit(1)),
  );
  if (snapshot.empty) return null;
  const userDoc = snapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() };
}

/** Returns true if this NID is already linked to a registered user. */
export async function isNidAlreadyRegistered(nidNumber) {
  const snapshot = await getDocs(
    query(collection(db, 'users'), where('nid', '==', nidNumber), limit(1)),
  );
  return !snapshot.empty;
}

/** Gate system access using the Firestore profile (after Auth password check). */
export function canAccessSystem(userProfile) {
  if (!userProfile) {
    return { allowed: false, message: 'Account not found in the system. Please register first.' };
  }
  if (!userProfile.isApproved) {
    return { allowed: false, message: 'Your account is pending approval. Please contact support.' };
  }
  if (!userProfile.isActive) {
    return { allowed: false, message: 'Your account is inactive. Please contact support.' };
  }
  return { allowed: true };
}

export async function registerUser({ email, password, profile }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', credential.user.uid), {
    ...profile,
    email,
    uid: credential.user.uid,
    isApproved: false,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return credential.user;
}

export async function loginUser(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfileByEmail(email);
  const access = canAccessSystem(profile);
  if (!access.allowed) {
    await signOut(auth);
    throw new Error(access.message);
  }
  return { user: credential.user, profile };
}

export async function logoutUser() {
  await signOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}
