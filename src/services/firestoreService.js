import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { normalizeRole } from '../constants/roleMapping';
import { matchesWard } from '../utils/wdcHelpers';
import {
  getCollection as getLocalCollection,
  isDataMigrated,
  setDataMigrated,
} from './localStorageService';

const COLLECTIONS = {
  REQUESTS: 'requests',
  PROJECTS: 'projects',
  ANNOUNCEMENTS: 'announcements',
  MEETINGS: 'meetings',
  RESOLUTIONS: 'resolutions',
  COMMUNITY_NEEDS: 'communityNeeds',
  PROJECT_PROPOSALS: 'projectProposals',
  FUNDING_REQUESTS: 'fundingRequests',
  LETTERS: 'letters',
  FUNDING: 'funding',
  RATINGS: 'ratings',
  PROJECT_PHOTOS: 'projectPhotos',
  REPORTS: 'reports',
  COMPLAINTS: 'complaints',
  DOCUMENTS: 'documents',
  ACQUITTALS: 'acquittals',
};

const MIGRATABLE_COLLECTIONS = ['requests', 'projects', 'announcements', 'meetings', 'resolutions'];

const CREATE_FN_BY_COLLECTION = {
  requests: 'createRequest',
  projects: 'createProject',
  announcements: 'createAnnouncement',
  meetings: 'createMeeting',
  resolutions: 'createResolution',
};

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function serializeValue(value) {
  if (value == null) return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, serializeValue(nested)]),
    );
  }
  return value;
}

function normalizeDoc(snapshot) {
  return serializeValue({ id: snapshot.id, ...snapshot.data() });
}

function sanitizeForFirestore(data) {
  const payload = { ...data };
  delete payload.id;
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });
  return payload;
}

function extractWardId(item) {
  if (item?.wardId) {
    const digits = String(item.wardId).match(/\d+/)?.[0];
    return digits ? `ward_${digits}` : item.wardId;
  }
  const match = String(item?.ward ?? '').match(/\d+/);
  return match ? `ward_${match[0]}` : '';
}

function normalizeWardKey(value) {
  const digits = String(value ?? '').match(/\d+/)?.[0];
  return digits ? `ward_${digits}` : String(value ?? '').toLowerCase();
}

function mergeHybridRecords(firestoreItems, localItems) {
  const byKey = new Map();

  firestoreItems.forEach((item) => {
    byKey.set(item.localStorageId ?? item.id, item);
  });

  localItems.forEach((item) => {
    const key = item.id;
    if (!byKey.has(key)) {
      byKey.set(key, item);
    }
  });

  return Array.from(byKey.values());
}

function resolveDataSource(firestoreItems, localItems, firestoreError) {
  if (firestoreError) return 'localstorage';
  if (firestoreItems.length > 0 && localItems.length > 0) return 'mixed';
  if (firestoreItems.length > 0) return 'firestore';
  if (localItems.length > 0) return 'localstorage';
  return 'firestore';
}

export async function loadHybridCollection(collectionName, fetchFn) {
  const localItems = getLocalCollection(collectionName);
  let firestoreItems = [];
  let firestoreError = null;

  try {
    firestoreItems = await fetchFn();
  } catch (error) {
    firestoreError = error;
    console.error(`Firestore read failed for ${collectionName}:`, error);
  }

  const data = firestoreError
    ? localItems
    : mergeHybridRecords(firestoreItems, localItems);

  return {
    data,
    dataSource: resolveDataSource(firestoreItems, localItems, firestoreError),
  };
}

async function queryCollection(collectionName, wardId) {
  const ref = collection(db, collectionName);
  const snapshot = wardId
    ? await getDocs(query(ref, where('wardId', '==', wardId)))
    : await getDocs(ref);
  return snapshot.docs.map(normalizeDoc);
}

