import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext as useTheme } from '../store/ThemeContext';

export function FilterBanner({ activeTag, onClearFilter }) {
  const { isDark, theme } = useTheme();

  if (!activeTag) return null;

  return (
    <View style={[
      styles.filterBanner, 
      { backgroundColor: isDark ? theme.colors.surface : '#eef' }
    ]}>
      <Text style={[styles.filterText, { color: theme.colors.text }]}>
        Filtering by tag:
      </Text>
      <Text style={[styles.filterTag, { color: theme.colors.primary }]}>
        {activeTag}
      </Text>
      <Text
        onPress={onClearFilter}
        style={[styles.clearFilter, { color: theme.colors.error }]}
        accessibilityLabel="Clear filter"
        accessibilityRole="button"
      >
        ✕ Clear Filter
      </Text>
    </View>
  );
}

FilterBanner.propTypes = {
  activeTag: PropTypes.string,
  onClearFilter: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  filterBanner: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },
  filterText: {
    marginBottom: 4,
  },
  filterTag: {
    fontWeight: 'bold',
  },
  clearFilter: {
    marginTop: 6,
    textDecorationLine: 'underline',
  },
});
