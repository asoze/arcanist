import { useEffect, useRef } from 'react';
import { logInfo, logError } from '../utils/logger';
import { fetchNotesFromServer } from '../utils/fetchNotes';
import { mergeNotes } from '../utils/mergeNotes';

const SYNC_INTERVAL_MS = 15000;

export function useNoteSync(notes, setNotes, serverUrl) {
    // Ignore serverUrl for right now

    const skipEffectRef = useRef(false);
    const lastSyncedAtRef = useRef(0);

    const syncNotes = async (force = false, overrideNotes = null) => {
        const now = Date.now();

        if (!force && now - lastSyncedAtRef.current < SYNC_INTERVAL_MS) {
            // logInfo("Skipping sync: throttled");
            return;
        }

        const localNotes = overrideNotes || [...notes];
        logInfo("Syncing local notes:", localNotes.length);

        try {
            const serverNotes = await fetchNotesFromServer();
            logInfo("Server notes fetched", serverNotes.length);

            const merged = mergeNotes(serverNotes, localNotes);
            setNotes(merged);
            lastSyncedAtRef.current = now;
            logInfo("🔄 Sync complete at " + new Date(now).toLocaleTimeString());
        } catch (err) {
            console.error(err);
            logError("Sync failed: " + (err?.message || err));
        }
    };

    useEffect(() => {
        if (!skipEffectRef.current) {
            syncNotes(true);
        }
    }, [serverUrl]);

    return { syncNotes, skipEffectRef, lastSyncedAt: lastSyncedAtRef.current };
}
