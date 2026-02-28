'use client';

import { useCollection, useMemoFirebase, useUser, useFirestore } from '@/firebase';
import { Query, collection, query, where, Firestore, DocumentData } from 'firebase/firestore';

/**
 * A wrapper hook for useCollection that ensures a query is only executed 
 * when a user is authenticated, and automatically provides the UID to the query builder.
 * 
 * This prevents "Missing or insufficient permissions" errors caused by 
 * listeners firing before auth state is fully resolved or without mandatory filters.
 */
export function useProtectedCollection<T = DocumentData>(
  collectionName: string,
  buildQuery: (db: Firestore, uid: string) => Query<DocumentData>
) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // The memoizedQuery itself handles the "null if not ready" logic.
  // The __memo marker required by useCollection is automatically applied by useMemoFirebase.
  const memoizedQuery = useMemoFirebase(() => {
    if (isUserLoading || !user || !firestore) return null;
    
    // We return the query built with the verified UID
    return buildQuery(firestore, user.uid);
  }, [isUserLoading, user?.uid, firestore, collectionName]);

  return useCollection<T>(memoizedQuery);
}
