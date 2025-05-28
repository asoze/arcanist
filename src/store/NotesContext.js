// src/store/NotesContext.js
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { usePersistedNotes } from '../hooks/usePersistedNotes';
import { useNoteSync } from '../hooks/useNoteSync';

// Initial state
const initialState = {
  notes: [],
  activeTag: null,
  viewingId: null,
  editingId: null,
  isAdding: false,
  isGlobal: false,
  loading: true,
  error: null,
};

// Action types
const ActionTypes = {
  SET_NOTES: 'SET_NOTES',
  ADD_NOTE: 'ADD_NOTE',
  UPDATE_NOTE: 'UPDATE_NOTE',
  DELETE_NOTE: 'DELETE_NOTE',
  SET_ACTIVE_TAG: 'SET_ACTIVE_TAG',
  SET_VIEWING_ID: 'SET_VIEWING_ID',
  SET_EDITING_ID: 'SET_EDITING_ID',
  SET_IS_ADDING: 'SET_IS_ADDING',
  SET_IS_GLOBAL: 'SET_IS_GLOBAL',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
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
    case ActionTypes.SET_VIEWING_ID:
      return { ...state, viewingId: action.payload, editingId: null, isAdding: false };
    case ActionTypes.SET_EDITING_ID:
      return { ...state, editingId: action.payload, viewingId: null, isAdding: true };
    case ActionTypes.SET_IS_ADDING:
      return { ...state, isAdding: action.payload };
    case ActionTypes.SET_IS_GLOBAL:
      return { ...state, isGlobal: action.payload };
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// Create context
const NotesContext = createContext();

/**
 * Provider component for notes state
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.serverUrl - Server URL for synchronization
 * @param {string} props.username - Current username
 * @returns {React.ReactNode}
 */
export function NotesProvider({ children, serverUrl, username }) {
  const [state, dispatch] = useReducer(notesReducer, initialState);
  
  // Use persisted notes hook
  const { 
    notes: persistedNotes, 
    setNotes: setPersistedNotes, 
    loading, 
    error 
  } = usePersistedNotes('notes', []);
  
  // Use note sync hook
  const { 
    syncNotes, 
    debouncedSync, 
    skipEffectRef, 
    lastSyncedAt,
    isSyncing,
    syncError,
    isOffline
  } = useNoteSync(state.notes, (notes) => {
    setPersistedNotes(notes);
    dispatch({ type: ActionTypes.SET_NOTES, payload: notes });
  }, serverUrl);
  
  // Update state when persisted notes change
  useEffect(() => {
    dispatch({ type: ActionTypes.SET_NOTES, payload: persistedNotes });
    dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
    dispatch({ type: ActionTypes.SET_ERROR, payload: error || syncError });
  }, [persistedNotes, loading, error, syncError]);
  
  // Track last notes update time to prevent too frequent syncs
  const lastNotesUpdateRef = useRef(0);
  
  // Sync notes when they change, but not too frequently
  useEffect(() => {
    if (!skipEffectRef?.current && state.notes.length > 0 && !loading) {
      const now = Date.now();
      // Only sync if it's been at least 30 seconds since the last update
      if (now - lastNotesUpdateRef.current > 30000) {
        debouncedSync(state.notes);
        lastNotesUpdateRef.current = now;
      }
    }
  }, [state.notes, debouncedSync, skipEffectRef, loading]);
  
  // Actions
  const actions = {
    setNotes: (notes) => {
      dispatch({ type: ActionTypes.SET_NOTES, payload: notes });
    },
    
    addNote: (note) => {
      const newNote = {
        ...note,
        id: note.id || Date.now().toString(),
        updatedAt: Date.now(),
        username: state.isGlobal ? 'All' : username,
      };
      dispatch({ type: ActionTypes.ADD_NOTE, payload: newNote });
      return newNote;
    },
    
    updateNote: (id, updates) => {
      const updatedNote = {
        id,
        ...updates,
        updatedAt: Date.now(),
        username: updates.isGlobal ? 'All' : username,
      };
      dispatch({ type: ActionTypes.UPDATE_NOTE, payload: updatedNote });
      return updatedNote;
    },
    
    deleteNote: (id) => {
      dispatch({ type: ActionTypes.DELETE_NOTE, payload: id });
    },
    
    setActiveTag: (tag) => {
      dispatch({ type: ActionTypes.SET_ACTIVE_TAG, payload: tag });
    },
    
    viewNote: (id) => {
      dispatch({ type: ActionTypes.SET_VIEWING_ID, payload: id });
    },
    
    editNote: (id) => {
      dispatch({ type: ActionTypes.SET_EDITING_ID, payload: id });
    },
    
    startAddNote: () => {
      dispatch({ type: ActionTypes.SET_EDITING_ID, payload: null });
      dispatch({ type: ActionTypes.SET_IS_ADDING, payload: true });
    },
    
    cancelEdit: () => {
      dispatch({ type: ActionTypes.SET_EDITING_ID, payload: null });
      dispatch({ type: ActionTypes.SET_IS_ADDING, payload: false });
    },
    
    setIsGlobal: (isGlobal) => {
      dispatch({ type: ActionTypes.SET_IS_GLOBAL, payload: isGlobal });
    },
    
    syncWithServer: (force = false) => {
      syncNotes(force, state.notes);
    },
  };
  
  // Computed values
  const visibleNotes = state.activeTag
    ? state.notes.filter(
        n => 
          n.tags?.includes(state.activeTag) && 
          !n.deleted && 
          (n.username === username || n.username === 'All')
      )
    : state.notes.filter(
        n => 
          !n.deleted && 
          (n.username === username || n.username === 'All')
      );
  
  const allTags = Array.from(
    new Set(state.notes.flatMap(note => note.tags || []))
  ).sort();
  
  const currentNote = state.viewingId 
    ? state.notes.find(n => n.id === state.viewingId)
    : state.editingId
      ? state.notes.find(n => n.id === state.editingId)
      : null;
  
  // Context value
  const value = {
    ...state,
    visibleNotes,
    allTags,
    currentNote,
    lastSyncedAt,
    isSyncing,
    isOffline,
    actions,
  };
  
  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
}

/**
 * Hook to use notes context
 * @returns {Object} Notes context value
 */
export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}

export default NotesContext;
