import React, { useMemo } from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { useThemeContext as useTheme } from '../../store/ThemeContext';
import { createResponsiveStyles } from '../../styles/commonStyles';

/**
 * Responsive container that adapts to screen orientation and size
 * Provides optimal layout for both portrait and landscape modes
 */
export function ResponsiveContainer({ children, style, maxWidth = true }) {
  const { width, height } = useWindowDimensions();
  const { theme } = useTheme();
  const responsive = useMemo(() => createResponsiveStyles(width, height), [width, height]);

  const containerStyle = useMemo(() => {
    const baseStyle = {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: responsive.containerPadding,
    };

    // In landscape mode, center content with max width for better readability
    if (responsive.isLandscape && maxWidth && !responsive.isTablet) {
      return {
        ...baseStyle,
        alignItems: 'center',
        paddingHorizontal: Math.max(responsive.containerPadding, (width - 800) / 2),
      };
    }

    return baseStyle;
  }, [theme.colors.background, responsive, width, maxWidth]);

  const contentStyle = useMemo(() => {
    if (responsive.isLandscape && maxWidth && !responsive.isTablet) {
      return {
        width: '100%',
        maxWidth: responsive.maxContentWidth,
        flex: 1,
      };
    }
    return { flex: 1 };
  }, [responsive, maxWidth]);

  return (
    <View style={[containerStyle, style]}>
      <View style={contentStyle}>
        {children}
      </View>
    </View>
  );
}

/**
 * Hook to get responsive layout information
 */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  return useMemo(() => createResponsiveStyles(width, height), [width, height]);
}

export default ResponsiveContainer;
