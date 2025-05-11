import { useEffect, useRef } from 'react';
import { logInfo, logError, logWarning } from '../utils/logger';
const SYNC_INTERVAL_MS = 15000;
const fallbackUrl = "http://home.andrewrsweeney.com:4000";

export function useNoteSync(notes, setNotes, serverUrl) {
  const skipEffectRef = useRef(false);
  const lastSyncedAtRef = useRef(0);

  const syncNotes = async (force = false, overrideNotes = null) => {
    const now = Date.now();
    if (!serverUrl) {
      logWarning("Skipping sync: serverUrl is not set");
      return;
    }

    if (!force && now - lastSyncedAtRef.current < SYNC_INTERVAL_MS) {
      logInfo("Skipping sync: throttled");
      return;
    }

    const localNotes = overrideNotes || [...notes];
    logInfo("Syncing local notes:", localNotes);
    logInfo("Using serverUrl:", serverUrl);
    logInfo("SERVER URL ??? --|" + serverUrl + "|---");

    try {
        const attempt = await fetch(`http://home.andrewrsweeney.com:4000/notes`, {
          method: 'GET',
          headers: {'Accept': 'application/json'},
          mode: 'cors',
        });

        logInfo( "ATTEMPT -- " + attempt );

        let serverNotes;
        if (attempt.headers.get('content-type')?.includes('application/json')) {
            logInfo("Attempt JSON");
          serverNotes = await attempt.json();
        } else {
          const text = await attempt.text();
          logError(`Expected JSON but got:\n${text.substring(0, 100)}`);
          return;
        }
        logInfo("Server notes fetched", serverNotes);
        // Apply merge strategy (could be improved)
        const merged = mergeNotes(serverNotes, localNotes);
        setNotes(merged);
        lastSyncedAtRef.current = now;
        logInfo("🔄 Sync complete at " + new Date(now).toLocaleTimeString());
    } catch (err) {
      console.error(err);
      logError("Sync failed: " + (err?.message || err));
    }

  };

  const mergeNotes = (serverNotes, localNotes) => {
    const mergedMap = new Map();
    [...serverNotes, ...localNotes].forEach(note => {
      if (!note.id) return;
      const existing = mergedMap.get(note.id);
      if (!existing || (note.updatedAt > existing.updatedAt)) {
        mergedMap.set(note.id, note);
      }
    });
    return Array.from(mergedMap.values());
  };

  useEffect(() => {
    if (!skipEffectRef.current && serverUrl) {
      syncNotes(true);
    }
  }, [serverUrl]);

  return { syncNotes, skipEffectRef, lastSyncedAt: lastSyncedAtRef.current };
}

export async function testConnection() {
    logInfo("testConnection --------------------------------");
    try {
        const attempt = await fetch(`http://home.andrewrsweeney.com:4000/notes`, {
            method: 'GET',
            headers: {'Accept': 'application/json'},
            mode: 'cors',
        });

        logInfo("ATTEMPT -- " + attempt);
        return attempt;
    }catch (error) { logError( "TC\n",error);}
}
