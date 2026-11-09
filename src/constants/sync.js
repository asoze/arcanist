/**
 * Sync-related constants
 */

/** 60 seconds when app is active (safety net; pushes happen reactively on edit). */
export const SYNC_INTERVAL_ACTIVE_MS = 60_000;

/** 5 minutes when app is in background. */
export const SYNC_INTERVAL_BACKGROUND_MS = 300_000;

/** 30 minutes when offline (retry attempts) */
export const SYNC_INTERVAL_OFFLINE_MS = 1800_000;

/** Max retries for sync operations */
export const SYNC_MAX_RETRIES = 3;

/** Exponential backoff factor for retries */
export const SYNC_BACKOFF_FACTOR = 2;

/** Debounce delay before triggering sync (ms) */
export const SYNC_DEBOUNCE_MS = 1000;

/** Delay before clearing isSyncing state to prevent flicker (ms) */
export const SYNC_IS_SYNCING_CLEAR_DELAY_MS = 500;
