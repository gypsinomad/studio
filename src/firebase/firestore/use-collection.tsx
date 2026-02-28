
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  Unsubscribe,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { debugLogger } from '@/lib/debug-logger';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * GOLDEN STANDARD: React hook to subscribe to a Firestore collection or query in real-time.
 * 
 * Layer 1 Hardening: 
 * 1. Null Query Guard: Never fires without a query.
 * 2. Terminal Error Protection: Blocks recursive re-subscriptions on permission denial.
 * 3. Synchronous Shutdown: Stops listener immediately on error to prevent SDK ID: ca9 failures.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  const [data, setData] = useState<ResultItemType[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  // Track terminal query failures to prevent recursive assertion loops in SDK
  const lastFailedQueryRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    // LAYER 1 GUARD: Exit immediately if the query is null or undefined
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const currentQueryId = memoizedTargetRefOrQuery.type === 'collection'
      ? (memoizedTargetRefOrQuery as CollectionReference).path
      : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();

    // GUARD: Block re-subscription if this query instance encountered a terminal rules failure.
    if (lastFailedQueryRef.current === currentQueryId) {
      debugLogger.log('FIRESTORE', `Subscription blocked (Terminal Rules Violation): ${currentQueryId}`, 'warn');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    debugLogger.log('FIRESTORE', `Establishing listener: ${currentQueryId}`, 'debug');

    /**
     * CRITICAL: Immediate Synchronous Unsubscription.
     * We capture the unsubscribe function synchronously. If an error occurs 
     * immediately (common with locally cached metadata/rules), we must stop the 
     * listener before the React cycle finishes to avoid SDK state mismatch.
     */
    let localUnsubscribe: Unsubscribe | undefined;

    const onNext = (snapshot: QuerySnapshot<DocumentData>) => {
      const results: ResultItemType[] = [];
      snapshot.docs.forEach(doc => {
        results.push({ ...(doc.data() as T), id: doc.id });
      });
      setData(results);
      setError(null);
      setIsLoading(false);
      lastFailedQueryRef.current = null; // Success resets the failure state
    };

    const onError = (firestoreError: FirestoreError) => {
      // STOP THE LISTENER IMMEDIATELY
      if (localUnsubscribe) {
        localUnsubscribe();
      } else if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      // MARK AS TERMINAL: Prevent infinite re-subscription loops
      lastFailedQueryRef.current = currentQueryId;
      
      const contextualError = new FirestorePermissionError({
        operation: 'list',
        path: currentQueryId,
      });

      debugLogger.log('FIRESTORE', `Listener terminated due to permission denial: ${currentQueryId}`, 'error', firestoreError);
      
      setError(contextualError);
      setData(null);
      setIsLoading(false);

      // Notify the global error listener
      errorEmitter.emit('permission-error', contextualError);
    };

    try {
      localUnsubscribe = onSnapshot(memoizedTargetRefOrQuery, onNext, onError);
      unsubscribeRef.current = localUnsubscribe;
    } catch (e) {
      console.error("[useCollection] Synchronous error during onSnapshot:", e);
      setIsLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        debugLogger.log('FIRESTORE', `Cleaning up listener: ${currentQueryId}`, 'debug');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [memoizedTargetRefOrQuery]);

  // BLUEPRINT ENFORCEMENT: All Firestore queries MUST be properly memoized
  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('BLUEPRINT VIOLATION: Firestore query must be properly memoized using useMemoFirebase to prevent infinite render loops.');
  }
  
  return { data, isLoading, error };
}
