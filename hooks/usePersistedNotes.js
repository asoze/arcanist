// usePersistedNotes.js (patched)
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function usePersistedNotes(key, initialValue) {
  const [state, setState] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(key)
        .then((value) => {
          console.log("[usePersistedNotes] Loaded from AsyncStorage:", value);
          if (value) {
            try {
              setState(JSON.parse(value));
            } catch (parseErr) {
              console.log("[usePersistedNotes] JSON parse error:", parseErr);
              setError(parseErr);
            }
          }
          setLoading(false);
        })
        .catch((err) => {
          console.log("[usePersistedNotes] AsyncStorage error:", err);
          setError(err);
          setLoading(false);
        });
  }, [key]);

  return { notes: state, setNotes: setState, loading, error };
}
