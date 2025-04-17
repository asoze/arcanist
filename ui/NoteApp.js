import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Button, useColorScheme, Modal, TextInput, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NoteList from "../components/NoteList";
import NoteEditor from "../components/NoteEditor"; // Import NoteEditor
import NoteViewer from "../components/NoteViewer"; // Import NoteViewer
import ListEditor from "../components/ListEditor";
import ListViewer from "../components/ListViewer";
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
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [configMenuVisible, setConfigMenuVisible] = useState(false); // New state for config menu

  // First, load persisted notes so that 'notes' and 'setNotes' are defined
  const { notes, setNotes, loading, error } = usePersistedNotes('notes', []);

  // Now initialize the sync hook using the persisted notes values
  const { syncNotes, skipEffectRef, lastSyncedAt } = useNoteSync(notes, setNotes, serverUrl);

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

    AsyncStorage.getItem("serverUrl").then(url => {
      if (url) setServerUrl(url);
    });
  }, []);

  const saveUsername = async () => {
    if (usernameInput.trim()) {
      await AsyncStorage.setItem("username", usernameInput.trim());
      setUsername(usernameInput.trim());
      setUsernameModalVisible(false);
    }
  };

  const saveServerUrl = async () => {
    if (serverUrl.trim()) {
      await AsyncStorage.setItem("serverUrl", serverUrl.trim());
      setServerModalVisible(false);
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

  const startAddNote = (type = "note") => {
    setViewingId(null);
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditTags("");
    const newNote = {
      id: Date.now().toString(),
      title: "",
      content: type === "note" ? { text: "" } : undefined,
      tags: [],
      items: type === "list" ? [] : undefined,
      updatedAt: Date.now(),
      username: isGlobal ? "All" : username,
      type,
    };
    setNotes([...notes, newNote]);
    setEditingId(newNote.id);
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
            ...updatedFields,
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
      type: "note", // defaulting to 'note' type
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
      <View style={{ position: "absolute", top: 20, right: 20, zIndex: 5 }}>
        <Pressable
          onPress={() => setConfigMenuVisible(true)}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            backgroundColor: "transparent",
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 4,
          }}
        >
          <Text style={{ color: "#ccc", fontSize: 18 }}>☰</Text>
        </Pressable>
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

      {viewingId && (() => {
        const note = notes.find(n => n.id === viewingId);
        if (!note) return null;
        return note.type === "list" ? (
          <ListViewer
            note={note}
            onEdit={() => startEdit(note)}
            onBack={() => setViewingId(null)}
          />
        ) : (
          <NoteViewer
            note={note}
            onEdit={() => startEdit(note)}
            onBack={() => setViewingId(null)}
            isDark={isDark}
          />
        );
      })()}

      {isAdding && (() => {
        const noteBeingEdited = notes.find(n => n.id === editingId);
        const isList = noteBeingEdited?.type === "list";

        if (isList) {
          return (
            <ListEditor
              note={noteBeingEdited}
              onSave={(updatedNote) => {
                console.log("UPDANOT", updatedNote);
                saveEdit(editingId, updatedNote);
                handleCancelEdit();
              }}
              onCancel={handleCancelEdit}
            />
          );
        }

        return (
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
            originalNote={noteBeingEdited}
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
        );
      })()}

      {!isAdding && !viewingId && (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <Button title="Add Note" onPress={() => startAddNote("note")} />
          <Button title="Add List" onPress={() => startAddNote("list")} />
        </View>
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

      {lastSyncedAt && (
        <Text style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: isDark ? "#aaa" : "#888" }}>
          Last synced at: {new Date(lastSyncedAt).toLocaleTimeString()}
          {"\n"}
          Connected to: {serverUrl || "default server"}
        </Text>
      )}

      {!username && (
        <Modal visible={usernameModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Enter a username</Text>
              <TextInput
                value={usernameInput}
                onChangeText={setUsernameInput}
                placeholder="Enter your username"
                style={{ borderColor: "#ccc", borderWidth: 1, padding: 8, marginBottom: 10 }}
              />
              <View style={styles.buttonRow}>
                <Button title="Save" onPress={saveUsername} />
              </View>
            </View>
          </View>
        </Modal>
      )}

      <Modal visible={serverModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Change Server URL</Text>
            <TextInput
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="Enter server URL"
              style={{ borderColor: "#ccc", borderWidth: 1, padding: 8, marginBottom: 10 }}
            />
            <View style={styles.buttonRow}>
              <Button title="Cancel" onPress={() => setServerModalVisible(false)} />
              <View style={{ width: 10 }} />
              <Button title="Save" onPress={saveServerUrl} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={configMenuVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Settings</Text>
            <Button title="Sync Now" onPress={() => { syncNotes(true, notes); setConfigMenuVisible(false); }} />
            <View style={{ height: 10 }} />
            <Button title="Change Server URL" onPress={() => { setServerModalVisible(true); setConfigMenuVisible(false); }} />
            <View style={{ height: 20 }} />
            <Button title="Close" onPress={() => setConfigMenuVisible(false)} />
          </View>
        </View>
      </Modal>
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
