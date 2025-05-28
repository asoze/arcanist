import React, { useState, useEffect, useRef } from "react";
import { View, TextInput, Button, StyleSheet, Text, Switch, Platform, Pressable } from "react-native";
import TagSuggestions from "./TagSuggestions";
import Markdown from "react-native-markdown-display";
import { useColorScheme } from "react-native";
import { stringToColor } from "../utils/stringToColor";
import { tagStyles } from "../styles/tagStyles";

export default function NoteEditor({
  noteTitle: initialNoteTitle,
  setNoteTitle,
  noteContent: initialNoteContent,
  setNoteContent,
  tags: initialTags,
  setTags,
  allTags,
  onAdd,
  onCancel,
  editingId,
  onSaveEdit,
  originalNote,
  isGlobal,
  setIsGlobal,
  disabled,
  saveSuccess,
}) {
  // Use local state to track changes
  const [localTitle, setLocalTitle] = useState(initialNoteTitle);
  const [localContent, setLocalContent] = useState(initialNoteContent);
  const [localTags, setLocalTags] = useState(initialTags);
  const [localIsGlobal, setLocalIsGlobal] = useState(originalNote?.isGlobal || false);
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const [preview, setPreview] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  
  // Auto-save functionality
  const autoSaveTimeoutRef = useRef(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  // Calculate if there are changes (moved before useEffect to avoid temporal dead zone)
  const hasChanges =
    !editingId ||
    localTitle !== originalNote?.title ||
    localContent !== originalNote?.content?.text ||
    localTags !== (originalNote?.tags || []).join(", ");
  
  // Auto-save effect - saves changes after 2 seconds of inactivity
  useEffect(() => {
    // DISABLED: Auto-save functionality temporarily disabled
    if (false && editingId && onSaveEdit && hasChanges) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        setIsAutoSaving(true);
        onSaveEdit(editingId, {
          title: localTitle,
          content: { text: localContent },
          tags: localTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          isGlobal: localIsGlobal,
        });
        setTimeout(() => setIsAutoSaving(false), 1000); // Show saving indicator for 1 second
      }, 2000); // Auto-save after 2 seconds of inactivity
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [localTitle, localContent, localTags, localIsGlobal, editingId, onSaveEdit, hasChanges]);

  const applyFormatting = (symbol) => {
    const start = selection.start;
    const end = selection.end;
    const selectedText = localContent.slice(start, end);

    const newText =
      localContent.slice(0, start) +
      symbol + selectedText + symbol +
      localContent.slice(end);

    setLocalContent(newText);

    // Update selection to sit after inserted symbols
    const offset = symbol.length;
    setSelection({
      start: start + offset,
      end: end + selectedText.length + offset,
    });
  };

  return (
    <View>
      <View style={styles.switchRow}>
        <Text style={{ fontSize: 16, color: isDark ? "#eee" : "#333", marginRight: 10 }}>
          Share with all users
        </Text>
        <Switch
          value={localIsGlobal}
          onValueChange={setLocalIsGlobal}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={localIsGlobal ? "#00aa00" : "#ccc"}
        />
      </View>
      {saveSuccess && (
        <Text style={{ color: "#00aa00", marginBottom: 10 }}>✅ Saved!</Text>
      )}
      {isAutoSaving && (
        <Text style={{ color: "#007bff", marginBottom: 10 }}>💾 Auto-saving...</Text>
      )}
      <TextInput
        style={styles.input(isDark)}
        placeholder="Note title"
        value={localTitle}
        onChangeText={setLocalTitle}
        editable={!disabled}
        selectTextOnFocus={disabled}
      />
      
      {/* Tag section - moved to top */}
      <TextInput
        style={styles.input(isDark)}
        placeholder="Add tags (comma-separated)"
        value={localTags}
        onChangeText={setLocalTags}
        editable={!disabled}
        selectTextOnFocus={disabled}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
        {localTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .map((tag) => (
            <View key={tag} style={[tagStyles.tag, { backgroundColor: stringToColor(tag), flexDirection: "row", alignItems: "center" }]}>
              <Text style={{ color: "#fff", marginRight: 6 }}>
                {tag}
              </Text>
              <Pressable onPress={() => {
                const updatedTags = localTags
                  .split(",")
                  .map(t => t.trim())
                  .filter(t => t && t !== tag)
                  .join(", ");
                setLocalTags(updatedTags);
              }}>
                <Text style={{ color: "#ccc", fontWeight: "bold" }}>
                  ×
                </Text>
              </Pressable>
            </View>
          ))}
      </View>
      <TagSuggestions input={localTags} setInput={setLocalTags} allTags={allTags} />
      
      <View style={styles.formattingButtons}>
        <Pressable style={styles.formatButton} onPress={() => applyFormatting("**")}>
          <Text style={styles.formatButtonText}>B</Text>
        </Pressable>
        <Pressable style={styles.formatButton} onPress={() => applyFormatting("_")}>
          <Text style={styles.formatButtonText}>I</Text>
        </Pressable>
        <Pressable style={styles.formatButton} onPress={() => applyFormatting("~~")}>
          <Text style={styles.formatButtonText}>S</Text>
        </Pressable>
        <Pressable style={styles.formatButton} onPress={() => {
          const prefix = "- ";
          const start = selection.start;
          const end = selection.end;
          const before = localContent.slice(0, start);
          const after = localContent.slice(end);
          const selected = localContent.slice(start, end);

          const newText =
            before +
            prefix +
            selected +
            after;

          setLocalContent(newText);
          const offset = prefix.length;
          setSelection({
            start: start + offset,
            end: end + offset,
          });
        }}>
          <Text style={styles.formatButtonText}>•</Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.input(isDark)}
        placeholder="Write a note..."
        value={localContent}
        onChangeText={setLocalContent}
        multiline
        editable={!disabled}
        numberOfLines={12}
        textAlignVertical="top"
        selectTextOnFocus={disabled}
        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
      />
      <View style={styles.buttonRow}>
        <Button
          title={editingId ? "Save Note" : "Add Note"}
          onPress={
            editingId && onSaveEdit
              ? () => onSaveEdit(editingId, {
                  title: localTitle,
                  content: { text: localContent },
                  tags: localTags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                  isGlobal: localIsGlobal,
                })
              : onAdd
          }
          disabled={!hasChanges || disabled}
        />
        {onCancel && <Button title="Cancel" onPress={onCancel} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: (isDark) => ({
    borderWidth: 1,
    borderColor: isDark ? "#555" : "#ccc",
    backgroundColor: isDark ? "#333" : "#fff",
    color: isDark ? "#eee" : "#000",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  }),
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "65%",
    alignSelf: "flex-end",
    gap: 10,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  formattingButtons: {
    flexDirection: "row",
    marginBottom: 10,
    gap: 8,
  },
  formatButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  formatButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

const markdownStyles = {
  body: {
    color: "#333",
    fontSize: 14,
  },
  heading1: { fontSize: 24, marginBottom: 8 },
  heading2: { fontSize: 20, marginBottom: 6 },
  link: { color: "#3366cc" },
};
