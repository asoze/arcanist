import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import { useSettings } from '../settings/SettingsContext';
import { createApi, normalizeServerUrl } from '../sync/api';
import { applyChanges, applyPushResult, pendingPushes } from '../sync/merge';

const STORAGE_KEY = 'arcanist:notes';
const PUSH_DELAY_MS = 1500;
const POLL_INTERVAL_MS = 60000;

const NotesContext = createContext(null);

export function NotesProvider({ children }) {
  const settings = useSettings();
  const [notes, setNotes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState({ syncing: false, lastSyncedAt: null, error: null });

  // Sync and persistence read the latest state from here rather than closures.
  const store = useRef({ notes: [], cursor: 0, server: '' });
  const persistTimer = useRef(null);
  const pushTimer = useRef(null);
  const syncing = useRef(false);
  const syncAgain = useRef(false);

  const commit = useCallback((update) => {
    const next = typeof update === 'function' ? update(store.current) : update;
    store.current = { ...store.current, ...next };
    setNotes(store.current.notes);
    clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store.current)).catch(() => {});
    }, 250);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) commit(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [commit]);

  const { username, serverUrl, apiToken } = settings;

  const sync = useCallback(async () => {
    if (!serverUrl || !username) return;
    if (syncing.current) {
      syncAgain.current = true;
      return;
    }
    syncing.current = true;
    setStatus((s) => ({ ...s, syncing: true }));

    const api = createApi({ serverUrl, apiToken, username });
    const server = normalizeServerUrl(serverUrl);
    if (store.current.server !== server) {
      commit({ server, cursor: 0 });
    }

    try {
      let rejected = 0;
      for (const sent of pendingPushes(store.current.notes)) {
        try {
          const saved = sent.deleted ? await api.deleteNote(sent.id) : await api.saveNote(sent);
          commit(({ notes }) => ({ notes: applyPushResult(notes, sent, saved) }));
        } catch (err) {
          if (!err.isNoteRejected) throw err;
          rejected += 1;
        }
      }

      const changes = await api.fetchChanges(store.current.cursor);
      commit(({ notes }) => ({ notes: applyChanges(notes, changes), cursor: changes.cursor }));

      setStatus({
        syncing: false,
        lastSyncedAt: Date.now(),
        error: rejected ? `The server rejected ${rejected} note${rejected === 1 ? '' : 's'}` : null,
      });
    } catch (err) {
      setStatus((s) => ({ ...s, syncing: false, error: err.message }));
    } finally {
      syncing.current = false;
      if (syncAgain.current) {
        syncAgain.current = false;
        sync();
      }
    }
  }, [serverUrl, apiToken, username, commit]);

  const schedulePush = useCallback(() => {
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(sync, PUSH_DELAY_MS);
  }, [sync]);

  useEffect(() => {
    if (!loaded || !settings.loaded) return undefined;
    sync();
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') sync();
    }, POLL_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [loaded, settings.loaded, sync]);

  const createNote = useCallback(() => {
    const now = Date.now();
    const note = {
      id: Crypto.randomUUID(),
      title: '',
      html: '',
      tags: [],
      shared: false,
      deleted: false,
      createdBy: username,
      lastModifiedBy: username,
      createdAt: now,
      updatedAt: now,
      version: null,
      dirty: false,
      rev: 0,
    };
    commit(({ notes: current }) => ({ notes: [note, ...current] }));
    return note.id;
  }, [username, commit]);

  const updateNote = useCallback(
    (id, changes) => {
      commit(({ notes: current }) => ({
        notes: current.map((note) =>
          note.id === id
            ? { ...note, ...changes, lastModifiedBy: username, updatedAt: Date.now(), dirty: true, rev: note.rev + 1 }
            : note
        ),
      }));
      schedulePush();
    },
    [username, commit, schedulePush]
  );

  const deleteNote = useCallback(
    (id) => {
      commit(({ notes: current }) => ({
        notes: current.flatMap((note) => {
          if (note.id !== id) return [note];
          if (note.version === null) return [];
          return [{ ...note, deleted: true, dirty: true, rev: note.rev + 1 }];
        }),
      }));
      schedulePush();
    },
    [commit, schedulePush]
  );

  const visibleNotes = useMemo(
    () => notes.filter((note) => !note.deleted && (note.createdBy === username || note.shared)),
    [notes, username]
  );

  const pendingCount = useMemo(() => notes.filter((note) => note.dirty).length, [notes]);

  const value = useMemo(
    () => ({
      notes: visibleNotes,
      loaded,
      status: { ...status, pendingCount, enabled: Boolean(serverUrl && username) },
      sync,
      createNote,
      updateNote,
      deleteNote,
    }),
    [visibleNotes, loaded, status, pendingCount, serverUrl, username, sync, createNote, updateNote, deleteNote]
  );
  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  return useContext(NotesContext);
}
