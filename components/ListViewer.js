import React from "react";
import { View, Text, FlatList, Button, useColorScheme } from "react-native";
import { tagStyles } from "../styles/tagStyles";
import { Checkbox } from "react-native-paper";

/**
 * ListViewer displays a checklist that can be checked off without entering edit mode.
 * Props:
 *   - note: the list note object { title, tags, items }
 *   - onEdit: callback to enter edit mode
 *   - onBack: callback to exit view mode
 *   - onToggleItem: callback(itemId) to toggle checked status
 */
export default function ListViewer({ note, onEdit, onBack, onToggleItem }) {
  const isDark = useColorScheme() === "dark";
  const textColor = { color: isDark ? "#fff" : "#000" };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16, ...textColor }}>
        {note.title}
      </Text>

      {note.tags && note.tags.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
          {note.tags.map((tag, index) => (
            <Text key={index} style={tagStyles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      )}

      <FlatList
        data={note.items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <Checkbox
              status={item.checked ? "checked" : "unchecked"}
              onPress={() => onToggleItem && onToggleItem(item.id)}
            />
            <Text
              style={{
                fontSize: 16,
                marginLeft: 8,
                ...textColor,
                textDecorationLine: item.checked ? "line-through" : "none",
              }}
            >
              {item.text}
            </Text>
          </View>
        )}
      />

      <View style={{ marginTop: 24, flexDirection: "row", justifyContent: "flex-end" }}>
        <View style={{ marginRight: 8 }}>
          <Button title="Edit" onPress={onEdit} />
        </View>
        <View>
          <Button title="Back" onPress={onBack} color="gray" />
        </View>
      </View>
    </View>
  );
}
