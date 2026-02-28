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

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
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
 * Layer 1 Hardening: 
 * 1. Absolute Null Guard: Never fires if query is null.
 * 2. Synchronous Unsubscribe: Prevents SDK ca9 errors on permission denial.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  const [data, setData] = useState<ResultItemType[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  const lastFailedQueryRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    // LAYER 1: ABSOLUTE NULL GUARD
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const currentQueryId = memoizedTargetRefOrQuery.type === 'collection'
      ? (memoizedTargetRefOrQuery as CollectionReference).path
      : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();

    // Prevent recursive crash on terminal permission denial
    if (lastFailedQueryRef.current === currentQueryId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    let localUnsubscribe: Unsubscribe | undefined;

    const onNext = (snapshot: QuerySnapshot<DocumentData>) => {
      const results: ResultItemType[] = [];
      snapshot.docs.forEach(doc => {
        results.push({ ...(doc.data() as T), id: doc.id });
      });
      setData(results);
      setError(null);
      setIsLoading(false);
      lastFailedQueryRef.current = null;
    };

    const onError = (firestoreError: FirestoreError) => {
      // SYNCHRONOUS SHUTDOWN: Crucial for ca9 internal SDK state stability
      if (localUnsubscribe) localUnsubscribe();
      if (unsubscribeRef.current) unsubscribeRef.current();
      
      lastFailedQueryRef.current = currentQueryId;
      
      const contextualError = new FirestorePermissionError({
        operation: 'list',
        path: currentQueryId,
      });

      setError(contextualError);
      setData(null);
      setIsLoading(false);

      errorEmitter.emit('permission-error', contextualError);
    };

    try {
      localUnsubscribe = onSnapshot(memoizedTargetRefOrQuery, onNext, onError);
      unsubscribeRef.current = localUnsubscribe;
    } catch (e) {
      setIsLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [memoizedTargetRefOrQuery]);

  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('BLUEPRINT VIOLATION: Firestore query must be properly memoized using useMemoFirebase to prevent infinite render loops.');
  }
  
  return { data, isLoading, error };
}