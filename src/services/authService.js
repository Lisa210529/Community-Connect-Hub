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
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { normalizeRole } from '../constants/roleMapping';

function mapAuthError(error) {
  const code = error?.code ?? '';
  const messages = {
    'auth/email-already-in-use': 'This email is already registered. Please login instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  };
  return new Error(messages[code] ?? error?.message ?? 'Authentication failed.');
}

function sanitizeFirestoreData(data) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
}

export function getNidFromData(data) {
  return data?.nid ?? data?.pid ?? '';
}

export function getRoleFromData(data) {
  const raw = data?.role ?? data?.userCategory ?? '';
  if (raw) return normalizeRole(raw);

  const position = String(data?.position ?? '').toLowerCase();
  if (position.includes('councillor') || position.includes('councilor')) {
    return 'councillor';
  }

  return 'resident';
}

export function normalizeProfile(uid, data) {
  const fullName =
    data.fullName ??
    data.nidVerifiedName ??
    [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
  const firstName = data.firstName ?? fullName.split(/\s+/)[0] ?? '';
  const lastName = data.lastName ?? fullName.split(/\s+/).slice(1).join(' ') ?? '';
  const nid = getNidFromData(data);
  const rawRole = data?.role ?? data?.userCategory ?? '';
  const role = getRoleFromData(data);

  return {
    id: uid,
    uid: data.uid ?? uid,
    email: data.email ?? '',
    nid,
    pid: nid,
    role,
    rawRole: data.rawRole ?? (rawRole !== role ? rawRole : null),
    firstName,
    lastName,
    name: fullName || `${firstName} ${lastName}`.trim(),
    phone: data.phone ?? '',
    ward: data.ward ?? (data.wardNumber ? `Ward ${data.wardNumber}` : ''),
    wardId: data.wardId ?? '',
    wardNumber: data.wardNumber ?? '',
    province: data.province ?? '',
    district: data.district ?? '',
    llg: data.llg ?? '',
    position: data.position ?? '',
    isApproved: Boolean(data.isApproved),
    isRegistered: data.isRegistered !== false,
    isActive: data.isActive !== false,
    mfaEnabled: Boolean(data.mfaEnabled),
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? '',
    registeredAt: data.registeredAt?.toDate?.()?.toISOString?.() ?? data.registeredAt ?? '',
  };
}

async function rollbackAuthUser(authUser) {
  if (!authUser) return;
  try {
    await deleteUser(authUser);
  } catch {
    // May require recent sign-in; admin cleanup if needed
  }
}

export async function getUserData(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return normalizeProfile(uid, snap.data());
}

export async function findUserByNid(nid) {
  const normalized = String(nid ?? '').replace(/\s/g, '');
  const usersRef = collection(db, 'users');
  const byNid = await getDocs(query(usersRef, where('nid', '==', normalized), limit(1)));
  if (!byNid.empty) {
    const userDoc = byNid.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  }
  const byPid = await getDocs(query(usersRef, where('pid', '==', normalized), limit(1)));
  if (!byPid.empty) {
    const userDoc = byPid.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  }
  return null;
}

export async function checkNIDExists(nid) {
  return Boolean(await findUserByNid(nid));
}

/** Official signup: allow retry when a failed attempt left a profile with the same email */
async function assessOfficialNidAvailability(nid, email) {
  const normalizedNid = String(nid ?? '').replace(/\s/g, '');
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findUserByNid(normalizedNid);

  if (!existing) {
    return { allowed: true };
  }

  const existingEmail = (existing.email ?? '').toLowerCase();
  if (existingEmail !== normalizedEmail) {
    return { allowed: false, message: 'NID already registered.' };
  }

  const record = await getPreRegRecord(normalizedNid, normalizedEmail);
  if (!record) {
    return {
      allowed: false,
      message: 'This account is already registered. Please login instead.',
    };
  }

  return { allowed: true, record, needsRecovery: true, existingUser: existing };
}

async function removeStaleOfficialProfiles(authUid, email, nid) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedNid = String(nid ?? '').replace(/\s/g, '');
  try {
    const snapshot = await getDocs(
      query(collection(db, 'users'), where('nid', '==', normalizedNid)),
    );

    await Promise.all(
      snapshot.docs
        .filter((userDoc) => userDoc.id !== authUid)
        .filter((userDoc) => (userDoc.data().email ?? '').toLowerCase() === normalizedEmail)
        .map((userDoc) => deleteDoc(doc(db, 'users', userDoc.id))),
    );
  } catch {
    // Non-fatal: registration can still proceed if cleanup is blocked
  }
}

