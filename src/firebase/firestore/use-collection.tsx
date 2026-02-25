
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

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
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
 * Handles nullable references/queries and prevents assertion failures on permission errors.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  // Track the query ID to prevent retry loops on terminal (permission) errors
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

    // Skip if this specific query instance already failed terminal security check
    if (lastFailedQueryRef.current === currentQueryId) {
      debugLogger.log('FIRESTORE', `Skipping blocked query listener: ${currentQueryId}`, 'warn');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    debugLogger.log('FIRESTORE', `Starting listener: ${currentQueryId}`, 'debug');

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
        lastFailedQueryRef.current = null; // Clear blockage on success
      },
      (firestoreError: FirestoreError) => {
        const path: string =
          memoizedTargetRefOrQuery.type === 'collection'
            ? (memoizedTargetRefOrQuery as CollectionReference).path
            : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()

        // Terminal error handling: block further subscription attempts for this component mount
        lastFailedQueryRef.current = path;
        
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        debugLogger.log('FIRESTORE', `Terminal listener failure: ${path}`, 'error', firestoreError);
        
        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // Notify global listeners (Debug Monitor)
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => {
      debugLogger.log('FIRESTORE', `Stopping listener: ${currentQueryId}`, 'debug');
      unsubscribe();
    };
  }, [memoizedTargetRefOrQuery]);

  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('Firestore query/reference was not properly memoized using useMemoFirebase. This causes infinite render loops.');
  }
  
  return { data, isLoading, error };
}
