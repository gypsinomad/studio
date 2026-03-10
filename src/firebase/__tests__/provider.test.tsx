import { renderHook, act } from '@testing-library/react';
import { FirebaseProvider, useUser, useFirebase } from '../provider';
import { ReactNode } from 'react';
import { 
  FirebaseApp, 
  Firestore, 
  Auth, 
  FirebaseStorage,
  User as FirebaseUser,
  onAuthStateChanged 
} from 'firebase/auth';

// Mock Firebase modules
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('firebase/app');
jest.mock('firebase/storage');

// Mock debug logger
jest.mock('@/lib/debug-logger', () => ({
  debugLogger: {
    log: jest.fn(),
  },
}));

// Mock auth logger
jest.mock('@/lib/auth-logger', () => ({
  authLogger: {
    logAuthStart: jest.fn(),
    logAuthSuccess: jest.fn(),
    logAuthError: jest.fn(),
    logTokenRefresh: jest.fn(),
    logProfileCreation: jest.fn(),
  },
}));

// Mock useDoc hook
jest.mock('../firestore/use-doc', () => ({
  useDoc: jest.fn(),
}));

const mockUseDoc = require('../firestore/use-doc').useDoc;

// Test wrapper component
const createWrapper = (mockServices: any) => {
  return ({ children }: { children: ReactNode }) => (
    <FirebaseProvider {...mockServices}>
      {children}
    </FirebaseProvider>
  );
};

