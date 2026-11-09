import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import {
  CoreBridge,
  EditorKeyboardAvoidingView,
  RichText,
  TenTapStartKit,
  Toolbar,
  darkEditorCss,
  darkEditorTheme,
  useEditorBridge,
  useEditorContent,
} from '@10play/tentap-editor';

import { useNotes } from '../../src/notes/NotesContext';
import { isBlankNote } from '../../src/notes/preview';
import { TagEditor } from '../../src/notes/Tags';
import { confirm } from '../../src/confirm';
import { useColors } from '../../src/theme';

const BODY_CSS = `
  body { font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; }
  .ProseMirror { padding: 4px 2px 48px; font-size: 17px; line-height: 1.5; }
`;

function NoteEditor({ note, isNew }) {
  const navigation = useNavigation();
  const { isDark, colors } = useColors();
  const { updateNote, deleteNote, sync } = useNotes();
  const [title, setTitle] = useState(note.title);
  const [tags, setTags] = useState(note.tags);
  const [shared, setShared] = useState(note.shared);
  const [initialHtml] = useState(note.html);
  const leaving = useRef(false);

  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent: initialHtml,
    theme: isDark ? darkEditorTheme : undefined,
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(isDark ? `${darkEditorCss}${BODY_CSS}` : BODY_CSS),
    ],
  });

  // Tiptap normalizes HTML on load, so the first read is not a user edit.
  const html = useEditorContent(editor, { type: 'html', debounceInterval: 400 });
  const lastHtml = useRef(null);
  useEffect(() => {
    if (html === undefined || html === lastHtml.current) return;
    const isFirstRead = lastHtml.current === null;
    lastHtml.current = html;
    if (!isFirstRead) updateNote(note.id, { html });
  }, [html, note.id, updateNote]);

  const latest = useRef({ title, tags });
  latest.current = { title, tags };

  /** Saves the latest body, or discards a new note left blank. Returns whether the note was kept. */
  const flush = useCallback(async () => {
    const finalHtml = await editor.getHTML().catch(() => null);
    const final = {
      title: latest.current.title,
      tags: latest.current.tags,
      html: finalHtml ?? lastHtml.current ?? initialHtml,
    };
    if (isNew && isBlankNote(final)) {
      deleteNote(note.id);
      return false;
    }
    if (finalHtml != null && finalHtml !== (lastHtml.current ?? finalHtml)) {
      lastHtml.current = finalHtml;
      updateNote(note.id, { html: finalHtml });
    }
    return true;
  }, [editor, note.id, isNew, initialHtml, updateNote, deleteNote]);

  useEffect(() => {
    return navigation.addListener('beforeRemove', (event) => {
      if (leaving.current) return;
      event.preventDefault();
      flush().then(() => navigation.dispatch(event.data.action));
    });
  }, [navigation, flush]);

  const commitTagDraft = useRef(null);

  const onSave = async () => {
    if (leaving.current) return;
    leaving.current = true;
    commitTagDraft.current?.();
    if (await flush()) sync();
    navigation.goBack();
  };

  const onDelete = async () => {
    const ok = await confirm({
      title: 'Delete note?',
      message: note.shared ? 'This removes it for everyone it is shared with.' : 'This cannot be undone.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    leaving.current = true;
    deleteNote(note.id);
    navigation.goBack();
  };

  const onTitleChange = (text) => {
    setTitle(text);
    updateNote(note.id, { title: text });
  };

  const onTagsChange = (next) => {
    latest.current.tags = next;
    setTags(next);
    updateNote(note.id, { tags: next });
  };

  const onSharedChange = (value) => {
    setShared(value);
    updateNote(note.id, { shared: value });
  };

  const isWeb = Platform.OS === 'web';

  return (
    <View style={[styles.page, isWeb && styles.pageWide]}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable onPress={onDelete} accessibilityRole="button" style={styles.headerButton}>
                <Text style={{ color: colors.error, fontSize: 16 }}>Delete</Text>
              </Pressable>
              <Pressable
                onPress={onSave}
                accessibilityRole="button"
                style={[styles.saveButton, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          ),
        }}
      />
      <TextInput
        value={title}
        onChangeText={onTitleChange}
        autoFocus={isNew}
        placeholder="Title"
        placeholderTextColor={colors.muted}
        style={[styles.title, { color: colors.text }]}
      />
      <View style={[styles.metaRow, { borderColor: colors.border }]}>
        <TagEditor tags={tags} onChange={onTagsChange} commitRef={commitTagDraft} colors={colors} />
        <Text style={[styles.sharedLabel, { color: colors.muted }]}>Shared</Text>
        <Switch
          value={shared}
          onValueChange={onSharedChange}
          trackColor={{ true: colors.accent }}
          accessibilityLabel="Share with everyone"
        />
      </View>
      {note.createdBy && note.createdBy !== note.lastModifiedBy && (
        <Text style={[styles.byline, { color: colors.muted }]}>
          Created by {note.createdBy}, last edited by {note.lastModifiedBy}
        </Text>
      )}
      <EditorKeyboardAvoidingView style={styles.fill}>
        {isWeb && (
          <View style={[styles.toolbar, { borderColor: colors.border }]}>
            <Toolbar editor={editor} hidden={false} />
          </View>
        )}
        <View style={styles.fill}>
          <RichText editor={editor} />
        </View>
        {!isWeb && <Toolbar editor={editor} />}
      </EditorKeyboardAvoidingView>
    </View>
  );
}

export default function NoteScreen() {
  const { id, isNew } = useLocalSearchParams();
  const { colors } = useColors();
  const { notes } = useNotes();
  const note = notes.find((candidate) => candidate.id === id);

  if (!note) {
    return <Text style={[styles.missing, { color: colors.muted }]}>This note no longer exists.</Text>;
  }
  return <NoteEditor key={note.id} note={note} isNew={isNew === '1'} />;
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16 },
  pageWide: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '700', paddingVertical: 6 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sharedLabel: { fontSize: 14 },
  byline: { fontSize: 13, marginBottom: 8 },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  headerButton: { paddingHorizontal: 8 },
  saveButton: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 },
  saveText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  fill: { flex: 1 },
  toolbar: { borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  missing: { textAlign: 'center', marginTop: 48, fontSize: 15 },
});
