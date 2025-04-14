import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Text, Switch } from "react-native";
import TagSuggestions from "./TagSuggestions";
import Markdown from "react-native-markdown-display";
import { useColorScheme } from "react-native";
import { stringToColor } from "../utils/stringToColor";

export default function NoteEditor({
  noteTitle,
  setNoteTitle,
  noteContent,
  setNoteContent,
  tags,
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
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const [preview, setPreview] = useState(false);

  const hasChanges =
    !editingId ||
    noteTitle !== originalNote?.title ||
    noteContent !== originalNote?.content?.text ||
    tags !== (originalNote?.tags || []).join(", ");

  return (
    <View>
      <View style={styles.switchRow}>
        <Text style={{ fontSize: 16, color: isDark ? "#eee" : "#333", marginRight: 10 }}>
          Share with all users
        </Text>
        <Switch
          value={isGlobal}
          onValueChange={setIsGlobal}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isGlobal ? "#00aa00" : "#ccc"}
        />
      </View>
      {saveSuccess && (
        <Text style={{ color: "#00aa00", marginBottom: 10 }}>✅ Saved!</Text>
      )}
      <TextInput
        style={styles.input(isDark)}
        placeholder="Note title"
        value={noteTitle}
        onChangeText={setNoteTitle}
        editable={!disabled}
        selectTextOnFocus={!disabled}
      />
      <TextInput
        style={styles.input(isDark)}
        placeholder="Write a note..."
        value={noteContent}
        onChangeText={setNoteContent}
        multiline
        editable={!disabled}
        selectTextOnFocus={!disabled}
      />
      <TextInput
        style={styles.input(isDark)}
        placeholder="Add tags (comma-separated)"
        value={tags}
        onChangeText={setTags}
        editable={!disabled}
        selectTextOnFocus={!disabled}
      />

      <TagSuggestions input={tags} setInput={setTags} allTags={allTags} />
      <View style={styles.buttonRow}>
        <Button
          title={editingId ? "Save Changes" : "Add Note"}
          onPress={
            editingId && onSaveEdit
              ? () => onSaveEdit(editingId, {
                  title: noteTitle,
                  content: { text: noteContent },
                  tags: tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                  isGlobal,
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
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
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
