import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  useColorScheme,
  Pressable,
} from "react-native";
import TagSuggestions from "./TagSuggestions";
import Markdown from "react-native-markdown-display";
import NoteEditor from "./NoteEditor"; // Assuming NoteEditor is imported
import { stringToColor } from "../utils/stringToColor";
import { tagStyles } from "../styles/tagStyles";

const stripMarkdownLists = (text) => {
  return text
    .replace(/(^|\n)(\s*[-*+] .*)+/g, '') // unordered lists
    .replace(/(^|\n)(\s*\d+\.\s+.*)+/g, ''); // ordered lists
};

export default function NoteList({
  notes,
  editingId,
  editTitle,
  setEditTitle,
  editContent,
  setEditContent,
  editTags,
  setEditTags,
  startEdit,
  saveEdit,
  deleteNote,
  activeTag,
  setActiveTag,
  allTags,
  onStartAdd,
  onViewNote,
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const styles = StyleSheet.create({
    list: { marginTop: 20 },
    input: {
      borderWidth: 1,
      borderColor: isDark ? "#444" : "#ccc",
      backgroundColor: isDark ? "#333" : "#fff",
      padding: 10,
      marginBottom: 10,
      borderRadius: 6,
      color: isDark ? "#eee" : "#000",
    },
    noteItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderColor: "#eee",
    },
    noteText: {
      flex: 1,
      color: isDark ? "#eee" : "#000",
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 4,
    },
    activeTag: {
      borderWidth: 1,
      borderColor: "white",
    },
    sharedLabel: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#00aa00",
      marginBottom: 4,
    },
    noteTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 2,
      color: isDark ? "#fff" : "#000",
    },
    preview: {
      fontStyle: "italic",
      color: isDark ? "#aaa" : "#555",
      marginBottom: 4,
    },
    actionButtons: {
      flexDirection: "row",
      gap: 8,
      backgroundColor: "#f00",
      color: "#fff"
    },
    timestamp: {
      fontSize: 11,
      color: isDark ? "#999" : "#888",
      marginBottom: 4,
    },
    buttonRow: {
      flexDirection: "row",
      justifyContent: "flex-start",
      marginTop: 20,
    },
    touchable: {
      flex: 1,
      borderRadius: 6,
      padding: 6,
    },
    touchLight: {
      backgroundColor: "#eee",
    },
    touchDark: {
      backgroundColor: "#444",
    },
    hoverLight: {
      backgroundColor: "#f0f0f0",
    },
    hoverDark: {
      backgroundColor: "#333",
    },
  });

  const markdownStyles = {
    body: {
      color: isDark ? "#eee" : "#000",
      fontSize: 14,
    },
    heading1: { fontSize: 24, marginBottom: 8 },
    heading2: { fontSize: 20, marginBottom: 6 },
    link: { color: "#3366cc" },
  };

  const renderItem = ({ item }) => {
    const isEditing = editingId === item.id;

    return (
      <View style={styles.noteItem}>
        <Pressable
          style={({ pressed, hovered }) => [
            styles.touchable,
            pressed && (isDark ? styles.touchDark : styles.touchLight),
            hovered && !pressed && (isDark ? styles.hoverDark : styles.hoverLight),
          ]}
          onPress={() => onViewNote(item.id)}
        >
          {isEditing ? (
            <>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Edit title"
              />
              <TextInput
                style={styles.input}
                value={editContent}
                onChangeText={setEditContent}
                placeholder="Edit note content"
                multiline
              />
              <TextInput
                style={styles.input}
                value={editTags}
                onChangeText={setEditTags}
                placeholder="Edit tags (comma-separated)"
              />
              <TagSuggestions
                input={editTags}
                setInput={setEditTags}
                allTags={allTags}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Button title="Save" onPress={() => saveEdit(item.id)} />
                <Button
                  title="Cancel"
                  onPress={() => {
                    setEditingId(null);
                    setEditTitle("");
                    setEditContent("");
                    setEditTags("");
                  }}
                />
              </View>
            </>
          ) : (
            <>
              {item.username === "All" && <Text style={styles.sharedLabel}>🌐 Shared</Text>}
              <Text style={styles.noteTitle}>
                {item.type === "list" ? "🧾 " : "📝 "}
                {item.title}
              </Text>
              {item.type === "list" ? (
                <Text style={styles.preview}>{(item.items?.length || 0)} items</Text>
              ) : (
                item.content?.text && (
                  <Markdown style={{ body: styles.preview }}>
                    {stripMarkdownLists(item.content.text.split(" ").slice(0, 40).join(" ") + "...")}
                  </Markdown>
                )
              )}
              <View style={styles.tagsContainer}>
                {item.tags?.map((tag, i) => (
                  <Text
                    key={i}
                    style={[
                      tagStyles.tag,
                      { backgroundColor: stringToColor(tag) },
                      activeTag === tag && styles.activeTag,
                    ]}
                    onPress={(event) => {
                      event.stopPropagation();
                      setActiveTag(tag);
                    }}
                  >
                    {tag}
                  </Text>
                ))}
              </View>
              <Text style={styles.timestamp}>
                {new Date(item.updatedAt).toLocaleString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </Text>
            </>
          )}
        </Pressable>

        {!isEditing && (
          <View style={styles.actionButtons}>
            <Pressable
              onPress={() => deleteNote(item.id)}
              style={{
                backgroundColor: "#cc3333",
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>X</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const sortedNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
      <FlatList
        data={sortedNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.list}
      />
    </>
  );
}