describe('FirebaseProvider', () => {
  const mockFirebaseApp = {} as FirebaseApp;
  const mockFirestore = {} as Firestore;
  const mockAuth = {} as Auth;
  const mockStorage = {} as FirebaseStorage;
  
  const mockServices = {
    firebaseApp: mockFirebaseApp,
    firestore: mockFirestore,
    auth: mockAuth,
    storage: mockStorage,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock onAuthStateChanged
    const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
    mockOnAuthStateChanged.mockReturnValue(() => {});
    
    // Mock useDoc
    mockUseDoc.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
  });

  describe('Initial State', () => {
    it('should provide initial loading state', () => {
      const wrapper = createWrapper(mockServices);
      
      const { result } = renderHook(() => useUser(), { wrapper });
      
      expect(result.current.isUserLoading).toBe(true);
      expect(result.current.user).toBe(null);
      expect(result.current.userProfile).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('Authentication Flow', () => {
    it('should handle successful authentication', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        getIdToken: jest.fn().mockResolvedValue('test-token'),
      } as unknown as FirebaseUser;

      const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
      let authCallback: ((user: FirebaseUser | null) => void) | null = null;
      
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback as (user: FirebaseUser | null) => void;
        return () => {};
      });

      const wrapper = createWrapper(mockServices);
      const { result } = renderHook(() => useUser(), { wrapper });

      // Simulate successful authentication
      act(() => {
        authCallback!(mockUser);
      });

      expect(result.current.isUserLoading).toBe(false);
      expect(result.current.user).toBe(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle authentication error', async () => {
      const mockError = new Error('Authentication failed');
      
      const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
      let errorCallback: ((error: Error) => void) | null = null;
      
      mockOnAuthStateChanged.mockImplementation((auth, callback, onError) => {
        errorCallback = onError as (error: Error) => void;
        return () => {};
      });

      const wrapper = createWrapper(mockServices);
      const { result } = renderHook(() => useUser(), { wrapper });

      // Simulate authentication error
      act(() => {
        errorCallback!(mockError);
      });

      expect(result.current.isUserLoading).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.userError).toBe(mockError);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle token fetch with retry', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        getIdToken: jest.fn()
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce('test-token'),
      } as unknown as FirebaseUser;

      const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
      let authCallback: ((user: FirebaseUser | null) => void) | null = null;
      
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback as (user: FirebaseUser | null) => void;
        return () => {};
      });

      const wrapper = createWrapper(mockServices);
      const { result } = renderHook(() => useUser(), { wrapper });

      // Simulate authentication with token retry
      await act(async () => {
        authCallback!(mockUser);
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for retries
      });

      expect(mockUser.getIdToken).toHaveBeenCalledTimes(3); // 2 failures + 1 success
      expect(result.current.idToken).toBe('test-token');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should assign correct permissions for admin role', () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'admin@example.com',
      } as unknown as FirebaseUser;

      const mockUserProfile = {
        id: 'test-uid',
        authUid: 'test-uid',
        email: 'admin@example.com',
        role: 'admin' as const,
        isActive: true,
        createdAt: new Date(),
      };

      mockUseDoc.mockReturnValue({
        data: mockUserProfile,
        isLoading: false,
        error: null,
      });

      const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
      let authCallback: ((user: FirebaseUser | null) => void) | null = null;
      
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback as (user: FirebaseUser | null) => void;
        return () => {};
      });

      const wrapper = createWrapper(mockServices);
      const { result } = renderHook(() => useUser(), { wrapper });

      act(() => {
        authCallback!(mockUser);
      });

      expect(result.current.role).toBe('admin');
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.canCreate).toBe(true);
    });

    it('should assign correct permissions for viewer role', () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'viewer@example.com',
      } as unknown as FirebaseUser;

      const mockUserProfile = {
        id: 'test-uid',
        authUid: 'test-uid',
        email: 'viewer@example.com',
        role: 'viewer' as const,
        isActive: true,
        createdAt: new Date(),
      };

      mockUseDoc.mockReturnValue({
        data: mockUserProfile,
        isLoading: false,
        error: null,
      });

      const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
      let authCallback: ((user: FirebaseUser | null) => void) | null = null;
      
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback as (user: FirebaseUser | null) => void;
        return () => {};
      });

      const wrapper = createWrapper(mockServices);
      const { result } = renderHook(() => useUser(), { wrapper });

      act(() => {
        authCallback!(mockUser);
      });

      expect(result.current.role).toBe('viewer');
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.canCreate).toBe(false);
    });

    it('should assign correct permissions for salesExecutive role', () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'sales@example.com',
      } as unknown as FirebaseUser;

      const mockUserProfile = {
        id: 'test-uid',
        authUid: 'test-uid',
        email: 'sales@example.com',
        role: 'salesExecutive' as const,
        isActive: true,
        createdAt: new Date(),
      };

      mockUseDoc.mockReturnValue({
        data: mockUserProfile,
        isLoading: false,
        error: null,
      });

      const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
      let authCallback: ((user: FirebaseUser | null) => void) | null = null;
      
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback as (user: FirebaseUser | null) => void;
        return () => {};
      });

      const wrapper = createWrapper(mockServices);
      const { result } = renderHook(() => useUser(), { wrapper });

      act(() => {
        authCallback!(mockUser);
      });

      expect(result.current.role).toBe('salesExecutive');
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.canCreate).toBe(true);
    });
  });

  describe('Profile Creation', () => {
    it('should create profile for new user with viewer role', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'newuser@example.com',
        displayName: 'New User',
        photoURL: null,
      } as unknown as FirebaseUser;

      const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
      let authCallback: ((user: FirebaseUser | null) => void) | null = null;
      
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback as (user: FirebaseUser | null) => void;
        return () => {};
      });

      // Mock setDoc
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockResolvedValue(undefined);

      const wrapper = createWrapper(mockServices);
      const { result } = renderHook(() => useUser(), { wrapper });

      await act(async () => {
        authCallback!(mockUser);
        await new Promise(resolve => setTimeout(resolve, 50)); // Wait for profile creation
      });

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(), // doc ref
        expect.objectContaining({
          authUid: 'test-uid',
          email: 'newuser@example.com',
          displayName: 'New User',
          role: 'viewer', // Should default to viewer
          isActive: true,
        })
      );
    });

    it('should not create profile if one already exists', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'existing@example.com',
      } as unknown as FirebaseUser;

      const mockUserProfile = {
        id: 'test-uid',
        authUid: 'test-uid',
        email: 'existing@example.com',
        role: 'admin' as const,
        isActive: true,
        createdAt: new Date(),
      };

      mockUseDoc.mockReturnValue({
        data: mockUserProfile,
        isLoading: false,
        error: null,
      });

      const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
      let authCallback: ((user: FirebaseUser | null) => void) | null = null;
      
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback as (user: FirebaseUser | null) => void;
        return () => {};
      });

      // Mock setDoc
      const mockSetDoc = require('firebase/firestore').setDoc;
      mockSetDoc.mockResolvedValue(undefined);

      const wrapper = createWrapper(mockServices);
      const { result } = renderHook(() => useUser(), { wrapper });

      act(() => {
        authCallback!(mockUser);
      });

      // Should not attempt to create profile
      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle auth service not provided', () => {
      const invalidServices = {
        ...mockServices,
        auth: null,
      };

      const wrapper = createWrapper(invalidServices);
      const { result } = renderHook(() => useUser(), { wrapper });

      expect(result.current.isUserLoading).toBe(false);
      expect(result.current.userError).toBeInstanceOf(Error);
      expect(result.current.userError?.message).toBe('Auth service not provided.');
    });

    it('should throw error when useFirebase is called outside provider', () => {
      expect(() => {
        renderHook(() => useFirebase());
      }).toThrow('useFirebase must be used within a FirebaseProvider.');
    });
  });
});