async function createWithOptionalId(collectionName, data, docId) {
  const payload = {
    ...sanitizeForFirestore(data),
    wardId: data.wardId || extractWardId(data),
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: serverTimestamp(),
  };

  if (docId) {
    await setDoc(doc(db, collectionName, docId), payload);
    return docId;
  }

  const ref = await addDoc(collection(db, collectionName), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

async function updateRecord(collectionName, id, data) {
  await updateDoc(doc(db, collectionName, id), {
    ...sanitizeForFirestore(data),
    updatedAt: serverTimestamp(),
  });
}

async function deleteRecord(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
}

export const firestoreService = {
  async getRequests(wardId) {
    return queryCollection(COLLECTIONS.REQUESTS, wardId);
  },

  async createRequest(data, docId) {
    return createWithOptionalId(COLLECTIONS.REQUESTS, data, docId);
  },

  async updateRequest(id, data) {
    return updateRecord(COLLECTIONS.REQUESTS, id, data);
  },

  async deleteRequest(id) {
    return deleteRecord(COLLECTIONS.REQUESTS, id);
  },

  async getProjects(wardId) {
    return queryCollection(COLLECTIONS.PROJECTS, wardId);
  },

  async createProject(data, docId) {
    return createWithOptionalId(COLLECTIONS.PROJECTS, data, docId);
  },

  async updateProject(id, data) {
    return updateRecord(COLLECTIONS.PROJECTS, id, data);
  },

  async deleteProject(id) {
    return deleteRecord(COLLECTIONS.PROJECTS, id);
  },

  async getAnnouncements(wardId) {
    return queryCollection(COLLECTIONS.ANNOUNCEMENTS, wardId);
  },

  async getAnnouncement(id) {
    if (!id) return null;
    const snapshot = await getDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id));
    if (!snapshot.exists()) return null;
    return normalizeDoc(snapshot);
  },

  async createAnnouncement(data, docId) {
    return createWithOptionalId(COLLECTIONS.ANNOUNCEMENTS, data, docId);
  },

  async updateAnnouncement(id, data) {
    return updateRecord(COLLECTIONS.ANNOUNCEMENTS, id, data);
  },

  async getMeetings(wardId) {
    return queryCollection(COLLECTIONS.MEETINGS, wardId);
  },

  async createMeeting(data, docId) {
    return createWithOptionalId(COLLECTIONS.MEETINGS, data, docId);
  },

  async updateMeeting(id, data) {
    return updateRecord(COLLECTIONS.MEETINGS, id, data);
  },

  async getResolutions(wardId) {
    return queryCollection(COLLECTIONS.RESOLUTIONS, wardId);
  },

  async getResolutionsByMeeting(meetingId) {
    if (!meetingId) return [];
    const ref = collection(db, COLLECTIONS.RESOLUTIONS);
    const snapshot = await getDocs(query(ref, where('meetingId', '==', meetingId), limit(30)));
    return snapshot.docs.map(normalizeDoc);
  },

  async createResolution(data, docId) {
    const payload = {
      ...data,
      status: data.status ?? 'Pending',
      votes: data.votes ?? { yes: data.votesFor ?? 0, no: data.votesAgainst ?? 0, abstain: 0 },
      votesFor: data.votesFor ?? data.votes?.yes ?? 0,
      votesAgainst: data.votesAgainst ?? data.votes?.no ?? 0,
    };
    return createWithOptionalId(COLLECTIONS.RESOLUTIONS, payload, docId);
  },

  async updateResolution(id, data) {
    const payload = { ...data };
    if (payload.votesFor != null || payload.votesAgainst != null) {
      payload.votes = {
        yes: payload.votesFor ?? payload.votes?.yes ?? 0,
        no: payload.votesAgainst ?? payload.votes?.no ?? 0,
        abstain: payload.votes?.abstain ?? 0,
      };
    }
    return updateRecord(COLLECTIONS.RESOLUTIONS, id, payload);
  },

  async getComplaints(wardId) {
    return queryCollection(COLLECTIONS.COMPLAINTS, wardId);
  },

  async createComplaint(data, docId) {
    return createWithOptionalId(COLLECTIONS.COMPLAINTS, data, docId);
  },

  async updateComplaint(id, data) {
    return updateRecord(COLLECTIONS.COMPLAINTS, id, data);
  },

  async getDocuments(wardId) {
    return queryCollection(COLLECTIONS.DOCUMENTS, wardId);
  },

  async createDocument(data, docId) {
    return createWithOptionalId(COLLECTIONS.DOCUMENTS, data, docId);
  },

  async getAcquittals(wardId) {
    return queryCollection(COLLECTIONS.ACQUITTALS, wardId);
  },

  async createAcquittal(data, docId) {
    const amountAllocated = Number(data.amountAllocated ?? 0);
    const amountSpent = Number(data.amountSpent ?? 0);
    return createWithOptionalId(COLLECTIONS.ACQUITTALS, {
      ...data,
      amountAllocated,
      amountSpent,
      balance: amountAllocated - amountSpent,
      status: data.status ?? 'Draft',
    }, docId);
  },

  async updateAcquittal(id, data) {
    const payload = { ...data };
    if (payload.amountAllocated != null || payload.amountSpent != null) {
      const allocated = Number(payload.amountAllocated ?? 0);
      const spent = Number(payload.amountSpent ?? 0);
      payload.balance = allocated - spent;
    }
    return updateRecord(COLLECTIONS.ACQUITTALS, id, payload);
  },

  async getCommunityNeeds(wardId) {
    return queryCollection(COLLECTIONS.COMMUNITY_NEEDS, wardId);
  },

  async createCommunityNeed(data, docId) {
    return createWithOptionalId(COLLECTIONS.COMMUNITY_NEEDS, data, docId);
  },

  async updateCommunityNeed(id, data) {
    return updateRecord(COLLECTIONS.COMMUNITY_NEEDS, id, data);
  },

  async getProjectProposals(wardId) {
    return queryCollection(COLLECTIONS.PROJECT_PROPOSALS, wardId);
  },

  async createProjectProposal(data, docId) {
    return createWithOptionalId(COLLECTIONS.PROJECT_PROPOSALS, data, docId);
  },

  async updateProjectProposal(id, data) {
    return updateRecord(COLLECTIONS.PROJECT_PROPOSALS, id, data);
  },

  async getProjectProposal(id) {
    const snapshot = await getDoc(doc(db, COLLECTIONS.PROJECT_PROPOSALS, id));
    if (!snapshot.exists()) return null;
    return normalizeDoc(snapshot);
  },

  async getFundingRequests(stakeholderType) {
    const ref = collection(db, COLLECTIONS.FUNDING_REQUESTS);
    const snapshot = stakeholderType
      ? await getDocs(query(ref, where('stakeholderType', '==', stakeholderType)))
      : await getDocs(ref);
    return snapshot.docs.map(normalizeDoc);
  },

  async createFundingRequest(data, docId) {
    return createWithOptionalId(COLLECTIONS.FUNDING_REQUESTS, data, docId);
  },

  async updateFundingRequest(id, data) {
    return updateRecord(COLLECTIONS.FUNDING_REQUESTS, id, data);
  },

  /**
   * Atomically approve funding — all writes succeed or none are saved.
   * Prevents partial approval when a later step fails.
   */
  async commitFundingApproval({
    fundingRequestId,
    fundingRequestUpdate,
    proposalId,
    proposalUpdate,
    communityNeedId,
    projectData,
    siblingCloses = [],
  }) {
    const batch = writeBatch(db);
    const ts = serverTimestamp();

    batch.update(doc(db, COLLECTIONS.FUNDING_REQUESTS, fundingRequestId), {
      ...sanitizeForFirestore(fundingRequestUpdate),
      updatedAt: ts,
    });

    if (proposalId && proposalUpdate) {
      batch.update(doc(db, COLLECTIONS.PROJECT_PROPOSALS, proposalId), {
        ...sanitizeForFirestore(proposalUpdate),
        updatedAt: ts,
      });
    }

    if (communityNeedId) {
      batch.update(doc(db, COLLECTIONS.COMMUNITY_NEEDS, communityNeedId), {
        status: 'funded',
        updatedAt: ts,
      });
    }

    if (projectData) {
      const projectRef = doc(collection(db, COLLECTIONS.PROJECTS));
      batch.set(projectRef, {
        ...sanitizeForFirestore(projectData),
        wardId: projectData.wardId || extractWardId(projectData),
        createdAt: projectData.dateLogged ?? new Date().toISOString(),
        updatedAt: ts,
      });
    }

    siblingCloses.forEach(({ id, data }) => {
      batch.update(doc(db, COLLECTIONS.FUNDING_REQUESTS, id), {
        ...sanitizeForFirestore(data),
        updatedAt: ts,
      });
    });

    await batch.commit();
  },

  async findUsersByRole(role) {
    if (!role) return [];
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(query(usersRef, where('role', '==', role), limit(20)));
    const matches = snapshot.docs.map((d) => ({
      id: d.id,
      uid: d.id,
      ...serializeValue(d.data()),
    }));
    if (matches.length > 0) return matches;
    const all = await getDocs(query(usersRef, limit(50)));
    return all.docs
      .map((d) => ({ id: d.id, uid: d.id, ...serializeValue(d.data()) }))
      .filter((u) => u.role === role || u.rawRole === role);
  },

  async findWdcMembers(wardId) {
    const roles = ['wdc-member', 'wdc_chairman', 'wdc'];
    const groups = await Promise.all(roles.map((role) => firestoreService.findUsersByRole(role)));
    const byId = new Map();
    const targetKey = normalizeWardKey(wardId);
    groups.flat().forEach((u) => {
      if (!wardId || normalizeWardKey(u.wardId || extractWardId(u)) === targetKey) {
        byId.set(u.uid ?? u.id, u);
      }
    });
    return Array.from(byId.values());
  },

  async findAllStakeholders() {
    const types = ['psip', 'dsip', 'dda', 'ngo', 'open-member'];
    const groups = await Promise.all(types.map((t) => firestoreService.findUsersByRole(t)));
    const byId = new Map();
    groups.flat().forEach((u) => byId.set(u.uid ?? u.id, u));
    return Array.from(byId.values());
  },

  async findResidentsByWard(wardId, wardLabel) {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(query(usersRef, limit(150)));
    const wardRef = {
      wardId: wardId || extractWardId({ ward: wardLabel }),
      ward: wardLabel || '',
    };

    return snapshot.docs
      .map((d) => ({ id: d.id, uid: d.id, ...serializeValue(d.data()) }))
      .filter((u) => normalizeRole(u.role) === 'resident' && matchesWard(wardRef, u));
  },

  async getLetters(wardId) {
    return queryCollection(COLLECTIONS.LETTERS, wardId);
  },

  async getLettersForResident(residentId) {
    if (!residentId) return [];
    const ref = collection(db, COLLECTIONS.LETTERS);
    const snapshot = await getDocs(query(ref, where('residentId', '==', residentId), limit(50)));
    if (!snapshot.empty) {
      return snapshot.docs.map(normalizeDoc);
    }
    const all = await getDocs(query(ref, limit(100)));
    return all.docs
      .map(normalizeDoc)
      .filter((letter) => letter.residentId === residentId);
  },

  async createLetter(data, docId) {
    return createWithOptionalId(COLLECTIONS.LETTERS, data, docId);
  },

  async updateLetter(id, data) {
    return updateRecord(COLLECTIONS.LETTERS, id, data);
  },

  async getReports(wardId) {
    return queryCollection(COLLECTIONS.REPORTS, wardId);
  },

  async getRatings(wardId) {
    return queryCollection(COLLECTIONS.RATINGS, wardId);
  },

  async getRatingsByProject(projectId) {
    if (!projectId) return [];
    const ref = collection(db, COLLECTIONS.RATINGS);
    const snapshot = await getDocs(query(ref, where('projectId', '==', projectId), limit(20)));
    return snapshot.docs.map(normalizeDoc);
  },

  async getRatingsByResident(residentId) {
    if (!residentId) return [];
    const ref = collection(db, COLLECTIONS.RATINGS);
    const snapshot = await getDocs(query(ref, where('residentId', '==', residentId), limit(30)));
    return snapshot.docs.map(normalizeDoc);
  },

  async getRatingsForStakeholder(stakeholderType) {
    const all = await queryCollection(COLLECTIONS.RATINGS);
    const key = String(stakeholderType ?? '').toUpperCase();
    return all.filter((r) => String(r.fundingSource ?? '').toUpperCase() === key);
  },

  async hasResidentRatedProject(residentId, projectId) {
    if (!residentId || !projectId) return false;
    const ref = collection(db, COLLECTIONS.RATINGS);
    const snapshot = await getDocs(
      query(
        ref,
        where('residentId', '==', residentId),
        where('projectId', '==', projectId),
        limit(1),
      ),
    );
    return !snapshot.empty;
  },

  async createRating(data, docId) {
    return createWithOptionalId(COLLECTIONS.RATINGS, data, docId);
  },

  async getCouncillors() {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(
      query(usersRef, where('role', '==', 'councillor'), limit(30)),
    );
    return snapshot.docs.map(normalizeDoc);
  },

  async createReport(data, docId) {
    return createWithOptionalId(COLLECTIONS.REPORTS, data, docId);
  },

  async updateReport(id, data) {
    return updateRecord(COLLECTIONS.REPORTS, id, data);
  },

  async createNotification(data) {
    const ref = await addDoc(collection(db, 'notifications'), {
      ...sanitizeForFirestore(data),
      createdAt: serverTimestamp(),
      read: false,
    });
    return ref.id;
  },

  async findCouncillorByWard(wardId) {
    if (!wardId) return null;
    const usersRef = collection(db, 'users');
    const byWard = await getDocs(
      query(usersRef, where('role', '==', 'councillor'), where('wardId', '==', wardId), limit(1)),
    );
    if (!byWard.empty) {
      const docSnap = byWard.docs[0];
      return { id: docSnap.id, uid: docSnap.id, ...serializeValue(docSnap.data()) };
    }
    const allCouncillors = await getDocs(query(usersRef, where('role', '==', 'councillor'), limit(20)));
    const match = allCouncillors.docs.find((d) => {
      const data = d.data();
      const councillorWardId = data.wardId || extractWardId(data);
      return normalizeWardKey(councillorWardId) === normalizeWardKey(wardId);
    });
    if (!match) return null;
    return { id: match.id, uid: match.id, ...serializeValue(match.data()) };
  },

  async findMayor() {
    const usersRef = collection(db, 'users');
    const mayorRoles = ['mayor', 'llg_admin', 'llg-admin'];
    for (const role of mayorRoles) {
      const snapshot = await getDocs(query(usersRef, where('role', '==', role), limit(1)));
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, uid: docSnap.id, ...serializeValue(docSnap.data()) };
      }
    }
    const all = await getDocs(query(usersRef, limit(50)));
    const match = all.docs.find((d) => {
      const data = d.data();
      const role = data.role ?? '';
      const rawRole = data.rawRole ?? '';
      const category = data.userCategory ?? '';
      return mayorRoles.includes(role) || mayorRoles.includes(rawRole) || mayorRoles.includes(category);
    });
    if (!match) return null;
    return { id: match.id, uid: match.id, ...serializeValue(match.data()) };
  },

  async getNotifications(userId) {
    if (!userId) return [];
    const ref = collection(db, 'notifications');
    const snapshot = await getDocs(
      query(ref, where('userId', '==', userId), limit(40)),
    );
    return snapshot.docs
      .map(normalizeDoc)
      .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
  },

  async markNotificationRead(id) {
    await updateRecord('notifications', id, { read: true });
  },

  async migrateFromLocalStorage() {
    const results = {};

    for (const collectionName of MIGRATABLE_COLLECTIONS) {
      const localData = getLocalCollection(collectionName);
      results[collectionName] = { total: localData.length, migrated: 0, errors: 0 };

      for (const item of localData) {
        try {
          const data = {
            ...item,
            localStorageId: item.id,
            wardId: item.wardId || extractWardId(item),
            migratedAt: new Date().toISOString(),
          };
          const createFnName = CREATE_FN_BY_COLLECTION[collectionName];
          await firestoreService[createFnName](data, item.id);
          results[collectionName].migrated += 1;
        } catch (error) {
          results[collectionName].errors += 1;
          console.error(`Error migrating ${collectionName} item:`, error);
        }
      }
    }

    setDataMigrated();
    return results;
  },
};

export async function getDocument(collectionName, docId) {
  const snapshot = await getDoc(doc(db, collectionName, docId));
  if (!snapshot.exists()) return null;
  return normalizeDoc(snapshot);
}

export async function getCollection(collectionName, constraints = []) {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(normalizeDoc);
}

export async function createDocument(collectionName, data) {
  const ref = await addDoc(collection(db, collectionName), {
    ...sanitizeForFirestore(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDocument(collectionName, docId, data) {
  await updateDoc(doc(db, collectionName, docId), {
    ...sanitizeForFirestore(data),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(collectionName, docId) {
  await deleteDoc(doc(db, collectionName, docId));
}

export { COLLECTIONS, capitalize, isDataMigrated, collection, doc, query, where, orderBy, limit, serverTimestamp };
