import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { usePersistedNotes } from '../hooks/usePersistedNotes';
import { useNoteSync } from '../hooks/useNoteSync';

const initialState = {
  notes: [],
  activeTag: null,
  loading: true,
  error: null,
  lastSyncedAt: 0,
  isSyncing: false,
  syncError: null,
  isOffline: false,
  migrationComplete: false,
};

const ActionTypes = {
  SET_NOTES: 'SET_NOTES',
  ADD_NOTE: 'ADD_NOTE',
  UPDATE_NOTE: 'UPDATE_NOTE',
  DELETE_NOTE: 'DELETE_NOTE',
  SET_ACTIVE_TAG: 'SET_ACTIVE_TAG',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_LAST_SYNCED_AT: 'SET_LAST_SYNCED_AT',
  SET_IS_SYNCING: 'SET_IS_SYNCING',
  SET_SYNC_ERROR: 'SET_SYNC_ERROR',
  SET_IS_OFFLINE: 'SET_IS_OFFLINE',
  SET_MIGRATION_COMPLETE: 'SET_MIGRATION_COMPLETE',
};

// Reducer function
function notesReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_NOTES:
      return { ...state, notes: action.payload };
    case ActionTypes.ADD_NOTE:
      return { ...state, notes: [...state.notes, action.payload] };
    case ActionTypes.UPDATE_NOTE:
      return {
        ...state,
        notes: state.notes.map(note => 
          note.id === action.payload.id ? { ...note, ...action.payload } : note
        ),
      };
    case ActionTypes.DELETE_NOTE:
      return {
        ...state,
        notes: state.notes.map(note => 
          note.id === action.payload ? { ...note, deleted: true, updatedAt: Date.now() } : note
        ),
      };
    case ActionTypes.SET_ACTIVE_TAG:
      return { ...state, activeTag: action.payload };
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    case ActionTypes.SET_LAST_SYNCED_AT:
      return { ...state, lastSyncedAt: action.payload };
    case ActionTypes.SET_IS_SYNCING:
      return { ...state, isSyncing: action.payload };
    case ActionTypes.SET_SYNC_ERROR:
      return { ...state, syncError: action.payload };
    case ActionTypes.SET_IS_OFFLINE:
      return { ...state, isOffline: action.payload };
    case ActionTypes.SET_MIGRATION_COMPLETE:
      return { ...state, migrationComplete: action.payload };
    default:
      return state;
  }
}

// Create context
const NotesContext = createContext();

/**
 * Provider component for notes context
 */
