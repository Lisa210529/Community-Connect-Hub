import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { resolveDashboardPath } from '../constants';
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
  updateUserProfile,
} from '../services/authService';
import { auth } from '../services/firebase';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaVerified, setMfaVerified] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const fbUser = auth.currentUser;
        if (!fbUser) {
          if (active) {
            setUser(null);
            setFirebaseUser(null);
          }
          return;
        }
        const profile = await getUserData(fbUser.uid);
        if (profile?.isApproved && profile?.isActive) {
          if (active) {
            setUser(profile);
            setFirebaseUser(fbUser);
          }
        } else if (active) {
          setUser(null);
          setFirebaseUser(null);
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
    const { profile, firebaseUser: fbUser } = await loginUser(email, password);
    setUser(profile);
    setFirebaseUser(fbUser);
    setMfaVerified(!profile.mfaEnabled);
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
    setMfaVerified(false);
    sessionStorage.removeItem('mfaSmsCode');
  }, []);

  const completeMfaLogin = useCallback(() => {
    setMfaVerified(true);
  }, []);

  const updateProfile = useCallback(
    async (updates, options = {}) => {
      if (!user?.uid) return;
      const updated = await updateUserProfile(user.uid, updates, options);
      setUser(updated);
      if (auth.currentUser) {
        setFirebaseUser(auth.currentUser);
      }
      return updated;
    },
    [user],
  );

  const signInEmail = firebaseUser?.email ?? '';
  const profileEmail = user?.email ?? '';
  const emailSyncRequired = useMemo(
    () =>
      Boolean(
        user &&
          signInEmail &&
          profileEmail &&
          signInEmail.trim().toLowerCase() !== profileEmail.trim().toLowerCase(),
      ),
    [user, signInEmail, profileEmail],
  );

  const dashboardPath = resolveDashboardPath(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        signInEmail,
        emailSyncRequired,
        role: user?.role,
        loading,
        isAuthenticated: !!user && (!user?.mfaEnabled || mfaVerified),
        login,
        register: registerUser,
        registerResident,
        registerOfficial,
        preRegisterOfficial: preRegisterOfficialHandler,
        logout,
        updateProfile,
        completeMfaLogin,
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
