import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ROLE_DASHBOARD_PATHS } from '../constants';
import { validateNID } from '../utils/validators';
import { isValidEmail } from '../utils/helpers';
import {
  loginUser,
  logoutUser,
  registerUser,
  registerResidentUser,
  registerOfficialUser,
  preRegisterOfficial,
  subscribeToAuthChanges,
  getUserData,
  getCurrentUser,
  updateUserProfile,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const userData = await getCurrentUser();
        if (active) {
          setUser(userData);
          setFirebaseUser(userData);
        }
      } catch {
        if (active) {
          setUser(null);
          setFirebaseUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();

    const unsubscribe = subscribeToAuthChanges(async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setFirebaseUser(null);
        return;
      }
      try {
        const profile = await getUserData(fbUser.uid);
        if (profile?.isApproved && profile?.isActive) {
          setUser(profile);
          setFirebaseUser(fbUser);
        } else {
          setUser(null);
          setFirebaseUser(null);
        }
      } catch {
        setUser(null);
        setFirebaseUser(null);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (identifier, password) => {
    const email = identifier.trim();
    if (!isValidEmail(email)) throw new Error('Please enter a valid email address.');
    if (!password?.trim()) throw new Error('Please enter a password.');
    const { profile } = await loginUser(email, password);
    setUser(profile);
    setFirebaseUser({ uid: profile.uid, email: profile.email });
    return profile;
  }, []);

  const registerResident = useCallback(
    async ({ fullName, email, nid, password, phone, ward, acceptedTerms, firstName, lastName, wardNumber, wardId }) => {
      if (!acceptedTerms) throw new Error('You must accept the Terms & Conditions.');
      if (!validateNID(String(nid ?? '').replace(/\s/g, ''))) {
        throw new Error('NID must be exactly 10 digits.');
      }
      if (!phone?.trim()) throw new Error('Phone number is required.');
      if (!ward?.trim() && !wardId?.trim()) throw new Error('Please select your ward.');

      const parts = fullName?.trim().split(/\s+/) ?? [];
      return registerResidentUser({
        firstName: firstName ?? parts[0] ?? '',
        lastName: lastName ?? parts.slice(1).join(' ') ?? '',
        fullName,
        email,
        nid,
        password,
        phone,
        ward,
        wardId: wardId ?? ward,
        wardNumber: wardNumber ?? ward?.replace('ward', '') ?? '',
        province: 'Madang',
        district: 'Madang',
        llg: 'Madang Urban',
        role: 'resident',
      });
    },
    [],
  );

  const registerOfficial = useCallback(async ({ email, nid, password, acceptedTerms }) => {
    if (!acceptedTerms) throw new Error('You must accept the Terms & Conditions.');
    return registerOfficialUser({ email, nid, password });
  }, []);

  const preRegisterOfficialHandler = useCallback(
    async (payload, adminUser) => preRegisterOfficial(payload, adminUser?.uid),
    [],
  );

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setFirebaseUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates) => {
      if (!user?.uid) return;
      const updated = await updateUserProfile(user.uid, updates);
      setUser(updated);
    },
    [user],
  );

  const dashboardPath = user ? ROLE_DASHBOARD_PATHS[user.role] : '/login';

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        role: user?.role,
        loading,
        isAuthenticated: !!user,
        login,
        register: registerUser,
        registerResident,
        registerOfficial,
        preRegisterOfficial: preRegisterOfficialHandler,
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
