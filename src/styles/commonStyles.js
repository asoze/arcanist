import { StyleSheet } from 'react-native';

/**
 * Common styles factory that creates theme-aware styles
 * Centralizes shared styles and ensures consistent spacing usage
 */
export const createCommonStyles = (theme) => StyleSheet.create({
  // Input styles
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.roundness,
    color: theme.colors.text,
    fontSize: 16,
  },

  // Container styles
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  contentContainer: {
    padding: theme.spacing.md,
  },

  // Card styles
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Button styles
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.roundness,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Accessibility minimum touch target
  },

  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.roundness,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },

  dangerButton: {
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.roundness,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },

  // Text styles
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },

  dangerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },

  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },

  body: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },

  caption: {
    fontSize: 12,
    color: theme.colors.subtext,
  },

  // Layout styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  column: {
    flexDirection: 'column',
  },

  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Spacing utilities
  marginXs: { margin: theme.spacing.xs },
  marginSm: { margin: theme.spacing.sm },
  marginMd: { margin: theme.spacing.md },
  marginLg: { margin: theme.spacing.lg },

  paddingXs: { padding: theme.spacing.xs },
  paddingSm: { padding: theme.spacing.sm },
  paddingMd: { padding: theme.spacing.md },
  paddingLg: { padding: theme.spacing.lg },

  // Responsive utilities
  flex1: { flex: 1 },
  flexGrow: { flexGrow: 1 },
  flexShrink: { flexShrink: 1 },

  // Touch target styles
  touchable: {
    borderRadius: theme.roundness,
    overflow: 'hidden',
  },

  touchablePressed: {
    opacity: 0.7,
  },

  // Shadow styles (for elevation)
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // List styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 60,
  },

  listItemContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
  },

  // Tag styles
  tag: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness / 2,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },

  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },

  // Error styles
  errorContainer: {
    backgroundColor: theme.colors.error + '20', // 20% opacity
    borderColor: theme.colors.error,
    borderWidth: 1,
    borderRadius: theme.roundness,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },

  errorText: {
    color: theme.colors.error,
    fontSize: 14,
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },

  loadingText: {
    color: theme.colors.subtext,
    marginTop: theme.spacing.sm,
  },
});

/**
 * Responsive breakpoints
 */
export const breakpoints = {
  small: 480,
  medium: 768,
  large: 1024,
};

/**
 * Create responsive styles based on screen dimensions
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @returns {object} - Responsive style modifiers
 */
export const createResponsiveStyles = (width, height) => {
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= breakpoints.medium;
  
  return {
    isSmall: width < breakpoints.small,
    isMedium: width >= breakpoints.small && width < breakpoints.medium,
    isLarge: width >= breakpoints.medium,
    isLandscape,
    isTablet,
    
    // Responsive padding - reduce in landscape for more content space
    containerPadding: isLandscape ? 16 : (width < breakpoints.small ? 12 : 20),
    
    // Responsive font sizes
    titleSize: width < breakpoints.small ? 18 : 20,
    bodySize: width < breakpoints.small ? 13 : 14,
    
    // Layout adjustments for landscape
    listItemHeight: isLandscape ? 70 : 80,
    editorPadding: isLandscape ? 12 : 16,
    
    // Content width constraints for landscape
    maxContentWidth: isLandscape && !isTablet ? Math.min(width * 0.9, 800) : '100%',
  };
};