function buildOfficialUserPayload(authUser, record, normalizedNid, normalizedEmail) {
  const nameParts = record.fullName.trim().split(/\s+/);
  const rawRole = record.role;
  const role = normalizeRole(rawRole);

  return sanitizeFirestoreData({
    uid: authUser.uid,
    userId: authUser.uid,
    fullName: record.fullName,
    firstName: nameParts[0] ?? '',
    lastName: nameParts.slice(1).join(' '),
    email: normalizedEmail,
    nid: normalizedNid,
    pid: normalizedNid,
    phone: record.phone ?? '',
    role,
    rawRole: record.rawRole || rawRole || null,
    userCategory: rawRole,
    position: record.position ?? '',
    ward: record.ward ?? '',
    wardId: record.wardId ?? '',
    wardNumber: record.wardNumber ?? '',
    province: record.province ?? 'Madang',
    district: record.district ?? '',
    llg: record.llg ?? '',
    isApproved: true,
    isRegistered: true,
    isActive: true,
    mfaEnabled: false,
    createdAt: serverTimestamp(),
    registeredAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

async function rollbackOfficialRegistration(authUser, createdAuth) {
  if (!authUser) return;
  try {
    await deleteDoc(doc(db, 'users', authUser.uid));
  } catch {
    // Profile may not exist yet
  }
  if (createdAuth) {
    await rollbackAuthUser(authUser);
  } else {
    await signOut(auth);
  }
}

export async function checkEmailExists(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const snapshot = await getDocs(
    query(collection(db, 'users'), where('email', '==', normalizedEmail), limit(1)),
  );
  return !snapshot.empty;
}

export async function checkNidInPreRegistered(nid) {
  const normalized = String(nid ?? '').replace(/\s/g, '');
  const snapshot = await getDocs(
    query(collection(db, 'preRegisteredUsers'), where('nid', '==', normalized), limit(1)),
  );
  return !snapshot.empty;
}

export async function checkEmailInPreRegistered(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const snapshot = await getDocs(
    query(collection(db, 'preRegisteredUsers'), where('email', '==', normalizedEmail), limit(1)),
  );
  return !snapshot.empty;
}

/** Validate official signup against preRegisteredUsers */
export async function validateOfficialRegistration({ nid, email }) {
  const normalized = String(nid ?? '').replace(/\s/g, '');
  if (!/^\d{10}$/.test(normalized)) {
    return { valid: false, message: 'NID must be exactly 10 digits.' };
  }

  const nidCheck = await assessOfficialNidAvailability(normalized, email);
  if (!nidCheck.allowed) {
    return { valid: false, message: nidCheck.message };
  }

  const record = nidCheck.record ?? (await getPreRegRecord(normalized, email));
  if (!record) {
    return {
      valid: false,
      message: 'You are not pre-registered. Please contact your administrator.',
    };
  }

  return { valid: true, record, needsRecovery: Boolean(nidCheck.needsRecovery) };
}

export async function getPreRegRecord(nid, email) {
  const normalized = String(nid ?? '').replace(/\s/g, '');
  const normalizedEmail = email.trim().toLowerCase();
  const snapshot = await getDocs(
    query(collection(db, 'preRegisteredUsers'), where('nid', '==', normalized), limit(1)),
  );
  if (snapshot.empty) return null;
  const record = { id: snapshot.docs[0].id, preRegId: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  if (record.email?.toLowerCase() !== normalizedEmail) return null;
  if (record.isRegistered) return null;
  return record;
}

export function canAccessSystem(profile) {
  if (!profile) {
    return { allowed: false, message: 'User account not found in system. Please contact administrator.' };
  }
  if (profile.isActive === false) {
    return { allowed: false, message: 'Your account has been deactivated. Please contact administrator.' };
  }
  if (profile.isApproved === false) {
    return {
      allowed: false,
      message: 'Your account is pending approval. Please wait for admin approval.',
    };
  }
  return { allowed: true };
}

/** Register user — stores nid, pid, userCategory, role in Firestore */
export async function registerUser(userData) {
  const normalizedNid = String(userData.nid ?? '').replace(/\s/g, '');
  const normalizedEmail = userData.email.trim().toLowerCase();
  const role = userData.role || 'resident';

  if (!/^\d{10}$/.test(normalizedNid)) {
    throw new Error('NID must be exactly 10 digits');
  }
  if (await checkNIDExists(normalizedNid)) {
    throw new Error('NID already registered. Please use a different NID.');
  }
  if (role === 'resident' && (await checkNidInPreRegistered(normalizedNid))) {
    throw new Error('You are a pre-registered official. Please use the official registration page.');
  }
  if (await checkEmailExists(normalizedEmail)) {
    throw new Error('Email already registered. Please use a different email.');
  }

  let authUser = null;
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      userData.password,
    );
    authUser = credential.user;

    const firstName = userData.firstName?.trim() ?? '';
    const lastName = userData.lastName?.trim() ?? '';
    const fullName =
      userData.fullName?.trim() || `${firstName} ${lastName}`.trim();
    const isResident = role === 'resident';

    await setDoc(doc(db, 'users', authUser.uid), {
      uid: authUser.uid,
      userId: authUser.uid,
      firstName,
      lastName,
      fullName,
      email: normalizedEmail,
      nid: normalizedNid,
      pid: normalizedNid,
      phone: userData.phone || '',
      role,
      userCategory: role,
      wardId: userData.wardId || '',
      wardNumber: userData.wardNumber || '',
      ward: userData.ward || (userData.wardNumber ? `Ward ${userData.wardNumber}` : ''),
      province: userData.province || 'Madang',
      district: userData.district || 'Madang',
      llg: userData.llg || 'Madang Urban',
      isApproved: !isResident,
      isRegistered: true,
      isActive: true,
      mfaEnabled: false,
      createdAt: serverTimestamp(),
      registeredAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await signOut(auth);
    return { user: authUser, role, needsApproval: isResident };
  } catch (error) {
    await rollbackAuthUser(authUser);
    if (error.code?.startsWith('auth/')) throw mapAuthError(error);
    throw error;
  }
}

export async function registerResidentUser(userData) {
  return registerUser({ ...userData, role: 'resident' });
}

export async function registerOfficialUser({ email, nid, password }) {
  const normalizedNid = String(nid ?? '').replace(/\s/g, '');
  const normalizedEmail = email.trim().toLowerCase();

  if (!/^\d{10}$/.test(normalizedNid)) {
    throw new Error('NID must be exactly 10 digits.');
  }

  const nidCheck = await assessOfficialNidAvailability(normalizedNid, normalizedEmail);
  if (!nidCheck.allowed) {
    throw new Error(nidCheck.message);
  }

  const record = nidCheck.record ?? (await getPreRegRecord(normalizedNid, normalizedEmail));
  if (!record) {
    throw new Error('You are not pre-registered. Please contact your administrator.');
  }

  let authUser = null;
  let createdAuth = false;

  try {
    let credential;
    try {
      credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      authUser = credential.user;
      createdAuth = true;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        authUser = credential.user;
      } else {
        throw error;
      }
    }

    await removeStaleOfficialProfiles(authUser.uid, normalizedEmail, normalizedNid);

    await setDoc(
      doc(db, 'users', authUser.uid),
      buildOfficialUserPayload(authUser, record, normalizedNid, normalizedEmail),
      { merge: true },
    );

    await updateDoc(doc(db, 'preRegisteredUsers', record.id), {
      isRegistered: true,
      registeredAt: serverTimestamp(),
      completedAt: serverTimestamp(),
    });

    await signOut(auth);
    return {
      uid: authUser.uid,
      needsApproval: false,
      role: normalizeRole(record.role),
      rawRole: record.rawRole || record.role || null,
    };
  } catch (error) {
    await rollbackOfficialRegistration(authUser, createdAuth);
    if (error.code?.startsWith('auth/')) throw mapAuthError(error);
    console.error('Error saving official user data:', error);
    throw new Error(
      error.message?.includes('invalid data')
        ? 'Unable to save your profile. Please try again or contact your administrator.'
        : error.message ?? 'Registration failed. Please try again.',
    );
  }
}

export async function loginUser(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const profile = await getUserData(credential.user.uid);
    if (profile) {
      profile.role = normalizeRole(profile.role);
    }
    const access = canAccessSystem(profile);
    if (!access.allowed) {
      await signOut(auth);
      throw new Error(access.message);
    }
    return { firebaseUser: credential.user, profile, ...profile };
  } catch (error) {
    if (error.code?.startsWith('auth/')) throw mapAuthError(error);
    throw error;
  }
}

export async function normalizeAllUserRoles() {
  const snapshot = await getDocs(collection(db, 'users'));
  const updates = [];

  snapshot.forEach((userDoc) => {
    const data = userDoc.data();
    const normalized = normalizeRole(data.role);
    if (normalized && normalized !== data.role) {
      updates.push(
        updateDoc(userDoc.ref, {
          role: normalized,
          rawRole: data.rawRole ?? data.role,
          updatedAt: serverTimestamp(),
        }),
      );
    }
  });

  await Promise.all(updates);
  return updates.length;
}

export async function updateUserData(uid, data) {
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (data.firstName || data.lastName) {
    payload.fullName = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim();
  }
  await updateDoc(doc(db, 'users', uid), payload);
  return getUserData(uid);
}

export const updateUserProfile = updateUserData;

export async function getAllUsers() {
  return fetchAllUsers();
}

export async function fetchAllUsers() {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs
    .map((d) => normalizeProfile(d.id, d.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPendingUsers() {
  return fetchPendingResidents();
}

export async function fetchPendingResidents() {
  const snapshot = await getDocs(
    query(collection(db, 'users'), where('isApproved', '==', false)),
  );
  return snapshot.docs
    .map((d) => normalizeProfile(d.id, d.data()))
    .filter((u) => u.role === 'resident')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function approveUser(uid, adminUid) {
  await updateDoc(doc(db, 'users', uid), {
    isApproved: true,
    isActive: true,
    approvedBy: adminUid ?? '',
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function rejectUser(uid, reason = '') {
  await updateDoc(doc(db, 'users', uid), {
    isApproved: false,
    isActive: false,
    rejectionReason: reason,
    rejectedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function setUserActive(uid, isActive) {
  await updateDoc(doc(db, 'users', uid), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}

export async function preRegisterOfficial(payload, adminUid) {
  const normalizedNid = String(payload.nid ?? '').replace(/\s/g, '');
  if (!/^\d{10}$/.test(normalizedNid)) {
    throw new Error('NID must be exactly 10 digits.');
  }
  if (await checkNIDExists(normalizedNid)) {
    throw new Error('NID already registered to a user.');
  }
  if (await checkNidInPreRegistered(normalizedNid)) {
    throw new Error('NID already in pre-registration list.');
  }
  if (await checkEmailInPreRegistered(payload.email)) {
    throw new Error('Email already in pre-registration list.');
  }

  const wardNumber = payload.ward?.match(/\d+/)?.[0] ?? payload.wardNumber ?? '';
  const wardId = payload.wardId ?? (wardNumber ? `ward_${wardNumber}` : '');
  const preRegRef = doc(collection(db, 'preRegisteredUsers'));

  await setDoc(preRegRef, {
    preRegId: preRegRef.id,
    fullName: payload.fullName.trim(),
    email: payload.email.trim().toLowerCase(),
    nid: normalizedNid,
    role: payload.role,
    position: payload.position?.trim() ?? '',
    ward: payload.ward?.trim() ?? '',
    wardId,
    wardNumber,
    province: payload.province ?? 'Madang Province',
    district: payload.district ?? 'Madang District',
    llg: payload.llg ?? 'Madang Urban',
    isRegistered: false,
    createdBy: adminUid ?? '',
    createdAt: serverTimestamp(),
  });
  return { id: preRegRef.id, preRegId: preRegRef.id, ...payload, nid: normalizedNid };
}

export async function fetchPreRegisteredUsers() {
  const snapshot = await getDocs(collection(db, 'preRegisteredUsers'));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
      const bTime = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
      return bTime - aTime;
    });
}

export async function logoutUser() {
  await signOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email.trim());
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (!user) {
        resolve(null);
        return;
      }
      try {
        const profile = await getUserData(user.uid);
        if (profile?.isApproved && profile?.isActive) {
          resolve({ ...user, ...profile });
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    });
  });
}

export async function getUserProfileByEmail(email) {
  const snapshot = await getDocs(
    query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()), limit(1)),
  );
  if (snapshot.empty) return null;
  const userDoc = snapshot.docs[0];
  return normalizeProfile(userDoc.id, userDoc.data());
}

export async function isNidAlreadyRegistered(nid) {
  return checkNIDExists(nid);
}
