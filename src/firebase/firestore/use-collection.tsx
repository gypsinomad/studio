
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
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
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Includes "Terminal Error" hardening to prevent internal assertion failed loops.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  // Track query state to prevent retry loops on terminal (permission) errors
  const lastFailedQueryRef = useRef<string | null>(null);

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

    // SKIP: If this query instance already failed with a permission error
    if (lastFailedQueryRef.current === currentQueryId) {
      debugLogger.log('FIRESTORE', `Skipping blocked query listener: ${currentQueryId}`, 'warn');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    debugLogger.log('FIRESTORE', `Starting collection listener: ${currentQueryId}`, 'debug');

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
        lastFailedQueryRef.current = null; // Reset terminal state on success
      },
      (firestoreError: FirestoreError) => {
        // TERMINAL ERROR: Block further re-subscriptions for this instance
        lastFailedQueryRef.current = currentQueryId;
        
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: currentQueryId,
        });

        debugLogger.log('FIRESTORE', `Terminal listener failure: ${currentQueryId}`, 'error', firestoreError);
        
        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // Notify Debug Monitor
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => {
      debugLogger.log('FIRESTORE', `Stopping listener: ${currentQueryId}`, 'debug');
      unsubscribe();
    };
  }, [memoizedTargetRefOrQuery]);

  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('Firestore query was not properly memoized using useMemoFirebase. This causes infinite render loops.');
  }
  
  return { data, isLoading, error };
}
