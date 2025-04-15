import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList, Pressable, useColorScheme } from "react-native";
import TagSuggestions from "./TagSuggestions";

export default function ListEditor({ note, onSave, onCancel }) {
  const isDark = useColorScheme() === "dark";
  const textColor = { color: isDark ? "#fff" : "#000" };

  const [title, setTitle] = useState(note.title || "");
  const [items, setItems] = useState(note.items || []);
  const [newItem, setNewItem] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemText, setEditingItemText] = useState("");
  const [tags, setTags] = useState((note.tags || []).join(", "));

  const addItem = () => {
    const current = newItem.trim();
    if (!current) return;
    const newId = Date.now().toString();
    const newEntry = { id: newId, text: current };
    setItems([...items, newEntry]);
    setNewItem("");
    setEditingItemId(null);
    setEditingItemText("");
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const save = () => {
    const nonEmptyItems = items.filter(i => i.text.trim() !== "");
    onSave({
      ...note,
      title,
      items: nonEmptyItems,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      type: "list",
      updatedAt: Date.now()
    });
  }

  return (
    <View style={{ padding: 16 }}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="List Title"
        style={{ fontSize: 18, marginBottom: 12, ...textColor }}
      />
      <TextInput
        value={tags}
        onChangeText={setTags}
        placeholder="Tags (comma separated)"
        style={{ fontSize: 16, marginBottom: 8, ...textColor }}
      />
      <TagSuggestions currentTags={tags} onSelectTag={(tag) => {
        if (!tags.includes(tag)) {
          setTags(tags.length > 0 ? `${tags}, ${tag}` : tag);
        }
      }} />

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            {editingItemId === item.id ? (
              <>
                <TextInput
                  value={editingItemText}
                  onChangeText={setEditingItemText}
                  style={{ flex: 1, borderBottomWidth: 1, ...textColor }}
                />
                <Button
                  title="Save"
                  onPress={() => {
                    setItems(items.map(i =>
                      i.id === item.id ? { ...i, text: editingItemText } : i
                    ));
                    setEditingItemId(null);
                    setEditingItemText("");
                  }}
                />
              </>
            ) : (
              <>
                <Pressable
                  style={({ hovered }) => ({
                    flex: 1,
                    paddingVertical: 4,
                    cursor: "pointer",
                    backgroundColor: hovered ? (isDark ? "#333" : "#eee") : "transparent",
                  })}
                  onPress={() => {
                    setEditingItemId(item.id);
                    setEditingItemText(item.text);
                  }}
                >
                  <Text style={{ ...textColor }}>• {item.text}</Text>
                </Pressable>
                <Button
                  title="X"
                  color="red"
                  onPress={() => removeItem(item.id)}
                />
              </>
            )}
          </View>
        )}
      />

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <TextInput
          value={newItem}
          onChangeText={setNewItem}
          placeholder="New item"
          style={{ flex: 1, borderWidth: 1, borderColor: "#ccc", padding: 8, ...textColor }}
          onSubmitEditing={addItem}
        />
        <View style={{ width: 8 }} />
        <Button title="Add Item" onPress={addItem} />
      </View>
      <View style={{ marginTop: 16, flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
        <Button title="Save List" onPress={save} />
        <Button title="Cancel" onPress={onCancel} color="gray" />
      </View>
    </View>
  );
}
