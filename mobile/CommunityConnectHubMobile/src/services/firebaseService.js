import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export async function loginUser(email, password) {
  const credential = await auth().signInWithEmailAndPassword(email.trim(), password);
  const doc = await firestore().collection('users').doc(credential.user.uid).get();
  return { uid: credential.user.uid, email: credential.user.email, ...doc.data() };
}

export async function registerUser({ email, password, fullName, nid, phone, ward, wardId }) {
  const credential = await auth().createUserWithEmailAndPassword(email.trim(), password);
  const uid = credential.user.uid;
  const profile = {
    uid,
    email: email.trim(),
    fullName,
    name: fullName,
    nid,
    phone,
    ward,
    wardId: wardId ?? ward,
    role: 'resident',
    isApproved: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  await firestore().collection('users').doc(uid).set(profile);
  return profile;
}

export async function logoutUser() {
  await auth().signOut();
}

export async function getProjects(wardId) {
  let query = firestore().collection('projects');
  if (wardId) query = query.where('wardId', '==', wardId);
  const snapshot = await query.limit(50).get();
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAnnouncements(wardId) {
  let query = firestore().collection('announcements');
  if (wardId) query = query.where('wardId', '==', wardId);
  const snapshot = await query.limit(30).get();
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getRequests(residentId) {
  const snapshot = await firestore()
    .collection('requests')
    .where('residentId', '==', residentId)
    .limit(30)
    .get();
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getProject(projectId) {
  const doc = await firestore().collection('projects').doc(projectId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function createRequest(data) {
  const ref = firestore().collection('requests').doc();
  const payload = {
    ...data,
    id: ref.id,
    createdAt: data.createdAt ?? new Date().toISOString(),
    status: data.status ?? 'Pending',
  };
  await ref.set(payload);
  return payload;
}

export async function hasResidentRatedProject(residentId, projectId) {
  const snapshot = await firestore()
    .collection('ratings')
    .where('residentId', '==', residentId)
    .where('projectId', '==', projectId)
    .limit(1)
    .get();
  return !snapshot.empty;
}

export async function getRatingsByResident(residentId) {
  const snapshot = await firestore()
    .collection('ratings')
    .where('residentId', '==', residentId)
    .limit(30)
    .get();
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createRating(data) {
  const ref = firestore().collection('ratings').doc();
  const payload = { ...data, id: ref.id, createdAt: new Date().toISOString() };
  await ref.set(payload);
  return payload;
}
