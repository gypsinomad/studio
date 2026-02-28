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
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { debugLogger } from '@/lib/debug-logger';

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
}

export interface FirebaseServicesAndUser extends UserAuthState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

export type UserHookResult = UserAuthState;

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

  const contextValue = useMemo((): FirebaseContextState => {
    const areServicesAvailable = !!(firebaseApp && firestore && auth && storage);
    return {
      areServicesAvailable,
      firebaseApp: areServicesAvailable ? firebaseApp : null,
      firestore: areServicesAvailable ? firestore : null,
      auth: areServicesAvailable ? auth : null,
      storage: areServicesAvailable ? storage : null,
      ...userAuthState,
    };
  }, [firebaseApp, firestore, auth, storage, userAuthState]);

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
  };
};

// ─── Service Hooks ────────────────────────────────────────────────────────────

export const useAuth = (): Auth => useFirebase().auth;
export const useFirestore = (): Firestore => useFirebase().firestore;
export const useStorage = (): FirebaseStorage => useFirebase().storage;
export const useFirebaseApp = (): FirebaseApp => useFirebase().firebaseApp;

// ─── User Hook ────────────────────────────────────────────────────────────────

export const useUser = (): UserHookResult => {
  const { user, idToken, isUserLoading, userError } = useFirebase();
  return { user, idToken, isUserLoading, userError };
};

// ─── useMemoFirebase ──────────────────────────────────────────────────────────

/**
 * Like useMemo, but attaches a non-enumerable __memo debug marker to
 * object results so internal tooling can detect memoized Firebase values.
 * The return type is always T — the marker is invisible to consumers.
 */
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
