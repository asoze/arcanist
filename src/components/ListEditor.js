import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Switch, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Checkbox } from 'react-native-paper';

import { useThemeContext as useTheme } from '../store/ThemeContext';
import { stringToColor } from 'arcanist-common';
import { createTagStyles } from '../styles/tagStyles';
import { Button } from './common/Button';
import TagSuggestions from './TagSuggestions';
import { useNotes } from '../store/NotesContext';

export default function ListEditor({ note, onSave, onCancel, isGlobal, setIsGlobal }) {
  const { theme } = useTheme();
  const { allTags } = useNotes();
  const styles = createStyles(theme);
  const tagStyles = createTagStyles(theme);

  const [title, setTitle] = useState(note.title || "");
  const [items, setItems] = useState(note.items || []);
  const [newItem, setNewItem] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemText, setEditingItemText] = useState("");
  const [tags, setTags] = useState((note.tags || []).join(", "));
  const [localIsGlobal, setLocalIsGlobal] = useState(
    note.sharing?.isShared || note.isGlobal || note.username === 'All' || false
  );

  const addItem = () => {
    const current = newItem.trim();
    if (!current) return;
    const newId = Date.now().toString();
    const newEntry = { id: newId, text: current, checked: false };
    setItems([...items, newEntry]);
    setNewItem("");
    setEditingItemId(null);
    setEditingItemText("");
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = tags
      .split(",")
      .map(t => t.trim())
      .filter(t => t && t !== tagToRemove)
      .join(", ");
    setTags(updatedTags);
  };

  const save = () => {
    const nonEmptyItems = items.filter(i => i.text.trim() !== "");
    onSave({
      ...note,
      title,
      items: nonEmptyItems,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      type: "list",
      updatedAt: Date.now(),
      isGlobal: localIsGlobal
    });
  }

  return (
      <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Share with all users
              </Text>
              <Switch
                  value={localIsGlobal}
                  onValueChange={setLocalIsGlobal}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={localIsGlobal ? theme.colors.success : theme.colors.subtext}
              />
            </View>

            <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="List Title"
                placeholderTextColor={theme.colors.subtext}
                style={styles.titleInput}
            />

            <TextInput
                value={tags}
                onChangeText={setTags}
                placeholder="Add tags (comma-separated)"
                placeholderTextColor={theme.colors.subtext}
                style={styles.input}
            />

            <View style={tagStyles.tagContainer}>
              {tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .map((tag) => (
                      <View key={tag} style={[tagStyles.tag, { backgroundColor: stringToColor(tag) }]}>
                        <Text style={tagStyles.tagText}>
                          {tag}
                        </Text>
                        <Pressable onPress={() => handleRemoveTag(tag)} style={styles.tagRemoveButton}>
                          <Text style={styles.tagRemove}>
                            ×
                          </Text>
                        </Pressable>
                      </View>
                  ))}
            </View>

            <TagSuggestions input={tags} setInput={setTags} allTags={allTags} />

            {items.map((item) => (
                <View key={item.id} style={styles.listItem}>
                  <Checkbox
                      status={item.checked ? "checked" : "unchecked"}
                      onPress={() => {
                        const updated = items.map(i =>
                            i.id === item.id ? { ...i, checked: !i.checked } : i
                        );
                        setItems(updated);
                      }}
                  />
                  {editingItemId === item.id ? (
                      <>
                        <TextInput
                            value={editingItemText}
                            onChangeText={setEditingItemText}
                            style={styles.editInput}
                            placeholderTextColor={theme.colors.subtext}
                        />
                        <Button
                            title="Save"
                            onPress={() => {
                              setItems(items.map(i =>
                                  i.id === item.id ? { ...i, text: editingItemText } : i
                              ));
                              setEditingItemId(null);
                              setEditingItemText("");
                            }}
                        />
                      </>
                  ) : (
                      <>
                        <Pressable
                            style={styles.itemTextContainer}
                            onPress={() => {
                              setEditingItemId(item.id);
                              setEditingItemText(item.text);
                            }}
                        >
                          <Text
                              style={[
                                styles.itemText,
                                item.checked && styles.checkedText
                              ]}
                          >
                            {item.text}
                          </Text>
                        </Pressable>
                        <Button
                            title="×"
                            variant="danger"
                            onPress={() => removeItem(item.id)}
                        />
                      </>
                  )}
                </View>
            ))}

            <View style={styles.addItemContainer}>
              <TextInput
                  value={newItem}
                  onChangeText={setNewItem}
                  placeholder="New item"
                  placeholderTextColor={theme.colors.subtext}
                  style={styles.newItemInput}
                  onSubmitEditing={addItem}
                  returnKeyType="done"
                  blurOnSubmit={false}
              />
              <Button title="Add Item" onPress={addItem} />
            </View>

            <View style={styles.buttonContainer}>
              <Button title="Save List" onPress={save} />
              <Button title="Cancel" onPress={onCancel} variant="secondary" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm + 2,
  },
  switchLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginRight: theme.spacing.sm + 2,
  },
  titleInput: {
    fontSize: 18,
    marginBottom: theme.spacing.sm + 4,
    color: theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: theme.spacing.sm + 2,
    marginBottom: theme.spacing.sm + 2,
    borderRadius: theme.roundness - 2,
    fontSize: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: theme.spacing.sm + 2,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagText: {
    color: "#fff",
    marginRight: theme.spacing.xs + 2,
  },
  tagRemove: {
    color: "#ccc",
    fontWeight: "bold",
  },
  tagRemoveButton: {
    marginLeft: 4,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  editInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginLeft: theme.spacing.sm,
    color: theme.colors.text,
    paddingVertical: theme.spacing.xs,
  },
  itemTextContainer: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  itemText: {
    color: theme.colors.text,
    fontSize: 16,
  },
  checkedText: {
    textDecorationLine: "line-through",
    color: theme.colors.subtext,
  },
  addItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  newItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    color: theme.colors.text,
    borderRadius: theme.roundness - 2,
  },
  buttonContainer: {
    marginTop: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm + 2,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});
