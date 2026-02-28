
'use client';
    
import { useState, useEffect, useRef } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { debugLogger } from '@/lib/debug-logger';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Layer 1 Hardening: Null DocRef Guard & SDK state protection.
 */
export function useDoc<T = any>(
  memoizedDocRef: (DocumentReference<DocumentData> & {__memo?: boolean}) | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  // Track document path to prevent loops on terminal failures
  const lastFailedPathRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    // LAYER 1: STRICT NULL GUARD
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const path = memoizedDocRef.path;

    if (lastFailedPathRef.current === path) {
      debugLogger.log('FIRESTORE', `Skipping blocked doc listener: ${path}`, 'warn');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    debugLogger.log('FIRESTORE', `Establishing doc listener: ${path}`, 'debug');

    let localUnsubscribe: Unsubscribe | undefined;

    const onNext = (snapshot: DocumentSnapshot<DocumentData>) => {
      if (snapshot.exists()) {
        setData({ ...(snapshot.data() as T), id: snapshot.id });
      } else {
        setData(null);
      }
      setError(null);
      setIsLoading(false);
      lastFailedPathRef.current = null;
    };

    const onError = (firestoreError: FirestoreError) => {
      // STOP IMMEDIATELY
      if (localUnsubscribe) {
        localUnsubscribe();
      } else if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      lastFailedPathRef.current = path;
      
      const contextualError = new FirestorePermissionError({
        operation: 'get',
        path: path,
      });

      debugLogger.log('FIRESTORE', `Terminal doc failure: ${path}`, 'error', firestoreError);

      setError(contextualError);
      setData(null);
      setIsLoading(false);

      errorEmitter.emit('permission-error', contextualError);
    };

    try {
      localUnsubscribe = onSnapshot(memoizedDocRef, onNext, onError);
      unsubscribeRef.current = localUnsubscribe;
    } catch (e) {
      console.error("[useDoc] Synchronous error during onSnapshot:", e);
      setIsLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        debugLogger.log('FIRESTORE', `Cleaning up doc listener: ${path}`, 'debug');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [memoizedDocRef]);

  if(memoizedDocRef && !memoizedDocRef.__memo) {
    throw new Error('Firestore DocumentReference was not properly memoized using useMemoFirebase.');
  }

  return { data, isLoading, error };
}
