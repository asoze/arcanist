import React from "react";
import { View, Text, FlatList, Button, useColorScheme, StyleSheet } from "react-native";
import { tagStyles } from "../styles/tagStyles";

export default function ListViewer({ note, onEdit, onBack }) {
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
          <Text style={{ fontSize: 16, marginBottom: 6, ...textColor }}>• {item.text}</Text>
        )}
      />

      <View style={{ marginTop: 24 }}>
        <Button title="Edit" onPress={onEdit} />
        <Button title="Back" onPress={onBack} color="gray" />
      </View>
    </View>
  );
}
