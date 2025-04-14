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
    tagBadge: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: 12,
      color: "#fff",
      fontSize: 12,
      marginRight: 4,
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
              <Text style={styles.noteTitle}>{item.title}</Text>
              {item.content?.text && (
                <Text style={styles.preview}>
                  {item.content.text.split(" ").slice(0, 5).join(" ")}...
                </Text>
              )}
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
              <View style={styles.tagsContainer}>
                {item.tags?.map((tag, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.tagBadge,
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
            </>
          )}
        </Pressable>

        {!isEditing && (
          <View style={styles.actionButtons}>
            <Button title="Delete" onPress={() => deleteNote(item.id)} />
          </View>
        )}
      </View>
    );
  };

  const sortedNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
      <View style={styles.buttonRow}>
        <Button title="Add Note" onPress={onStartAdd} />
      </View>
      <FlatList
        data={sortedNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.list}
      />
    </>
  );
}
