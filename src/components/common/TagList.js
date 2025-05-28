// src/components/common/TagList.js
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { stringToColor } from '../../utils/stringToColor';

/**
 * Reusable component for displaying a list of tags
 * @param {Object} props - Component props
 * @param {Array} props.tags - Array of tag strings
 * @param {Function} props.onTagPress - Function to call when a tag is pressed
 * @param {string} props.activeTag - Currently active/selected tag
 * @param {Object} props.style - Additional style for the container
 * @param {Object} props.tagStyle - Additional style for individual tags
 * @returns {React.ReactNode}
 */
export function TagList({
  tags = [],
  onTagPress,
  activeTag,
  style,
  tagStyle,
}) {
  if (!tags || tags.length === 0) return null;

  return (
    <View style={[styles.container, style]}>
      {tags.map((tag, index) => (
        <Pressable
          key={index}
          onPress={() => onTagPress && onTagPress(tag)}
          style={({ pressed }) => [
            styles.tag,
            { backgroundColor: stringToColor(tag) },
            activeTag === tag && styles.activeTag,
            pressed && styles.pressedTag,
            tagStyle,
          ]}
        >
          <Text style={styles.tagText}>{tag}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  activeTag: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  pressedTag: {
    opacity: 0.7,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default TagList;
