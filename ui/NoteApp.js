import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Button, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NoteList from "../components/NoteList";
import NoteEditor from "../components/NoteEditor"; // Import NoteEditor
import NoteViewer from "../components/NoteViewer"; // Import NoteViewer
import { useNoteSync } from "../hooks/useNoteSync";
import usePersistedNotes from "../hooks/usePersistedNotes";

export default function NoteApp() {
  const syncTimeout = useRef(null);
  const [username, setUsername] = useState(null);
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [isGlobal, setIsGlobal] = useState(false); // New state for global sharing
  const [isAdding, setIsAdding] = useState(false); // New state for editing mode
  const [viewingId, setViewingId] = useState(null); // New state for viewing mode

  // First, load persisted notes so that 'notes' and 'setNotes' are defined
  const { notes, setNotes, loading, error } = usePersistedNotes('notes', []);

  // Now initialize the sync hook using the persisted notes values
  const { syncNotes, skipEffectRef } = useNoteSync(notes, setNotes);

  // Define a debounced sync function
  const debouncedSync = useCallback((notesToSync) => {
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(() => {
      syncNotes(false, notesToSync);
    }, 1000);
  }, [syncNotes]);

  // Trigger debounced sync whenever 'notes' changes (if not intentionally skipped)
  useEffect(() => {
    if (!skipEffectRef.current) {
      debouncedSync(notes);
    }
  }, [notes, debouncedSync, skipEffectRef]);

  const [activeTag, setActiveTag] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  useEffect(() => {
    const fallback = "testuser";
    AsyncStorage.setItem("username", fallback).then(() => {
      setUsername(fallback);
    });
  }, []);

  const saveUsername = async () => {
    if (usernameInput.trim()) {
      await AsyncStorage.setItem("username", usernameInput.trim());
      setUsername(usernameInput.trim());
      setUsernameModalVisible(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      syncNotes(true, notes); // ensures loaded notes are used after loading finishes
    }
  }, [loading]);

  const allTags = Array.from(
    new Set(notes.flatMap((note) => note.tags || [])),
  ).sort();

  const deleteNote = (id) => {
    const updatedNotes = notes.map(n =>
      n.id === id ? { ...n, deleted: true, updatedAt: Date.now(), username: n.username } : n
    );
    setNotes(updatedNotes);
    syncNotes(false, updatedNotes);
  };

  const startEdit = (note) => {
    setViewingId(null); // Exit view mode
    setEditingId(note.id);
    setEditTitle(note.title || "");
    setEditContent(note.content?.text || "");
    const safeTags = (note.tags || [])
      .map((t) => String(t).trim())
      .filter(Boolean);
    setEditTags(safeTags.join(", "));
    setIsAdding(true); // Set to true when editing
  };

  const startAddNote = () => {
    setViewingId(null);
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditTags("");
    setIsAdding(true);
  };

  const viewNote = (noteId) => {
    setViewingId(noteId);
    setIsAdding(false);
    setEditingId(null);
  };

  const saveEdit = (id, updatedFields) => {

      const updatedNotes = notes.map((n) =>
      n.id === id
        ? {
            ...n,
            title: updatedFields.title,
            content: updatedFields.content,
            tags: updatedFields.tags,
            username: updatedFields.isGlobal ? "All" : username,
            updatedAt: Date.now(),
          }
        : n
    );

    setNotes(updatedNotes);
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditTags("");
    setIsAdding(false);

    syncNotes(true, updatedNotes);
  };

  const handleAddNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: editTitle.trim(),
      content: { text: editContent.trim() },
      tags: editTags.split(",").map(t => t.trim()).filter(Boolean),
      updatedAt: Date.now(),
      username: isGlobal ? "All" : username,
    };
    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    setEditTitle("");
    setEditContent("");
    setEditTags("");
    setIsAdding(false);
    syncNotes(true, updatedNotes);
  };

  const handleCancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditTags("");
  };

  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const visibleNotes = activeTag
    ? notes.filter(n =>
        n.tags?.includes(activeTag) &&
        !n.deleted &&
        (n.username === username || n.username === "All")
      )
    : notes.filter(n =>
        !n.deleted &&
        (n.username === username || n.username === "All")
      );

  if (!username || loading) return <Text style={styles.title}>Loading notes…</Text>;
  if (error) return <Text style={styles.title}>Error loading notes.</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.syncTopRight}>
        <Button title="Sync Now" onPress={() => syncNotes(true, notes)} />
      </View>

      <Text style={styles.title}>Arcanist</Text>

      {activeTag && (
        <View style={styles.filterBanner}>
          <Text style={styles.filterText}>Filtering by tag:</Text>
          <Text style={[styles.filterTag, styles.filterText]}>{activeTag}</Text>
          <Text onPress={() => setActiveTag(null)} style={styles.clearFilter}>
            ✕ Clear Filter
          </Text>
        </View>
      )}

      {viewingId && (
        <NoteViewer
          note={notes.find(n => n.id === viewingId)}
          onEdit={() => startEdit(notes.find(n => n.id === viewingId))}
          onBack={() => setViewingId(null)}
          isDark={isDark}
        />
      )}

      {isAdding && (
        <NoteEditor
          noteTitle={editTitle}
          setNoteTitle={setEditTitle}
          noteContent={editContent}
          setNoteContent={setEditContent}
          tags={editTags}
          setTags={setEditTags}
          allTags={allTags}
          isGlobal={isGlobal}
          setIsGlobal={setIsGlobal}
          editingId={editingId}
          originalNote={notes.find(n => n.id === editingId)}
          onAdd={
            editingId
              ? () => {
                  saveEdit(editingId, {
                    title: editTitle,
                    content: { text: editContent },
                    tags: editTags.split(",").map(t => t.trim()).filter(Boolean),
                    isGlobal,
                  });
                  handleCancelEdit();
                }
              : handleAddNote
          }
          onCancel={handleCancelEdit}
        />
      )}

      {!isAdding && !viewingId && (
        <NoteList
          notes={visibleNotes}
          startEdit={startEdit}
          deleteNote={deleteNote}
          activeTag={activeTag}
          setActiveTag={setActiveTag}
          allTags={allTags}
          stringToColor={stringToColor}
          placeholderTextColor={isDark ? "#aaa" : "#000"}
          textColor={isDark ? "#aaa" : "#888"}
          onStartAdd={startAddNote}
          onViewNote={viewNote}
        />
      )}

      {/* usernameModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Enter your username</Text>
            <TextInput
              style={styles.input}
              value={usernameInput}
              onChangeText={setUsernameInput}
              placeholder="Username"
              placeholderTextColor={isDark ? "#888" : "#666"}
            />
            <Button title="Save" onPress={saveUsername} />
          </View>
        </View>
      ) */}
    </View>
  );
}

const createStyles = (isDark) =>
  StyleSheet.create({
    container: {
      padding: 20,
      marginTop: 40,
      flex: 1,
      backgroundColor: isDark ? "#2b2b2b" : "#ffffff",
    },
    title: {
      fontSize: 24,
      marginBottom: 20,
      color: isDark ? "#eee" : "#000000",
    },
    filterBanner: {
      marginBottom: 10,
      padding: 10,
      backgroundColor: isDark ? "#333" : "#eef",
      borderRadius: 8,
    },
    filterText: {
      color: isDark ? "#eee" : "#000",
      marginBottom: 4,
    },
    filterTag: {
      fontWeight: "bold",
      color: isDark ? "#66aaff" : "#3366cc",
    },
    clearFilter: {
      color: "#cc3333",
      marginTop: 6,
    },
    syncTopRight: {
      position: "absolute",
      top: 20,
      right: 20,
      zIndex: 5,
    },
    buttonRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 10,
    },
    modalOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    modal: {
      backgroundColor: "#fff",
      padding: 20,
      borderRadius: 10,
      width: "80%",
    },
    modalTitle: {
      fontSize: 18,
      marginBottom: 10,
    },
  });
