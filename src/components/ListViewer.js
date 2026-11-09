import React from 'react';
import { View, Text, FlatList, PanResponder, Animated, StyleSheet } from 'react-native';
import { Checkbox } from 'react-native-paper';

import { useThemeContext as useTheme } from '../store/ThemeContext';
import { stringToColor } from 'arcanist-common';
import { Button } from './common/Button';

/**
 * ListViewer displays a checklist that can be checked off without entering edit mode.
 * Props:
 *   - note: the list note object { title, tags, items }
 *   - onEdit: callback to enter edit mode
 *   - onBack: callback to exit view mode
 *   - onToggleItem: callback(itemId) to toggle checked status
 */
export default function ListViewer({ note, onEdit, onBack, onToggleItem }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Gesture handling for swipe-to-go-back using PanResponder
  const translateX = React.useRef(new Animated.Value(0)).current;
  
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow right swipe (positive dx)
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 100) {
          // If swiped more than 100 pixels to the right, go back
          onBack();
        } else {
          // Spring back to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View 
      style={[styles.container, { transform: [{ translateX }] }]}
      {...panResponder.panHandlers}
    >
      <Text style={styles.title}>
        {note.title}
      </Text>

      <FlatList
        data={note.items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Checkbox
              status={item.checked ? "checked" : "unchecked"}
              onPress={() => onToggleItem && onToggleItem(item.id)}
            />
            <Text
              style={[
                styles.itemText,
                item.checked && styles.checkedText
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
      />

      {note.tags && note.tags.length > 0 && (
        <View style={styles.tagsSection}>
          <Text style={styles.tagsLabel}>Tags:</Text>
          <View style={styles.tagsContainer}>
            {note.tags.map((tag, index) => (
              <View key={index} style={[styles.tagBadge, { backgroundColor: stringToColor(tag) }]}>
                <Text style={styles.tagText}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button title="Edit" onPress={onEdit} />
        <Button title="Back" onPress={onBack} variant="secondary" />
      </View>
    </Animated.View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs + 2,
  },
  itemText: {
    fontSize: 16,
    marginLeft: theme.spacing.sm,
    color: theme.colors.text,
  },
  checkedText: {
    textDecorationLine: "line-through",
    color: theme.colors.subtext,
  },
  tagsSection: {
    marginTop: theme.spacing.md,
  },
  tagsLabel: {
    fontWeight: "bold",
    color: theme.colors.text,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs + 2,
    marginTop: theme.spacing.sm,
  },
  tagBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness + 4,
  },
  tagText: {
    fontSize: 12,
    color: '#fff',
  },
  buttonContainer: {
    marginTop: theme.spacing.lg,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
  },
});
