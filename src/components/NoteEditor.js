import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, TextInput, StyleSheet, Text, Switch, Pressable, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';

import { useThemeContext as useTheme } from '../store/ThemeContext';
import { useResponsiveLayout } from './common/ResponsiveContainer';
import { stringToColor } from 'arcanist-common';
import { createTagStyles } from '../styles/tagStyles';
import { Button } from './common/Button';
import TagSuggestions from './TagSuggestions';

// Memoized formatting buttons component
const FormattingButtons = React.memo(({ onApplyFormatting, theme }) => {
  const formatButtons = useMemo(() => [
    { symbol: "**", label: "B", title: "Bold" },
    { symbol: "_", label: "I", title: "Italic" },
    { symbol: "~~", label: "S", title: "Strikethrough" },
    { symbol: "- ", label: "•", title: "List", isPrefix: true },
  ], []);

  const formatButtonStyle = useMemo(() => ({
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.roundness,
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  }), [theme]);

  return (
    <View style={styles.formattingButtons}>
      {formatButtons.map(({ symbol, label, title, isPrefix }) => (
        <Pressable
          key={symbol}
          style={formatButtonStyle}
          onPress={() => onApplyFormatting(symbol, isPrefix)}
          accessibilityLabel={title}
          accessibilityRole="button"
        >
          <Text style={styles.formatButtonText}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
});

// Memoized tag display component
const TagDisplay = React.memo(({ tags, onRemoveTag, theme }) => {
  const tagArray = useMemo(() => 
    tags.split(",").map(tag => tag.trim()).filter(Boolean), 
    [tags]
  );

  const tagStyles = useMemo(() => createTagStyles(theme), [theme]);

  if (tagArray.length === 0) return null;

  return (
    <View style={tagStyles.tagContainer}>
      {tagArray.map((tag) => (
        <View key={tag} style={[tagStyles.tag, { backgroundColor: stringToColor(tag) }]}>
          <Text style={tagStyles.tagText}>{tag}</Text>
          <Pressable 
            onPress={() => onRemoveTag(tag)}
            accessibilityLabel={`Remove ${tag} tag`}
            accessibilityRole="button"
            style={styles.tagRemoveButton}
          >
            <Text style={styles.tagRemove}>×</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
});

export default function NoteEditor({
  noteTitle: initialNoteTitle,
  noteContent: initialNoteContent,
  tags: initialTags,
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
  // Centralized theme usage
  const { isDark, theme } = useTheme();
  
  // Simplified state management - only local state
  const [title, setTitle] = useState(initialNoteTitle || '');
  const [content, setContent] = useState(initialNoteContent || '');
  const [tags, setTags] = useState(initialTags || '');
  const [localIsGlobal, setLocalIsGlobal] = useState(
    originalNote?.sharing?.isShared || originalNote?.isGlobal || originalNote?.username === 'All' || false
  );
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  
  // Initialize state when props change
  useEffect(() => {
    setTitle(initialNoteTitle || '');
    setContent(initialNoteContent || '');
    setTags(initialTags || '');
    setLocalIsGlobal(
      originalNote?.sharing?.isShared || originalNote?.isGlobal || originalNote?.username === 'All' || false
    );
  }, [initialNoteTitle, initialNoteContent, initialTags, originalNote?.sharing?.isShared, originalNote?.isGlobal, originalNote?.username]);
  
  // Calculate if there are changes
  const hasChanges = useMemo(() => {
    if (!editingId) return true; // New note always has changes
    const originalIsGlobal = originalNote?.sharing?.isShared || originalNote?.isGlobal || originalNote?.username === 'All' || false;
    return (
      title !== (originalNote?.title || '') ||
      content !== (originalNote?.content?.text || '') ||
      tags !== ((originalNote?.tags || []).join(", ")) ||
      localIsGlobal !== originalIsGlobal
    );
  }, [title, content, tags, localIsGlobal, editingId, originalNote]);

  // Memoized formatting function
  const applyFormatting = useCallback((symbol, isPrefix = false) => {
    const start = selection.start;
    const end = selection.end;
    const selectedText = content.slice(start, end);

    let newText;
    let newSelection;

    if (isPrefix) {
      // For list items, add prefix at the beginning of the line
      const before = content.slice(0, start);
      const after = content.slice(end);
      newText = before + symbol + selectedText + after;
      const offset = symbol.length;
      newSelection = {
        start: start + offset,
        end: end + offset,
      };
    } else {
      // For formatting symbols, wrap the selected text
      newText = content.slice(0, start) + symbol + selectedText + symbol + content.slice(end);
      const offset = symbol.length;
      newSelection = {
        start: start + offset,
        end: end + selectedText.length + offset,
      };
    }

    setContent(newText);
    setSelection(newSelection);
  }, [content, selection]);

  // Memoized tag removal function
  const handleRemoveTag = useCallback((tagToRemove) => {
    const updatedTags = tags
      .split(",")
      .map(t => t.trim())
      .filter(t => t && t !== tagToRemove)
      .join(", ");
    setTags(updatedTags);
  }, [tags]);

  // Memoized save function
  const handleSave = useCallback(() => {
    const noteData = {
      title,
      content: { text: content },
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      isGlobal: localIsGlobal,
    };

    if (editingId && onSaveEdit) {
      onSaveEdit(editingId, noteData);
    } else if (onAdd) {
      onAdd(noteData);
    }
  }, [title, content, tags, localIsGlobal, editingId, onSaveEdit, onAdd]);

  // Memoized styles
  const inputStyles = useMemo(() => ({
    color: theme.colors.text,
    borderColor: theme.colors.border,
    backgroundColor: isDark ? theme.colors.surface : '#fff',
  }), [theme.colors.text, theme.colors.border, theme.colors.surface, isDark]);

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
            Share with all users
          </Text>
          <Switch
            value={localIsGlobal}
            onValueChange={setLocalIsGlobal}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={localIsGlobal ? theme.colors.success : theme.colors.subtext}
          />
        </View>
        
        {saveSuccess && (
          <Text style={[styles.successText, { color: theme.colors.success }]}>
            ✅ Saved!
          </Text>
        )}
        
        <TextInput
          style={[styles.input, inputStyles]}
          placeholder="Note title"
          placeholderTextColor={theme.colors.subtext}
          value={title}
          onChangeText={setTitle}
          editable={!disabled}
          selectTextOnFocus={disabled}
        />
        
        <TextInput
          style={[styles.input, inputStyles]}
          placeholder="Add tags (comma-separated)"
          placeholderTextColor={theme.colors.subtext}
          value={tags}
          onChangeText={setTags}
          editable={!disabled}
          selectTextOnFocus={disabled}
        />
        
        <TagDisplay tags={tags} onRemoveTag={handleRemoveTag} theme={theme} />
        <TagSuggestions input={tags} setInput={setTags} allTags={allTags} />
        
        <FormattingButtons onApplyFormatting={applyFormatting} theme={theme} />
        
        <TextInput
          style={[styles.input, styles.contentInput, inputStyles]}
          placeholder="Write a note..."
          placeholderTextColor={theme.colors.subtext}
          value={content}
          onChangeText={setContent}
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
            onPress={handleSave}
            disabled={!hasChanges || disabled}
          />
          {onCancel && <Button title="Cancel" onPress={onCancel} />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  contentInput: {
    minHeight: 200,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "65%",
    alignSelf: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  successText: {
    marginBottom: 10,
  },
  formattingButtons: {
    flexDirection: "row",
    marginBottom: 10,
    gap: 8,
  },
  formatButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  tagText: {
    color: "#fff",
    marginRight: 6,
  },
  tagRemove: {
    color: "#ccc",
    fontWeight: "bold",
  },
  tagRemoveButton: {
    marginLeft: 4,
  },
});
