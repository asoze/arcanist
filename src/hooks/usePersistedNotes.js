// src/hooks/usePersistedNotes.js
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logInfo, logError } from '../utils/logger';

/**
 * Custom hook for persisting notes to AsyncStorage
 * @param {string} key - Storage key for the notes
 * @param {Array} initialValue - Initial value if no stored data exists
 * @returns {Object} Notes state and functions
 */
export function usePersistedNotes(key, initialValue = []) {
  const [notes, setNotesState] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load notes from AsyncStorage on mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(key);
        // Don't log normal operations
        
        if (storedValue) {
          try {
            const parsedValue = JSON.parse(storedValue);
            setNotesState(parsedValue);
          } catch (parseErr) {
            logError("[usePersistedNotes] JSON parse error:", parseErr);
            setError(parseErr);
          }
        }
      } catch (err) {
        logError("[usePersistedNotes] AsyncStorage error:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [key]);

  // Save notes to AsyncStorage whenever they change
  const setNotes = useCallback((newNotes) => {
    setNotesState(newNotes);
    
    // Persist to AsyncStorage
    AsyncStorage.setItem(key, JSON.stringify(newNotes))
      .then(() => {/* Don't log normal operations */})
      .catch(err => logError("[usePersistedNotes] Failed to save to AsyncStorage:", err));
  }, [key]);

  // Clear all notes
  const clearNotes = useCallback(() => {
    setNotesState(initialValue);
    
    AsyncStorage.removeItem(key)
      .then(() => {/* Don't log normal operations */})
      .catch(err => logError("[usePersistedNotes] Failed to clear AsyncStorage:", err));
  }, [key, initialValue]);

  return { 
    notes, 
    setNotes, 
    clearNotes,
    loading, 
    error 
  };
}

export default usePersistedNotes;
