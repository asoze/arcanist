import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useNotes } from './NotesContext';

const MAX_SUGGESTIONS = 6;

export function TagPill({ label, colors, onRemove, onPress, small }) {
  const content = (
    <>
      <Text style={[styles.pillText, small && styles.pillTextSmall, { color: colors.pillText }]} numberOfLines={1}>
        {label}
      </Text>
      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove tag ${label}`}
        >
          <Text style={[styles.remove, { color: colors.pillText }]}>×</Text>
        </Pressable>
      )}
    </>
  );
  const style = [styles.pill, small && styles.pillSmall, { backgroundColor: colors.pill }];
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" style={style}>
      {content}
    </Pressable>
  ) : (
    <View style={style}>{content}</View>
  );
}

export function TagPills({ tags, colors }) {
  if (tags.length === 0) return null;
  return (
    <View style={styles.row}>
      {tags.map((tag) => (
        <TagPill key={tag} label={tag} colors={colors} small />
      ))}
    </View>
  );
}

/** Pills for the current tags plus an input; Enter or a comma adds a tag. */
export function TagEditor({ tags, onChange, colors }) {
  const { notes } = useNotes();
  const [draft, setDraft] = useState('');

  const knownTags = useMemo(() => [...new Set(notes.flatMap((note) => note.tags))], [notes]);
  const suggestions = useMemo(() => {
    const query = draft.trim().toLowerCase();
    if (!query) return [];
    return knownTags
      .filter((tag) => !tags.includes(tag) && tag.toLowerCase().includes(query))
      .sort((a, b) => a.toLowerCase().indexOf(query) - b.toLowerCase().indexOf(query) || a.localeCompare(b))
      .slice(0, MAX_SUGGESTIONS);
  }, [draft, knownTags, tags]);

  const add = (text) => {
    const additions = text
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag && !tags.includes(tag));
    if (additions.length) onChange([...new Set([...tags, ...additions])]);
  };

  const onChangeText = (text) => {
    if (!text.includes(',')) {
      setDraft(text);
      return;
    }
    const parts = text.split(',');
    add(parts.slice(0, -1).join(','));
    setDraft(parts[parts.length - 1]);
  };

  const commitDraft = () => {
    add(draft);
    setDraft('');
  };

  // Pressing a suggestion blurs the input first; don't commit the partial draft too.
  const pickingSuggestion = useRef(false);
  const onBlur = () => {
    if (!pickingSuggestion.current) commitDraft();
  };

  const onKeyPress = ({ nativeEvent }) => {
    if (nativeEvent.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <View style={styles.editor}>
      <View style={styles.row}>
        {tags.map((tag) => (
          <TagPill
            key={tag}
            label={tag}
            colors={colors}
            onRemove={() => onChange(tags.filter((t) => t !== tag))}
          />
        ))}
        <TextInput
          value={draft}
          onChangeText={onChangeText}
          onSubmitEditing={commitDraft}
          onBlur={onBlur}
          onKeyPress={onKeyPress}
          submitBehavior="submit"
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={tags.length ? 'Add tag' : 'Add tags'}
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text }]}
          accessibilityLabel="Add tag"
        />
      </View>
      {suggestions.length > 0 && (
        <View style={styles.row}>
          {suggestions.map((tag) => (
            <Pressable
              key={tag}
              onPressIn={() => {
                pickingSuggestion.current = true;
              }}
              onPressOut={() => {
                pickingSuggestion.current = false;
              }}
              onPress={() => {
                add(tag);
                setDraft('');
              }}
              accessibilityRole="button"
              accessibilityLabel={`Add tag ${tag}`}
              style={[styles.suggestion, { borderColor: colors.border }]}
            >
              <Text style={[styles.pillText, { color: colors.muted }]}>+ {tag}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  editor: { flex: 1, gap: 6, paddingVertical: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 220,
  },
  pillSmall: { paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 14 },
  pillTextSmall: { fontSize: 12 },
  remove: { fontSize: 16, lineHeight: 18, marginLeft: 2 },
  suggestion: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  input: { flexGrow: 1, minWidth: 90, fontSize: 15, paddingVertical: 4 },
});
