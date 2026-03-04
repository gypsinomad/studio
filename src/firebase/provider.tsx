'use client';

import React, {
  DependencyList,
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { debugLogger } from '@/lib/debug-logger';
import type { User as CRMUser, UserRole } from '@/lib/types';
import { useDoc } from './firestore/use-doc';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

interface UserAuthState {
  user: User | null;
  idToken: string | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  userProfile: CRMUser | null;
  isUserProfileLoading: boolean;
  userProfileError: Error | null;
  isCreatingProfile: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  role: UserRole | null;
  canCreate: boolean;
}

export interface FirebaseServicesAndUser extends UserAuthState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  userProfile: CRMUser | null;
  isUserProfileLoading: boolean;
  userProfileError: Error | null;
  isCreatingProfile: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  role: UserRole | null;
  canCreate: boolean;
}

export interface UserHookResult extends UserAuthState {
  userProfile: CRMUser | null;
  isUserProfileLoading: boolean;
  userProfileError: Error | null;
  isCreatingProfile: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  role: UserRole | null;
  canCreate: boolean;
}

// ─── Initial States ───────────────────────────────────────────────────────────

const INITIAL_AUTH_STATE: UserAuthState = {
  user: null,
  idToken: null,
  isUserLoading: true,
  userError: null,
};

const LOADING_FALSE_AUTH_STATE: UserAuthState = {
  ...INITIAL_AUTH_STATE,
  isUserLoading: false,
};

// ─── Context ──────────────────────────────────────────────────────────────────

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>(INITIAL_AUTH_STATE);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!auth) {
      setUserAuthState({
        ...LOADING_FALSE_AUTH_STATE,
        userError: new Error('Auth service not provided.'),
      });
      return;
    }

    debugLogger.log('AUTH', 'Initializing auth state listener', 'debug');
    setUserAuthState(INITIAL_AUTH_STATE);

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!isMountedRef.current) return;

        if (firebaseUser) {
          debugLogger.log('AUTH', `User authenticated: ${firebaseUser.email}`, 'info');
          try {
            const token = await firebaseUser.getIdToken();
            if (!isMountedRef.current) return;
            setUserAuthState({ user: firebaseUser, idToken: token, isUserLoading: false, userError: null });
          } catch (err) {
            debugLogger.log('AUTH', `Failed to fetch ID token: ${(err as Error).message}`, 'error');
            if (!isMountedRef.current) return;
            setUserAuthState({ user: firebaseUser, idToken: null, isUserLoading: false, userError: err as Error });
          }
        } else {
          debugLogger.log('AUTH', 'User signed out', 'info');
          setUserAuthState(LOADING_FALSE_AUTH_STATE);
        }
      },
      (error) => {
        if (!isMountedRef.current) return;
        debugLogger.log('AUTH', `Auth listener error: ${error.message}`, 'error');
        setUserAuthState({ ...LOADING_FALSE_AUTH_STATE, userError: error });
      }
    );

    return () => unsubscribe();
  }, [auth]);

  // ─── User Profile Listener (single users/{uid} doc subscription) ─────────────

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !userAuthState.user) return null;
    return doc(firestore, 'users', userAuthState.user.uid);
  }, [firestore, userAuthState.user]);

  const {
    data: userProfile,
    isLoading: userProfileLoading,
    error: userProfileError,
  } = useDoc<CRMUser>(userDocRef);

  useEffect(() => {
    const shouldCreateProfile =
      !userAuthState.isUserLoading &&
      !!userAuthState.user &&
      !userProfileLoading &&
      !userProfile &&
      !isCreatingProfile;

    if (!shouldCreateProfile || !userDocRef) return;

    const createProfile = async () => {
      setIsCreatingProfile(true);
      try {
        const firebaseUser = userAuthState.user!;
        const initialRole: UserRole = 'admin';

        const newUserProfileData: Omit<CRMUser, 'id'> = {
          authUid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'New User',
          role: initialRole,
          isActive: true,
          createdAt: serverTimestamp(),
          avatarUrl: firebaseUser.photoURL || undefined,
        };

        await setDoc(userDocRef, newUserProfileData);
      } catch (error) {
        console.error('[FirebaseProvider] Failed to create user profile:', error);
      } finally {
        setIsCreatingProfile(false);
      }
    };

    createProfile();
  }, [
    userAuthState.isUserLoading,
    userAuthState.user,
    userProfileLoading,
    userProfile,
    isCreatingProfile,
    userDocRef,
  ]);

  const isProfileBusy = userProfileLoading || isCreatingProfile;
  const isAuthenticated = !!userAuthState.user && !userAuthState.isUserLoading;
  const isAdmin = isAuthenticated;
  const role: UserRole | null = userProfile?.role ?? (isAuthenticated ? 'admin' : null);
  const canCreate = isAuthenticated;

  const contextValue = useMemo((): FirebaseContextState => {
    const areServicesAvailable = !!(firebaseApp && firestore && auth && storage);
    return {
      areServicesAvailable,
      firebaseApp: areServicesAvailable ? firebaseApp : null,
      firestore: areServicesAvailable ? firestore : null,
      auth: areServicesAvailable ? auth : null,
      storage: areServicesAvailable ? storage : null,
      ...userAuthState,
      userProfile,
      isUserProfileLoading: isProfileBusy,
      userProfileError,
      isCreatingProfile,
      isAuthenticated,
      isAdmin,
      role,
      canCreate,
    };
  }, [
    firebaseApp,
    firestore,
    auth,
    storage,
    userAuthState,
    userProfile,
    isProfileBusy,
    userProfileError,
    isCreatingProfile,
    isAuthenticated,
    isAdmin,
    role,
    canCreate,
  ]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

// ─── Base Hook ────────────────────────────────────────────────────────────────

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (
    !context.areServicesAvailable ||
    !context.firebaseApp ||
    !context.firestore ||
    !context.auth ||
    !context.storage
  ) {
    throw new Error('Firebase core services are not available. Verify FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
    user: context.user,
    idToken: context.idToken,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    userProfile: context.userProfile,
    isUserProfileLoading: context.isUserProfileLoading,
    userProfileError: context.userProfileError,
    isCreatingProfile: context.isCreatingProfile,
    isAuthenticated: context.isAuthenticated,
    isAdmin: context.isAdmin,
    role: context.role,
    canCreate: context.canCreate,
  };
};

// ─── Service Hooks ────────────────────────────────────────────────────────────

export const useAuth = (): Auth => useFirebase().auth;
export const useFirestore = (): Firestore => useFirebase().firestore;
export const useStorage = (): FirebaseStorage => useFirebase().storage;
export const useFirebaseApp = (): FirebaseApp => useFirebase().firebaseApp;

// ─── User Hook ────────────────────────────────────────────────────────────────

export const useUser = (): UserHookResult => {
  const {
    user,
    idToken,
    isUserLoading,
    userError,
    userProfile,
    isUserProfileLoading,
    userProfileError,
    isCreatingProfile,
    isAuthenticated,
    isAdmin,
    role,
    canCreate,
  } = useFirebase();

  return {
    user,
    idToken,
    isUserLoading,
    userError,
    userProfile,
    isUserProfileLoading,
    userProfileError,
    isCreatingProfile,
    isAuthenticated,
    isAdmin,
    role,
    canCreate,
  };
};

// ─── useMemoFirebase ──────────────────────────────────────────────────────────

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  const memoized = useMemo(factory, deps);

  if (typeof memoized === 'object' && memoized !== null) {
    Object.defineProperty(memoized, '__memo', {
      value: true,
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }

  return memoized;
}