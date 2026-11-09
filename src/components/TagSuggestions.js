import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { createTagStyles } from "../styles/tagStyles";
import { useThemeContext as useTheme } from "../store/ThemeContext";
import { stringToColor } from 'arcanist-common';

export default function TagSuggestions({ input = "", setInput, allTags }) {
  const { theme } = useTheme();
  const tagStyles = useMemo(() => createTagStyles(theme), [theme]);
  
  const current = input.split(",").pop()?.trim().toLowerCase() || "";
  const enteredTags = useMemo(() => {
    const parts = input.split(",");
    return new Set(
      parts
        .slice(0, -1)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    );
  }, [input]);

  const suggestions = useMemo(() =>
    current.length > 0
      ? allTags
          .filter(
            (tag) =>
              tag.toLowerCase().startsWith(current) &&
              !enteredTags.has(tag.toLowerCase()),
          )
          .slice(0, 5)
      : [],
    [current, allTags, enteredTags]
  );

  if (!input.trim() || suggestions.length === 0) return null;

  return (
    <View style={tagStyles.tagContainer}>
      {suggestions.map((tag, i) => (
        <Pressable
          key={i}
          onPress={() => {
            const parts = input
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
            parts[parts.length - 1] = tag;
            setInput(parts.join(", ") + ", ");
          }}
          style={[tagStyles.tag, { backgroundColor: stringToColor(tag) }]}
        >
          <Text style={tagStyles.tagText}>{tag}</Text>
        </Pressable>
      ))}
    </View>
  );
}
