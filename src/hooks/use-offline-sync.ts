'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const firestore = useFirestore();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending actions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('offlineActions');
    if (stored) {
      setPendingActions(JSON.parse(stored));
    }
  }, []);

  // Save pending actions to localStorage
  useEffect(() => {
    if (pendingActions.length > 0) {
      localStorage.setItem('offlineActions', JSON.stringify(pendingActions));
    }
  }, [pendingActions]);

  // Add action to queue
  const addOfflineAction = useCallback((
    type: OfflineAction['type'],
    collection: string,
    data: any
  ) => {
    const action: OfflineAction = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      collection,
      data,
      timestamp: Date.now(),
      synced: false
    };

    setPendingActions(prev => [...prev, action]);
    return action.id;
  }, []);

  // Sync pending actions when online
  const syncPendingActions = useCallback(async () => {
    if (!isOnline || !firestore || syncInProgress || pendingActions.length === 0) {
      return;
    }

    setSyncInProgress(true);
    const unsyncedActions = pendingActions.filter(action => !action.synced);

    try {
      for (const action of unsyncedActions) {
        try {
          switch (action.type) {
            case 'create':
              await setDoc(doc(firestore, action.collection, action.data.id), action.data);
              break;
            case 'update':
              await updateDoc(doc(firestore, action.collection, action.data.id), action.data);
              break;
            case 'delete':
              await deleteDoc(doc(firestore, action.collection, action.data.id));
              break;
          }

          // Mark as synced
          setPendingActions(prev => 
            prev.map(a => a.id === action.id ? { ...a, synced: true } : a)
          );
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
        }
      }
    } finally {
      setSyncInProgress(false);
    }
  }, [isOnline, firestore, syncInProgress, pendingActions]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncPendingActions();
    }
  }, [isOnline, pendingActions.length, syncPendingActions]);

  // Clear synced actions
  useEffect(() => {
    const syncedActions = pendingActions.filter(action => action.synced);
    if (syncedActions.length > 0) {
      setTimeout(() => {
        setPendingActions(prev => prev.filter(action => !action.synced));
        localStorage.setItem('offlineActions', JSON.stringify(
          pendingActions.filter(action => !action.synced)
        ));
      }, 5000); // Keep synced actions for 5 seconds before clearing
    }
  }, [pendingActions]);

  return {
    isOnline,
    pendingActions: pendingActions.filter(action => !action.synced),
    syncInProgress,
    addOfflineAction,
    syncPendingActions,
    clearPendingActions: () => {
      setPendingActions([]);
      localStorage.removeItem('offlineActions');
    }
  };
};
