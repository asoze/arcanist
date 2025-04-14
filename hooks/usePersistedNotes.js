import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const usePersistedNotes = (storageKey = 'notes', initialValue = [], onChange, skipEffectRef) => {
  const [notes, setNotes] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load notes from AsyncStorage on mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const savedNotes = await AsyncStorage.getItem(storageKey);
        if (savedNotes !== null) {
          setNotes(JSON.parse(savedNotes));
          if (!skipEffectRef?.current) {
            onChange?.(JSON.parse(savedNotes));
          }
        }
      } catch (err) {
        console.error("Failed to load notes:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [storageKey, onChange, skipEffectRef]);

  // Save notes to AsyncStorage whenever they change (after initial load)
  useEffect(() => {
    const saveNotes = async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(notes));
        if (!skipEffectRef?.current) {
          onChange?.(notes);
        }
      } catch (err) {
        console.error("Failed to save notes:", err);
        setError(err);
      }
    };

    // Only save if loading is complete to avoid saving an empty state
    if (!loading) {
      saveNotes();
    }
  }, [notes, storageKey, loading, onChange, skipEffectRef]);

  return { notes, setNotes, loading, error };
};

export default usePersistedNotes;
