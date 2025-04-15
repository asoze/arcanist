import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { tagStyles } from "../styles/tagStyles";

export default function TagSuggestions({ input = "", setInput, allTags }) {
  const current = input.split(",").pop()?.trim().toLowerCase() || "";
  const suggestions =
    current.length > 0
      ? allTags
          .filter(
            (tag) =>
              tag.toLowerCase().startsWith(current) &&
              !input.toLowerCase().includes(tag.toLowerCase()),
          )
          .slice(0, 5)
      : [];

  if (!input.trim() || suggestions.length === 0) return null;

  return (
    <View style={styles.suggestionsContainer}>
      {suggestions.map((tag, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => {
            const parts = input
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
            parts[parts.length - 1] = tag;
            setInput(parts.join(", ") + ", ");
          }}
          style={styles.suggestionTouchable}
        >
          <Text style={tagStyles.tag}>{tag}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  suggestionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  suggestionTouchable: {
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
});
