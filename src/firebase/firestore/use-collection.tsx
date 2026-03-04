'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
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

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Layer 1 Hardening: 
 * 1. Absolute Null Guard: Never fires if query is null.
 * 2. Synchronous Unsubscribe: Prevents SDK ca9 errors on permission denial.
 */
export function useCollection<T = any>(
    queryRef: Query<DocumentData> | null,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  const [data, setData] = useState<ResultItemType[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  const lastFailedQueryRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    // CRITICAL: LAYER 1 HARDENING - ABSOLUTE NULL GUARD
    if (!queryRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const currentQueryId =
    (queryRef as any)?._query?.path?.canonicalString?.() ??
    queryRef?.toString() ??
    'unknown-query';
  

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

      // For permission-related issues, log but do NOT trigger global Recovery Mode.
      if (
        firestoreError.code === 'permission-denied' ||
        firestoreError.message.includes('Missing or insufficient permissions')
      ) {
        console.error('[useCollection] Permission error while subscribing to collection:', firestoreError);
        return;
      }

      errorEmitter.emit('permission-error', contextualError);
    };

    try {
      localUnsubscribe = onSnapshot(queryRef, onNext, onError);
      unsubscribeRef.current = localUnsubscribe;
    } catch (e) {
      console.error("[useCollection] Synchronous error during setup:", e);
      setIsLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [queryRef]);

  return { data, isLoading, error };
}