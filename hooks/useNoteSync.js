import { useEffect, useRef } from 'react';
import { logInfo, logError } from '../utils/logger';
import { fetchNotesFromServer } from '../utils/fetchNotes';
import { reconcile } from '../utils/reconcile';
import { pushNotesToServer } from '../utils/pushNotesToServer';

const SYNC_INTERVAL_MS = 15_000;

export function useNoteSync(notes, setNotes, serverUrl) {
    const lastSyncedAtRef = useRef(0);

    const syncNotes = async (force = false, overrideNotes = null) => {
        const now = Date.now();
        if (!force && now - lastSyncedAtRef.current < SYNC_INTERVAL_MS) return;

        const local = overrideNotes || notes;

        try {
            const remote = await fetchNotesFromServer(serverUrl);
            const { merged, pushUpstream } = reconcile(local, remote);

            // POST only the diverging/local‑newer notes
            await pushNotesToServer(serverUrl, pushUpstream);

            setNotes(merged);
            lastSyncedAtRef.current = now;
            logInfo(`Sync complete — ${merged.length} total notes`);
        } catch (err) {
            logError(`Sync failed: ${err.message}`);
        }
    };

    useEffect(() => { if (serverUrl) syncNotes(true); }, [serverUrl]);

    return { syncNotes, lastSyncedAt: lastSyncedAtRef.current };
}
