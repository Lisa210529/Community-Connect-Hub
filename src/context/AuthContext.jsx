import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import INITIAL_DATA from '../data/mockData';
import { isValidEmail } from '../utils/helpers';
import {
  initializeStorage,
  getStore,
  setCollection,
  getSession,
  setSession,
  addAuditLog,
  addItem,
  updateItem,
} from '../services/localStorageService';
import { ROLE_DASHBOARD_PATHS } from '../constants';
import {
  validateNID,
  checkNidExists,
  checkNidInPreReg,
  validateOfficialRegistration,
  validateResidentRegistration,
  getPreRegisteredUsers,
} from '../utils/validators';

const AuthContext = createContext(null);

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeStorage(INITIAL_DATA);
    const session = getSession();
    if (session?.userId) {
      const store = getStore();
      const profile = store?.users?.find((u) => u.id === session.userId);
      if (profile) setUser(profile);
    }
    setLoading(false);
  }, []);

  const login = useCallback((identifier, password, rememberMe = false) => {
    const email = identifier.trim();
    if (!isValidEmail(email)) throw new Error('Please enter a valid email address.');
    if (!password?.trim()) throw new Error('Please enter a password.');
    const store = getStore();
    const found = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) throw new Error('No account found with this email.');
    if (!found.isApproved) {
      throw new Error('Your account is pending approval. Please wait for admin approval.');
    }
    if (!found.isActive) throw new Error('Your account is inactive.');
    setUser(found);
    setSession({ userId: found.id, rememberMe });
    addAuditLog('LOGIN', found.name, found.role, `User ${found.email} logged in`);
    return found;
  }, []);

  const registerResident = useCallback(({ fullName, email, nid, password, phone, ward, acceptedTerms }) => {
    if (!acceptedTerms) throw new Error('You must accept the Terms & Conditions.');
    const normalizedNid = String(nid ?? '').replace(/\s/g, '');
    const normalizedEmail = email.trim().toLowerCase();
    if (!validateNID(normalizedNid)) throw new Error('NID must be exactly 10 digits.');
    if (!isValidEmail(normalizedEmail)) throw new Error('Please enter a valid email address.');
    if (!fullName?.trim()) throw new Error('Please enter your full name.');
    const store = getStore();
    if (store.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('Email already registered.');
    }
    const residentCheck = validateResidentRegistration({ nid: normalizedNid });
    if (!residentCheck.valid) throw new Error(residentCheck.message);
    if (!phone?.trim()) throw new Error('Phone number is required.');
    if (!ward?.trim()) throw new Error('Please select your ward.');

    const wardNumber = ward.startsWith('ward') ? ward.replace('ward', '') : '';
    const wardLabel = wardNumber ? `Ward ${wardNumber}` : ward.trim();
    const wardRecord = store.wards?.find(
      (w) => w.wardId === ward || w.wardName === ward || w.wardNumber === wardNumber,
    );
    const { firstName, lastName } = splitFullName(fullName);
    const now = new Date().toISOString();
    const newUser = {
      id: `user_${Date.now()}`,
      uid: `user_${Date.now()}`,
      email: normalizedEmail,
      password,
      nid: normalizedNid,
      role: 'resident',
      firstName,
      lastName,
      name: fullName.trim(),
      phone: phone.trim(),
      ward: wardLabel,
      wardId: wardRecord?.wardId ?? ward,
      wardNumber: wardRecord?.wardNumber ?? wardNumber,
      province: wardRecord?.province ?? 'Madang Province',
      district: wardRecord?.district ?? '',
      llg: wardRecord?.llg ?? '',
      isApproved: false,
      isRegistered: true,
      isActive: true,
      mfaEnabled: false,
      createdAt: now,
      registeredAt: now,
    };
    addItem('users', newUser);
    addAuditLog('REGISTER', newUser.name, 'resident', `Resident registration pending: ${normalizedEmail}`);
    return { user: newUser, needsApproval: true };
  }, []);

  const registerOfficial = useCallback(({ email, nid, password, acceptedTerms }) => {
    if (!acceptedTerms) throw new Error('You must accept the Terms & Conditions.');
    const normalizedNid = String(nid ?? '').replace(/\s/g, '');
    const normalizedEmail = email.trim().toLowerCase();
    if (!validateNID(normalizedNid)) throw new Error('NID must be exactly 10 digits.');
    if (!isValidEmail(normalizedEmail)) throw new Error('Please enter a valid email address.');
    const store = getStore();
    if (store.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('Email already registered.');
    }
    if (checkNidExists(normalizedNid)) {
      throw new Error('NID already registered.');
    }
    const officialCheck = validateOfficialRegistration({ nid: normalizedNid, email: normalizedEmail });
    if (!officialCheck.valid) throw new Error(officialCheck.message);

    const record = officialCheck.record;
    const { firstName, lastName } = splitFullName(record.fullName);
    const now = new Date().toISOString();
    const newUser = {
      id: `user_${Date.now()}`,
      uid: `user_${Date.now()}`,
      email: normalizedEmail,
      password,
      nid: normalizedNid,
      role: record.role,
      firstName,
      lastName,
      name: record.fullName,
      phone: '',
      ward: record.ward ?? '',
      wardId: record.wardId ?? '',
      wardNumber: record.wardNumber ?? '',
      province: record.province ?? 'Madang Province',
      district: record.district ?? '',
      llg: record.llg ?? '',
      position: record.position ?? '',
      isApproved: true,
      isRegistered: true,
      isActive: true,
      mfaEnabled: false,
      createdAt: now,
      registeredAt: now,
    };
    addItem('users', newUser);
    updateItem('preRegisteredUsers', record.id ?? record.preRegId, {
      isRegistered: true,
      registeredAt: now,
    });
    addAuditLog(
      'REGISTER',
      newUser.name,
      record.role,
      `Official registration complete: ${normalizedEmail} (${record.position})`,
    );
    return { user: newUser, needsApproval: false };
  }, []);

  const preRegisterOfficial = useCallback((payload, adminUser) => {
    const normalizedNid = String(payload.nid ?? '').replace(/\s/g, '');
    if (!validateNID(normalizedNid)) throw new Error('NID must be exactly 10 digits.');
    if (checkNidExists(normalizedNid)) throw new Error('NID already registered to a user.');
    if (checkNidInPreReg(normalizedNid)) throw new Error('NID already in pre-registration list.');
    const store = getStore();
    if (getPreRegisteredUsers(store).some((o) => o.email.toLowerCase() === payload.email.trim().toLowerCase())) {
      throw new Error('Email already in pre-registration list.');
    }
    const id = `pre-${Date.now()}`;
    const record = {
      preRegId: id,
      id,
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      nid: normalizedNid,
      role: payload.role,
      position: payload.position?.trim() ?? '',
      ward: payload.ward?.trim() ?? '',
      wardId: payload.wardId ?? '',
      wardNumber: payload.wardNumber ?? '',
      province: payload.province ?? 'Madang Province',
      district: payload.district ?? '',
      llg: payload.llg ?? '',
      isRegistered: false,
      createdBy: adminUser?.id ?? '',
      createdAt: new Date().toISOString(),
    };
    addItem('preRegisteredUsers', record);
    addAuditLog(
      'PRE_REGISTER',
      adminUser?.name ?? 'Admin',
      adminUser?.role ?? 'system-admin',
      `Pre-registered ${record.fullName} as ${record.role} (NID: ${normalizedNid})`,
    );
    return record;
  }, []);

  const logout = useCallback(() => {
    if (user) addAuditLog('LOGOUT', user.name, user.role, 'User logged out');
    setUser(null);
    setSession(null);
  }, [user]);

  const updateProfile = useCallback(
    (updates) => {
      if (!user) return;
      const store = getStore();
      const users = store.users.map((u) =>
        u.id === user.id
          ? {
              ...u,
              ...updates,
              name: `${updates.firstName ?? u.firstName} ${updates.lastName ?? u.lastName}`.trim(),
            }
          : u,
      );
      setCollection('users', users);
      const updated = users.find((u) => u.id === user.id);
      setUser(updated);
      setSession({ userId: updated.id });
    },
    [user],
  );

  const dashboardPath = user ? ROLE_DASHBOARD_PATHS[user.role] : '/login';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role,
        loading,
        isAuthenticated: !!user,
        login,
        registerResident,
        registerOfficial,
        preRegisterOfficial,
        logout,
        updateProfile,
        dashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
