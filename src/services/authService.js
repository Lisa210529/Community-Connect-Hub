import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  deleteUser,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  getDoc,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
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

/** Validate NID against Firestore nids collection (3NF lookup). */
export async function validateNidFromFirestore(nidNumber) {
  if (!/^\d{10}$/.test(nidNumber)) {
    return {
      valid: false,
      message: 'NID must be exactly 10 digits (e.g., 1234567890).',
    };
  }

  const snapshot = await getDoc(doc(db, 'nids', nidNumber));
  if (!snapshot.exists()) {
    return {
      valid: false,
      message: 'NID not found. Please check your number or contact your LLG office.',
    };
  }

  const nidData = snapshot.data();
  if (nidData.status !== 'active') {
    return {
      valid: false,
      message: 'This NID is not active. Please contact your LLG office.',
    };
  }

  return {
    valid: true,
    message: `NID verified: ${nidData.name} (Ward ${nidData.ward})`,
    userData: nidData,
  };
}

/** Resolve wardId from NID ward number. */
export async function resolveWardIdFromNid(nidData) {
  const wardNumber = String(nidData.ward);
  const snapshot = await getDocs(
    query(collection(db, 'wards'), where('wardNumber', '==', wardNumber), limit(1)),
  );

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  const pilotWard = await getDoc(doc(db, 'wards', 'ward_5'));
  if (pilotWard.exists()) {
    return 'ward_5';
  }

  return null;
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
  const { userId, role, firstName, lastName, nid } = profile;

  const nidValidation = await validateNidFromFirestore(nid);
  if (!nidValidation.valid) {
    throw new Error(nidValidation.message);
  }

  const existingUserId = await getDoc(doc(db, 'users', userId));
  if (existingUserId.exists()) {
    throw new Error('This User ID is already registered. Please login or use a different ID.');
  }

  const wardId = await resolveWardIdFromNid(nidValidation.userData);
  if (!wardId) {
    throw new Error('Could not resolve ward for this NID. Please contact your LLG office.');
  }

  let authUser = null;

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    authUser = credential.user;

    if (await isNidAlreadyRegistered(nid)) {
      throw new Error('This NID is already registered. Each resident may only register once.');
    }

    const isResident = role === 'resident';

    await setDoc(doc(db, 'users', userId), {
      userId,
      firstName,
      lastName,
      email,
      nid,
      role,
      wardId,
      uid: authUser.uid,
      isApproved: isResident,
      isActive: true,
      mfaEnabled: false,
      mfaSmsEnabled: false,
      mfaTotpEnabled: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await signOut(auth);
    return authUser;
  } catch (error) {
    if (authUser) {
      try {
        await deleteUser(authUser);
      } catch {
        // Auth account may need recent sign-in to delete; admin cleanup if needed
      }
    }
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please login instead.');
    }
    throw error;
  }
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
