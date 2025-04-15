import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Text, Switch, Platform, Pressable } from "react-native";
import TagSuggestions from "./TagSuggestions";
import Markdown from "react-native-markdown-display";
import { useColorScheme } from "react-native";
import { stringToColor } from "../utils/stringToColor";
import { tagStyles } from "../styles/tagStyles";

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
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const applyFormatting = (symbol) => {
    const start = selection.start;
    const end = selection.end;
    const selectedText = noteContent.slice(start, end);

    const newText =
      noteContent.slice(0, start) +
      symbol + selectedText + symbol +
      noteContent.slice(end);

    setNoteContent(newText);

    // Update selection to sit after inserted symbols
    const offset = symbol.length;
    setSelection({
      start: start + offset,
      end: end + selectedText.length + offset,
    });
  };

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
        selectTextOnFocus={disabled}
      />
      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <Button title="B" onPress={() => applyFormatting("**")} />
        <Button title="I" onPress={() => applyFormatting("_")} />
        <Button title="S" onPress={() => applyFormatting("~~")} />
        <Button title="•" onPress={() => {
          const prefix = "- ";
          const start = selection.start;
          const end = selection.end;
          const before = noteContent.slice(0, start);
          const after = noteContent.slice(end);
          const selected = noteContent.slice(start, end);

          const newText =
            before +
            prefix +
            selected +
            after;

          setNoteContent(newText);
          const offset = prefix.length;
          setSelection({
            start: start + offset,
            end: end + offset,
          });
        }} />
      </View>
      <TextInput
        style={styles.input(isDark)}
        placeholder="Write a note..."
        value={noteContent}
        onChangeText={setNoteContent}
        multiline
        editable={!disabled}
        numberOfLines={12}
        textAlignVertical="top"
        selectTextOnFocus={disabled}
        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
      />
      <TextInput
        style={styles.input(isDark)}
        placeholder="Add tags (comma-separated)"
        value={tags}
        onChangeText={setTags}
        editable={!disabled}
        selectTextOnFocus={disabled}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
        {tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .map((tag) => (
            <View key={tag} style={[tagStyles.tag, { flexDirection: "row", alignItems: "center" }]}>
              <Text style={{ color: "#fff", marginRight: 6 }}>
                {tag}
              </Text>
              <Pressable onPress={() => {
                const updatedTags = tags
                  .split(",")
                  .map(t => t.trim())
                  .filter(t => t && t !== tag)
                  .join(", ");
                setTags(updatedTags);
              }}>
                <Text style={{ color: "#ccc", fontWeight: "bold" }}>
                  ×
                </Text>
              </Pressable>
            </View>
          ))}
      </View>
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