export function NotesProvider({ children, serverUrl, username }) {
  const [state, dispatch] = useReducer(notesReducer, initialState);
  
  // Keep a ref to the current state for actions that need immediate access
  const stateRef = React.useRef(state);
  stateRef.current = state;
  
  // Use persisted notes hook
  const { notes: persistedNotes, setNotes: saveNotes, loading: persistedLoading } = usePersistedNotes(username);
  
  // Migration function to update old note format to new format
  const migrateNotes = useCallback((notes) => {
    if (!username) return notes; // Don't migrate if no username
    
    return notes.map(note => {
      // Skip if already migrated (has new structure)
      if (note.sharing && typeof note.sharing === 'object') {
        return note;
      }
      
      // Determine original creator and sharing status
      let createdBy = username;
      let isShared = false;
      
      if (note.username === 'All') {
        // This was a shared note, try to preserve original creator
        // For now, we'll use the current username as creator
        // In a real migration, you might have historical data
        createdBy = username;
        isShared = true;
      } else if (note.username) {
        createdBy = note.username;
        isShared = note.isGlobal || false;
      }
      
      // Create migrated note with new structure
      return {
        ...note,
        // New fields
        createdBy,
        createdAt: note.createdAt || note.updatedAt || Date.now(),
        lastModifiedBy: createdBy, // Initially same as creator
        lastModifiedOn: note.updatedAt || Date.now(),
        sharing: {
          isShared
        },
        // Keep legacy fields during transition
        username: note.username,
        isGlobal: note.isGlobal,
        updatedAt: note.updatedAt
      };
    });
  }, [username]);
  
  const {
    syncNotes: syncWithServer,
    debouncedSync,
    lastSyncedAt: syncLastSyncedAt,
    isSyncing: syncIsSyncing,
    syncError: syncSyncError,
    isOffline: syncIsOffline
  } = useNoteSync(state.notes, (notes) => {
    dispatch({ type: ActionTypes.SET_NOTES, payload: notes });
    saveNotes(notes);
  }, serverUrl);
  
  // Load notes from persisted storage and migrate if needed
  useEffect(() => {
    if (!persistedLoading && username) {
      const notes = persistedNotes || [];
      const migratedNotes = migrateNotes(notes);
      
      // Save migrated notes if migration occurred
      if (JSON.stringify(notes) !== JSON.stringify(migratedNotes)) {
        saveNotes(migratedNotes);
      }
      
      dispatch({ type: ActionTypes.SET_NOTES, payload: migratedNotes });
      dispatch({ type: ActionTypes.SET_MIGRATION_COMPLETE, payload: true });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, [persistedNotes, persistedLoading, migrateNotes, saveNotes, username]);
  
  const actions = useMemo(() => ({
    setNotes: (notes) => {
      dispatch({ type: ActionTypes.SET_NOTES, payload: notes });
      saveNotes(notes);
      debouncedSync(notes);
    },

    addNote: (note) => {
      if (!username) return null;

      const now = Date.now();
      const newNote = {
        ...note,
        id: note.id || now.toString(),
        createdBy: username,
        createdAt: now,
        lastModifiedBy: username,
        lastModifiedOn: now,
        sharing: {
          isShared: note.isGlobal || false
        },
        updatedAt: now,
        username: note.isGlobal ? 'All' : username,
        isGlobal: note.isGlobal || false,
      };
      dispatch({ type: ActionTypes.ADD_NOTE, payload: newNote });
      const updatedNotes = [...stateRef.current.notes, newNote];
      saveNotes(updatedNotes);
      debouncedSync(updatedNotes);
      return newNote;
    },

    updateNote: (id, updates) => {
      if (!username) return null;

      const now = Date.now();
      const updatedNote = {
        id,
        ...updates,
        lastModifiedBy: username,
        lastModifiedOn: now,
        sharing: {
          isShared: updates.isGlobal || false
        },
        updatedAt: now,
        username: updates.isGlobal ? 'All' : username,
        isGlobal: updates.isGlobal || false,
      };
      dispatch({ type: ActionTypes.UPDATE_NOTE, payload: updatedNote });
      const updatedNotes = stateRef.current.notes.map(note =>
        note.id === id ? { ...note, ...updatedNote } : note
      );
      saveNotes(updatedNotes);
      debouncedSync(updatedNotes);
      return updatedNote;
    },

    deleteNote: (id) => {
      dispatch({ type: ActionTypes.DELETE_NOTE, payload: id });
      const updatedNotes = stateRef.current.notes.map(note =>
        note.id === id ? { ...note, deleted: true, updatedAt: Date.now() } : note
      );
      saveNotes(updatedNotes);
      debouncedSync(updatedNotes);
    },

    setActiveTag: (tag) => dispatch({ type: ActionTypes.SET_ACTIVE_TAG, payload: tag }),

    syncWithServer: (force = false) => syncWithServer(force),
  }), [username, saveNotes, syncWithServer, debouncedSync]);
  
  const computedValues = useMemo(() => {
    const visibleNotes = state.notes.filter(n => {
      if (n.deleted) return false;
      if (!username) return false;
      
      if (n.sharing && typeof n.sharing === 'object') {
        return (n.createdBy === username) || n.sharing.isShared;
      }
      
      return (n.username === username) || (n.username === 'All');
    });
    
    const filteredNotes = state.activeTag 
      ? visibleNotes.filter(n => n.tags?.includes(state.activeTag))
      : visibleNotes;
    
    const tagSet = new Set();
    for (const note of state.notes) {
      if (note.tags && Array.isArray(note.tags)) {
        for (const tag of note.tags) {
          if (tag && typeof tag === 'string') {
            tagSet.add(tag.trim());
          }
        }
      }
    }
    const allTags = Array.from(tagSet).sort();
    
    return {
      visibleNotes: filteredNotes,
      allTags,
    };
  }, [state.notes, state.activeTag, username]);
  
  // Context value
  const value = useMemo(() => ({
    ...state,
    lastSyncedAt: syncLastSyncedAt || state.lastSyncedAt,
    isSyncing: syncIsSyncing || state.isSyncing,
    syncError: syncSyncError || state.syncError,
    isOffline: syncIsOffline || state.isOffline,
    ...computedValues,
    actions,
  }), [state, computedValues, actions, syncLastSyncedAt, syncIsSyncing, syncSyncError, syncIsOffline]);
  
  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
}

NotesProvider.propTypes = {
  children: PropTypes.node.isRequired,
  serverUrl: PropTypes.string,
  username: PropTypes.string,
};

NotesProvider.defaultProps = {
  serverUrl: null,
  username: null,
};

/**
 * Hook to use notes context
 */
export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}

export default NotesContext;
