import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useThemeContext as useTheme } from '../store/ThemeContext';

export function ActionButtons({ onAddNote, onAddList }) {
  const { theme } = useTheme();

  const buttonStyle = useMemo(() => ({
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness + 4,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  }), [theme]);

  const labelStyle = useMemo(() => ({
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  }), []);

  return (
    <View style={[styles.actionButtons, { gap: theme.spacing.sm + 2, marginBottom: theme.spacing.sm + 2 }]}>
      <Pressable 
        onPress={() => onAddNote('note')}
        style={buttonStyle}
        accessibilityLabel="Add note"
        accessibilityRole="button"
      >
        <Text style={styles.iconButtonText}>📝</Text>
        <Text style={labelStyle}>Note</Text>
      </Pressable>
      <Pressable 
        onPress={() => onAddList('list')}
        style={buttonStyle}
        accessibilityLabel="Add list"
        accessibilityRole="button"
      >
        <Text style={styles.iconButtonText}>🧾</Text>
        <Text style={labelStyle}>List</Text>
      </Pressable>
    </View>
  );
}

ActionButtons.propTypes = {
  onAddNote: PropTypes.func.isRequired,
  onAddList: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
  },
  iconButtonText: {
    fontSize: 32,
    marginBottom: 4,
  },
});
