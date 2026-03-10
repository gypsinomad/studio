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
import { FirebaseErrorBoundary } from '@/components/firebase-error-boundary';
import { debugLogger } from '@/lib/debug-logger';
import { authLogger } from '@/lib/auth-logger';
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
  profileCreationError: Error | null;
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
  // Additional granular permissions
  canManageUsers: boolean;
  canManageCustomers: boolean;
  canManageLeads: boolean;
  canManageDocuments: boolean;
  canViewReports: boolean;
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
  // Additional granular permissions
  canManageUsers: boolean;
  canManageCustomers: boolean;
  canManageLeads: boolean;
  canManageDocuments: boolean;
  canViewReports: boolean;
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
  // Additional granular permissions
  canManageUsers: boolean;
  canManageCustomers: boolean;
  canManageLeads: boolean;
  canManageDocuments: boolean;
  canViewReports: boolean;
}

// ─── Initial States ───────────────────────────────────────────────────────────

const INITIAL_AUTH_STATE: UserAuthState = {
  user: null,
  idToken: null,
  isUserLoading: true,
  userError: null,
  profileCreationError: null,
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
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    abortControllerRef.current = new AbortController();
    return () => { 
      isMountedRef.current = false;
      // Cancel any ongoing token fetch operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!auth) {
        setUserAuthState({
          ...LOADING_FALSE_AUTH_STATE,
          userError: new Error('Auth service not provided.'),
          profileCreationError: null,
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
          authLogger.logAuthStart(firebaseUser.email || 'unknown');
          debugLogger.log('AUTH', `User authenticated: ${firebaseUser.email}`, 'info');
          
          // Retry mechanism for ID token fetching with cleanup
          const fetchTokenWithRetry = async (retries = 3, delay = 1000): Promise<string> => {
            // Check if component is still mounted and not aborted
            const checkCancellation = () => {
              if (!isMountedRef.current || abortControllerRef.current?.signal.aborted) {
                throw new Error('Component unmounted or operation cancelled');
              }
            };
            
            for (let attempt = 1; attempt <= retries; attempt++) {
              checkCancellation();
              try {
                const token = await firebaseUser.getIdToken(true); // Force refresh
                authLogger.logTokenRefresh(true);
                debugLogger.log('AUTH', `ID token fetched successfully (attempt ${attempt})`, 'debug');
                return token;
              } catch (err) {
                checkCancellation();
                const error = err as Error;
                authLogger.logTokenRefresh(false, error);
                debugLogger.log('AUTH', `Token fetch attempt ${attempt} failed: ${error.message}`, 'warn');
                
                if (attempt === retries) {
                  throw error;
                }
                
                // Exponential backoff with cancellation check
                await new Promise((resolve, reject) => {
                  const timeout = setTimeout(resolve, delay * attempt);
                  
                  // Handle cancellation during backoff
                  const handleAbort = () => {
                    clearTimeout(timeout);
                    reject(new Error('Operation cancelled during backoff'));
                  };
                  
                  abortControllerRef.current?.signal.addEventListener('abort', handleAbort);
                  
                  // Clean up event listener
                  setTimeout(() => {
                    abortControllerRef.current?.signal.removeEventListener('abort', handleAbort);
                  }, delay * attempt);
                });
              }
            }
            throw new Error('Failed to fetch ID token after retries');
          };

          try {
            const token = await fetchTokenWithRetry();
            if (!isMountedRef.current) return;
            authLogger.logAuthSuccess(firebaseUser);
            setUserAuthState({ 
              user: firebaseUser, 
              idToken: token, 
              isUserLoading: false, 
              userError: null,
              profileCreationError: null,
            });
          } catch (err) {
            authLogger.logAuthError(err, 'token_fetch');
            debugLogger.log('AUTH', `Failed to fetch ID token after retries: ${(err as Error).message}`, 'error');
            if (!isMountedRef.current) return;
            setUserAuthState({ 
              user: firebaseUser, 
              idToken: null, 
              isUserLoading: false, 
              userError: err as Error,
              profileCreationError: null,
            });
          }
        } else {
          debugLogger.log('AUTH', 'User signed out', 'info');
          setUserAuthState(LOADING_FALSE_AUTH_STATE);
        }
      },
      (error) => {
        if (!isMountedRef.current) return;
        debugLogger.log('AUTH', `Auth listener error: ${error.message}`, 'error');
        setUserAuthState({ 
          ...LOADING_FALSE_AUTH_STATE, 
          userError: error,
          profileCreationError: null,
        });
      }
    );

    return () => unsubscribe();
  }, [auth]);

  // ─── User Profile Listener (single users/{uid} doc subscription) ─────────────

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !userAuthState.user) return null;
    return doc(firestore, 'users', userAuthState.user.uid);
  }, [firestore, userAuthState.user?.uid]); // More specific dependency

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
      !isCreatingProfile &&
      !userProfileError &&
      !userAuthState.profileCreationError; // Also check for profile creation errors

    if (!shouldCreateProfile || !userDocRef) return;

    const createProfile = async () => {
      setIsCreatingProfile(true);
      try {
        const firebaseUser = userAuthState.user!;
        
        // Determine initial role based on business logic
        // For now, default to 'viewer' for new users
        // Admin can upgrade roles later
        const initialRole: UserRole = 'viewer';

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
        authLogger.logProfileCreation(firebaseUser.email || 'unknown', true);
        debugLogger.log('AUTH', `User profile created for ${firebaseUser.email}`, 'info');
      } catch (error) {
        const userEmail = userAuthState.user?.email || 'unknown';
        authLogger.logProfileCreation(userEmail, false, error);
        debugLogger.log('AUTH', `Failed to create user profile: ${(error as Error).message}`, 'error');
        console.error('[FirebaseProvider] Failed to create user profile:', error);
        
        // Set profile creation error state
        if (!isMountedRef.current) return;
        setUserAuthState(prev => ({
          ...prev,
          profileCreationError: error as Error,
        }));
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
    userProfileError,
    userAuthState.profileCreationError, // Add profile creation error to dependencies
    isCreatingProfile,
    userDocRef,
  ]);

  const isProfileBusy = userProfileLoading || isCreatingProfile;
  const isAuthenticated = !!userAuthState.user && !userAuthState.isUserLoading;
  const isAdmin = isAuthenticated && userProfile?.role === 'admin';
  const role: UserRole | null = userProfile?.role ?? null;
  const canCreate = isAuthenticated && (role === 'admin' || role === 'salesExecutive' || role === 'viewer');
  
  // Helper function to check if user can perform specific operations
  const canPerformAction = (requiredRoles: UserRole[]) => {
    return isAuthenticated && role !== null && requiredRoles.includes(role);
  };
  
  const canManageUsers = canPerformAction(['admin']);
  const canManageCustomers = canPerformAction(['admin', 'salesExecutive']);
  const canManageLeads = canPerformAction(['admin', 'salesExecutive', 'viewer']);
  const canManageDocuments = canPerformAction(['admin', 'salesExecutive', 'viewer']);
  const canViewReports = canPerformAction(['admin', 'salesExecutive']);

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
      // Additional granular permissions
      canManageUsers,
      canManageCustomers,
      canManageLeads,
      canManageDocuments,
      canViewReports,
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
    canManageUsers,
    canManageCustomers,
    canManageLeads,
    canManageDocuments,
    canViewReports,
  ]);

  return (
    <FirebaseErrorBoundary>
      <FirebaseContext.Provider value={contextValue}>
        <FirebaseErrorListener />
        {children}
      </FirebaseContext.Provider>
    </FirebaseErrorBoundary>
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
    profileCreationError: context.profileCreationError,
    userProfile: context.userProfile,
    isUserProfileLoading: context.isUserProfileLoading,
    userProfileError: context.userProfileError,
    isCreatingProfile: context.isCreatingProfile,
    isAuthenticated: context.isAuthenticated,
    isAdmin: context.isAdmin,
    role: context.role,
    canCreate: context.canCreate,
    canManageUsers: context.canManageUsers,
    canManageCustomers: context.canManageCustomers,
    canManageLeads: context.canManageLeads,
    canManageDocuments: context.canManageDocuments,
    canViewReports: context.canViewReports,
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
    profileCreationError,
    userProfile,
    isUserProfileLoading,
    userProfileError,
    isCreatingProfile,
    isAuthenticated,
    isAdmin,
    role,
    canCreate,
    canManageUsers,
    canManageCustomers,
    canManageLeads,
    canManageDocuments,
    canViewReports,
  } = useFirebase();

  return {
    user,
    idToken,
    isUserLoading,
    userError,
    profileCreationError,
    userProfile,
    isUserProfileLoading,
    userProfileError,
    isCreatingProfile,
    isAuthenticated,
    isAdmin,
    role,
    canCreate,
    canManageUsers,
    canManageCustomers,
    canManageLeads,
    canManageDocuments,
    canViewReports,
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