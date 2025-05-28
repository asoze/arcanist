// src/styles/theme.js
import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

/**
 * Application theme with consistent colors and styles
 */
export const theme = {
  light: {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: "#007bff",
      secondary: "#6c757d",
      background: "#ffffff",
      surface: "#f8f9fa",
      text: "#000000",
      subtext: "#888888",
      border: "#cccccc",
      error: "#cc3333",
      success: "#00aa00",
      warning: "#FFA500",
      info: "#007AFF",
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    roundness: 8,
  },
  dark: {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: "#66aaff",
      secondary: "#adb5bd",
      background: "#2b2b2b",
      surface: "#333333",
      text: "#eeeeee",
      subtext: "#aaaaaa",
      border: "#555555",
      error: "#ff5555",
      success: "#55aa55",
      warning: "#ffaa55",
      info: "#55aaff",
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    roundness: 8,
  },
};

/**
 * Create styles with theme-aware colors
 * @param {boolean} isDark - Whether to use dark theme
 * @returns {object} - Theme object with colors and spacing
 */
export const getTheme = (isDark) => (isDark ? theme.dark : theme.light);
