// src/hooks/useNoteSync.js
import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { logInfo, logError } from '../utils/logger';
import { NotesAPI } from '../services/api';
import { reconcile } from '../utils/reconcile';

// Adaptive sync intervals based on app state and platform
const SYNC_INTERVALS = {
  ACTIVE: 600_000,     // 10 minutes when app is active (for all platforms)
  BACKGROUND: 1800_000, // 30 minutes when app is in background
  LOW_BATTERY: 1800_000, // 30 minutes when battery is low
  OFFLINE: 1800_000     // 30 minutes when offline (for retry attempts)
};

// Sync retry configuration
const SYNC_RETRY = {
  MAX_RETRIES: 3,
  BACKOFF_FACTOR: 2,
};

/**
 * Custom hook for note synchronization with server with adaptive sync strategy
 * @param {Array} notes - Local notes array
 * @param {Function} setNotes - Function to update notes
 * @param {string} serverUrl - Server URL for synchronization
 * @returns {Object} Sync functions and state
 */
export function useNoteSync(notes, setNotes, serverUrl) {
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false); // Use a ref to track syncing state to prevent race conditions
  const [syncError, setSyncError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [syncInterval, setSyncInterval] = useState(SYNC_INTERVALS.ACTIVE);
  const [retryCount, setRetryCount] = useState(0);
  
  const skipEffectRef = useRef(false);
  const syncTimeoutRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const lastSyncedNotesRef = useRef([]);
  const isSyncingTimeoutRef = useRef(null);

  /**
   * Check device connectivity and update state
   */
  const checkConnectivity = useCallback(async () => {
    try {
      const connected = await NotesAPI.isConnected();
      setIsOffline(!connected);
      return connected;
    } catch (error) {
      logError('Error checking connectivity:', error);
      setIsOffline(true);
      return false;
    }
  }, []);

  /**
   * Update sync interval based on app state and device conditions
   */
  const updateSyncInterval = useCallback(async (appState) => {
    // Check connectivity first
    const isConnected = await checkConnectivity();
    
    if (!isConnected) {
      setSyncInterval(SYNC_INTERVALS.OFFLINE);
      return;
    }
    
    // Set interval based on app state
    if (appState === 'active') {
      setSyncInterval(SYNC_INTERVALS.ACTIVE);
    } else {
      setSyncInterval(SYNC_INTERVALS.BACKGROUND);
    }
    
    // Note: For a real app, we would also check battery level here
    // and use SYNC_INTERVALS.LOW_BATTERY if battery is low
  }, [checkConnectivity]);

  /**
   * Handle app state changes
   */
  const handleAppStateChange = useCallback((nextAppState) => {
    if (appStateRef.current !== nextAppState) {
      // App state changes don't need to be logged
      appStateRef.current = nextAppState;
      updateSyncInterval(nextAppState);
      
      // If app becomes active, trigger a sync
      if (nextAppState === 'active') {
        syncNotes(true);
      }
    }
  }, [updateSyncInterval]);

  /**
   * Check if notes have changed since last sync
   */
  const haveNotesChanged = useCallback(() => {
    if (lastSyncedNotesRef.current.length !== notes.length) return true;
    
    // Check if any note has been updated since last sync
    for (const note of notes) {
      const lastSyncedNote = lastSyncedNotesRef.current.find(n => n.id === note.id);
      if (!lastSyncedNote || lastSyncedNote.updatedAt !== note.updatedAt) {
        return true;
      }
    }
    
    return false;
  }, [notes]);

  /**
   * Debounced set isSyncing to prevent flickering
   */
  const setIsSyncingDebounced = useCallback((value) => {
    if (isSyncingTimeoutRef.current) {
      clearTimeout(isSyncingTimeoutRef.current);
    }
    
    if (value === true) {
      // Set to true immediately
      setIsSyncing(true);
    } else {
      // Delay setting to false to prevent flickering
      isSyncingTimeoutRef.current = setTimeout(() => {
        setIsSyncing(false);
      }, 500);
    }
  }, []);

  /**
   * Synchronize notes with the server with retry logic
   * @param {boolean} force - Force sync regardless of interval
   * @param {Array} overrideNotes - Optional notes array to use instead of current state
   */
  const syncNotes = useCallback(async (force = false, overrideNotes = null) => {
    const now = Date.now();
    if (!force && now - lastSyncedAt < syncInterval) return;
    if (!serverUrl) return;
    
    // Prevent multiple simultaneous syncs using the ref
    if (isSyncingRef.current) return;
    
    // Set the ref to true to prevent other sync attempts
    isSyncingRef.current = true;
    
    // Only sync if notes have changed or forced
    if (!force && !haveNotesChanged()) return;
    
    setIsSyncingDebounced(true);
    setSyncError(null);
    skipEffectRef.current = true;
    
    try {
      // Check connectivity first
      const isConnected = await checkConnectivity();
      if (!isConnected) {
        throw new Error('Device is offline');
      }
      
      const local = overrideNotes || notes;
      const remote = await NotesAPI.fetchNotes(serverUrl);
      const { merged, pushUpstream } = reconcile(local, remote);

      // POST only the diverging/local‑newer notes
      if (pushUpstream.length > 0) {
        await NotesAPI.pushNotes(serverUrl, pushUpstream);
      }

      setNotes(merged);
      setLastSyncedAt(now);
      setRetryCount(0); // Reset retry count on success
      
      // Update lastSyncedNotes reference
      lastSyncedNotesRef.current = JSON.parse(JSON.stringify(merged));
      
      // Success doesn't need to be logged
    } catch (err) {
      logError(`Sync failed: ${err.message}`);
      setSyncError(err.message);
      
      // Handle offline errors differently
      if (err.isOffline || err.message.includes('offline')) {
        setIsOffline(true);
      } else {
        // Increment retry count for non-offline errors
        setRetryCount(prev => prev + 1);
      }
    } finally {
      setIsSyncingDebounced(false);
      skipEffectRef.current = false;
      
      // Release the sync lock after a delay to prevent rapid re-triggering
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 1000);
    }
  }, [notes, serverUrl, setNotes, lastSyncedAt, isSyncing, syncInterval, checkConnectivity, haveNotesChanged, setIsSyncingDebounced]);

  /**
   * Debounced sync function to prevent too frequent syncs
   */
  const debouncedSync = useCallback((notesToSync) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      syncNotes(false, notesToSync);
    }, 1000);
  }, [syncNotes]);

  // Set up app state change listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Initial connectivity and interval check
    updateSyncInterval(AppState.currentState);
    
    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange, updateSyncInterval]);

  // Initial sync when component mounts and serverUrl is available
  useEffect(() => {
    if (serverUrl && notes.length > 0 && !isSyncing) {
      syncNotes(true);
    }
  }, [serverUrl, notes.length, isSyncing, syncNotes]);

  // Set up periodic sync based on current interval
  useEffect(() => {
    // Don't set up periodic sync if offline or retry count exceeded
    if (isOffline || retryCount > SYNC_RETRY.MAX_RETRIES) return;
    
    const intervalId = setInterval(() => {
      // Only sync if notes have changed or it's been a long time since last sync
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncedAt;
      
      if (haveNotesChanged() || timeSinceLastSync > syncInterval * 3) {
        syncNotes();
      }
    }, syncInterval);
    
    return () => clearInterval(intervalId);
  }, [syncInterval, syncNotes, isOffline, retryCount, haveNotesChanged, lastSyncedAt]);

  // Retry logic for offline mode
  useEffect(() => {
    if (isOffline) {
      // Exponential backoff for retries
      const retryDelay = Math.min(
        SYNC_INTERVALS.OFFLINE * Math.pow(SYNC_RETRY.BACKOFF_FACTOR, retryCount),
        300000 // Max 5 minutes
      );
      
      // Offline retry doesn't need to be logged
      
      const retryTimeout = setTimeout(() => {
        checkConnectivity().then(connected => {
          if (connected) {
            syncNotes(true);
          }
        });
      }, retryDelay);
      
      return () => clearTimeout(retryTimeout);
    }
  }, [isOffline, retryCount, checkConnectivity, syncNotes]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (isSyncingTimeoutRef.current) {
        clearTimeout(isSyncingTimeoutRef.current);
      }
    };
  }, []);

  return { 
    syncNotes, 
    debouncedSync, 
    skipEffectRef, 
    lastSyncedAt,
    isSyncing,
    syncError,
    isOffline
  };
}
