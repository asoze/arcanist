import { StyleSheet } from "react-native";

export const tagStyles = StyleSheet.create({
  tag: {
    paddingHorizontal: 10, // Increased from 6 to 10
    paddingVertical: 6,    // Increased from 2 to 6
    borderRadius: 4,
    marginRight: 6,        // Increased from 4 to 6
    marginBottom: 6,       // Increased from 4 to 6
    fontSize: 14,          // Increased from 12 to 14
    color: "#fff",
    fontWeight: "bold",
    minWidth: 40,          // Minimum width for better touch targets
    minHeight: 32,         // Minimum height for better touch targets
    textAlign: 'center',   // Center text for better appearance
  },
});
