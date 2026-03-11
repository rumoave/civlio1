/**
 * React Hooks for Civly Sync Service
 * Provides easy integration with sync service throughout the app
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import syncService from './syncService';

/**
 * Hook to listen to sync events for a specific data type
 */
export function useSyncListener(syncType) {
  const [syncData, setSyncData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [changes, setChanges] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = syncService.subscribe(event => {
      if (event.type === syncType) {
        setIsSyncing(event.syncState.isSyncing);
        setLastSync(event.syncState.lastSync);
        setSyncData(event.data);
        setChanges(event.changes);
        
        if (event.changes?.error) {
          setError(event.changes.error);
        } else {
          setError(null);
        }
      }
    });

    return unsubscribe;
  }, [syncType]);

  return { syncData, isSyncing, lastSync, changes, error };
}

/**
 * Hook to manage sync for a specific section/tab
 * Starts sync when component mounts, stops when unmounts
 */
export function useSectionSync(syncType, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    syncService.startSync(syncType);

    return () => {
      // Don't stop immediately - sync might be needed elsewhere
      // Only stop if this is the only component using it
    };
  }, [syncType, enabled]);

  return useCallback(() => {
    return syncService.manualSync(syncType);
  }, [syncType]);
}

/**
 * Hook to manage home page background syncing
 * Starts bills and members sync in background
 */
export function useHomeSync() {
  useEffect(() => {
    syncService.startHomeSync();

    // Cleanup is handled by sync service to keep syncing if navigating away
    return () => {
      // Home page syncing continues
    };
  }, []);

  const billsSync = useSyncListener('bills');
  const membersSync = useSyncListener('members');

  return {
    bills: billsSync,
    members: membersSync,
  };
}

/**
 * Hook to manage Court tab syncing (loads on demand)
 */
export function useCourtSync() {
  useEffect(() => {
    syncService.startSync('scotus');

    return () => {
      // Keep syncing in background
    };
  }, []);

  return useSyncListener('scotus');
}

/**
 * Hook for getting current sync status
 */
export function useSyncStatus(syncType) {
  const [syncState, setSyncState] = useState(() => 
    syncService.getSyncState(syncType)
  );

  useEffect(() => {
    const unsubscribe = syncService.subscribe(event => {
      if (event.type === syncType) {
        setSyncState(event.syncState);
      }
    });

    return unsubscribe;
  }, [syncType]);

  return syncState;
}

/**
 * Hook to initialize sync service with user subscription status
 * Should be called once in App or auth component
 */
export function useSyncInitialization(isSubscribed) {
  useEffect(() => {
    syncService.initialize(isSubscribed);
    
    // Request notification permission if subscribed
    if (isSubscribed) {
      syncService.constructor.requestNotificationPermission();
    }
  }, [isSubscribed]);
}

/**
 * Hook to get formatted last sync time
 */
export function useLastSyncTime(syncType) {
  const { lastSync } = useSyncListener(syncType);
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!lastSync) {
      setTimeAgo('Never');
      return;
    }

    const updateTime = () => {
      const seconds = Math.floor((Date.now() - lastSync) / 1000);
      
      if (seconds < 60) {
        setTimeAgo('Just now');
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes}m ago`);
      } else {
        const hours = Math.floor(seconds / 3600);
        setTimeAgo(`${hours}h ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lastSync]);

  return timeAgo;
}

/**
 * Hook to listen to in-app toast notifications
 */
export function useNotificationListener() {
  const [notification, setNotification] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleNotification = (event) => {
      setNotification({
        type: event.detail.type,
        message: event.detail.message,
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Auto-hide after 5 seconds
      timeoutRef.current = setTimeout(() => {
        setNotification(null);
      }, 5000);
    };

    window.addEventListener('civly-notification', handleNotification);

    return () => {
      window.removeEventListener('civly-notification', handleNotification);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const dismiss = useCallback(() => {
    setNotification(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { notification, dismiss };
}
