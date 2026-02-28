
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
 * Features:
 * 1. Terminal Error Hardening: Blocks re-subscription on permission failures.
 * 2. Lifecycle Logging: Streams starts, stops, and errors to Debug Monitor.
 * 3. Race Condition Protection: Ensures only the latest listener is active.
 * 4. Assertion Protection: Prevents SDK "Unexpected State" errors by stopping streams immediately on error.
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
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const currentQueryId = memoizedTargetRefOrQuery.type === 'collection'
      ? (memoizedTargetRefOrQuery as CollectionReference).path
      : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();

    // GUARD: If this query instance is blocked due to rules violation, skip subscription
    if (lastFailedQueryRef.current === currentQueryId) {
      debugLogger.log('FIRESTORE', `Skipping blocked listener (Terminal Error): ${currentQueryId}`, 'warn');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    debugLogger.log('FIRESTORE', `Starting listener: ${currentQueryId}`, 'debug');

    // Use a local variable to capture the unsubscribe function immediately
    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        snapshot.docs.forEach(doc => {
          results.push({ ...(doc.data() as T), id: doc.id });
        });
        setData(results);
        setError(null);
        setIsLoading(false);
        lastFailedQueryRef.current = null; // Success resets terminal state
      },
      (firestoreError: FirestoreError) => {
        // Stop the listener IMMEDIATELY to prevent SDK internal assertion errors (ca9)
        // the unsubscribe function is returned by onSnapshot synchronously.
        if (unsubscribe) unsubscribe();
        
        // TERMINAL FAILURE: Block further re-subscriptions for this instance
        lastFailedQueryRef.current = currentQueryId;
        
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: currentQueryId,
        });

        debugLogger.log('FIRESTORE', `Terminal listener failure (Permission Denied): ${currentQueryId}`, 'error', firestoreError);
        
        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // Notify Global Debug Monitor
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        debugLogger.log('FIRESTORE', `Stopping listener: ${currentQueryId}`, 'debug');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [memoizedTargetRefOrQuery]);

  // BLUEPRINT ENFORCEMENT: All queries passed to this hook MUST be memoized
  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('BLUEPRINT VIOLATION: Firestore query must be properly memoized using useMemoFirebase to prevent infinite render loops.');
  }
  
  return { data, isLoading, error };
}
