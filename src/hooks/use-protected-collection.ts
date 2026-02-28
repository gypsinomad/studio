'use client';

import { useCollection, useMemoFirebase, useUser, useFirestore } from '@/firebase';
import { Query, collection, query, where, Firestore, DocumentData } from 'firebase/firestore';

/**
 * Architectural Guard: Prevents useCollection from firing before UID is ready.
 * This is the primary defense against permission errors on owner-based collections.
 */
export function useProtectedCollection<T = DocumentData>(
  collectionName: string,
  buildQuery: (db: Firestore, uid: string) => Query<DocumentData>
) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const memoizedQuery = useMemoFirebase(() => {
    // If user is loading or not authenticated, keep the query null
    // This prevents the underlying hook from ever attempting a call to Firestore
    if (isUserLoading || !user || !firestore) return null;
    
    return buildQuery(firestore, user.uid);
  }, [isUserLoading, user?.uid, firestore, collectionName]);

  return useCollection<T>(memoizedQuery);
}