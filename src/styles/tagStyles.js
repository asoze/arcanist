import { StyleSheet } from "react-native";

/**
 * Create theme-aware tag styles
 * @param {Object} theme - Theme object with colors and spacing
 * @returns {Object} - StyleSheet object with tag styles
 */
export const createTagStyles = (theme) => StyleSheet.create({
  tag: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness / 2,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    minWidth: 40,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
  activeTag: {
    borderWidth: 1,
    borderColor: theme.colors.text,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
  },
});

// Legacy styles removed - all components now use createTagStyles
