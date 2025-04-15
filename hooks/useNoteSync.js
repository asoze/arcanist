import { useRef, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";

const SYNC_INTERVAL_MS = 30 * 1000;
const REMOTE_URL = "http://192.168.68.50:4000/notes"; // use your LAN IP on mobile

export function useNoteSync(notes, setNotes) {
  const lastSyncRef = useRef(0);
  const isMergingRef = useRef(false); // prevent onChange-triggered loops
  const mergeTimeoutRef = useRef(null); // debounce timer
  const skipEffectRef = useRef(false); // prevent triggering onChange during syncing merges
  const [lastSyncedAt, setLastSyncedAt] = useState(null); // New state for last sync time

  useEffect(() => {
    AsyncStorage.getItem("lastSyncAt").then((stored) => {
      if (stored) {
        setLastSyncedAt(Number(stored)); // Restore last sync time from storage
      }
    });
  }, []);

  const syncNotes = async (force = false, overrideNotes = null) => {
    try {
      const now = Date.now();
      const lastSync = lastSyncRef.current;

      if (!force && now - lastSync < SYNC_INTERVAL_MS) {
        console.log("Skipping sync: throttled");
        return;
      }

      const localNotes = overrideNotes || [...notes];

      console.log("🔄 Posting notes to server...");
      const postRes = await fetch(REMOTE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localNotes),
      });

      if (!postRes.ok) throw new Error(`POST failed: ${postRes.status}`);

      await new Promise((resolve) => setTimeout(resolve, 300));

      console.log("📥 Fetching notes from server...");
      const response = await fetch(REMOTE_URL);
      if (!response.ok) throw new Error(`GET failed: ${response.status}`);

      const remoteNotes = await response.json();

      const mergedMap = new Map();
      const allNotes = [...remoteNotes, ...localNotes];

      for (const note of allNotes) {
        const existing = mergedMap.get(note.id);
        if (!existing || note.updatedAt > existing.updatedAt) {
          mergedMap.set(note.id, note);
        }
      }

      const mergedNotes = Array.from(mergedMap.values()).filter(note => !note.deleted);

      isMergingRef.current = true;
      skipEffectRef.current = true; // Set to true during syncing
      setNotes(mergedNotes);
      lastSyncRef.current = now;
      setLastSyncedAt(now); // Update lastSyncedAt after successful sync
      await AsyncStorage.setItem("lastSyncAt", now.toString());
      isMergingRef.current = false;
      skipEffectRef.current = false; // Reset after syncing

      // Replace final POST with debounce
      if (mergeTimeoutRef.current) clearTimeout(mergeTimeoutRef.current);
      mergeTimeoutRef.current = setTimeout(() => {
        fetch(REMOTE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mergedNotes),
        }).then((res) => {
          if (!res.ok) throw new Error(`Debounced POST failed: ${res.status}`);
          console.log("✅ Debounced merged notes pushed");
        }).catch((err) => {
          console.warn("❌ Debounced push error:", err.message);
        });
      }, 1000);

      console.log(`✅ Sync complete with ${mergedNotes.length} notes`);
    } catch (err) {
      console.warn("❌ Sync error:", err.message);
    }
  };

  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log("📶 Network reconnected — syncing notes...");
        syncNotes(true);
      }
    });

    const handleAppStateChange = (state) => {
      if (state === "active") {
        console.log("📲 App resumed — syncing notes...");
        syncNotes(true);
      }
    };

    const appStateSub = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      unsubscribeNet();
      appStateSub.remove();
    };
  }, []);

  return { syncNotes, skipEffectRef, lastSyncedAt }; // Export lastSyncedAt
}
