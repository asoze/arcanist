import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList, Pressable, useColorScheme, StyleSheet, Switch } from "react-native";
import { Checkbox } from "react-native-paper";
import TagSuggestions from "./TagSuggestions";
import { stringToColor } from "../utils/stringToColor";
import { tagStyles } from "../styles/tagStyles";

export default function ListEditor({ note, onSave, onCancel, isGlobal, setIsGlobal }) {
  const isDark = useColorScheme() === "dark";
  const textColor = { color: isDark ? "#fff" : "#000" };

  const [title, setTitle] = useState(note.title || "");
  const [items, setItems] = useState(note.items || []);
  const [newItem, setNewItem] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemText, setEditingItemText] = useState("");
  const [tags, setTags] = useState((note.tags || []).join(", "));
  const [localIsGlobal, setLocalIsGlobal] = useState(note.isGlobal || false);

  const addItem = () => {
    const current = newItem.trim();
    if (!current) return;
    const newId = Date.now().toString();
    const newEntry = { id: newId, text: current, checked: false };
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
      updatedAt: Date.now(),
      isGlobal: localIsGlobal
    });
  }

  return (
    <View style={{ padding: 16 }}>
      <View style={styles.switchRow}>
        <Text style={{ fontSize: 16, color: isDark ? "#eee" : "#333", marginRight: 10 }}>
          Share with all users
        </Text>
        <Switch
          value={localIsGlobal}
          onValueChange={setLocalIsGlobal}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={localIsGlobal ? "#00aa00" : "#ccc"}
        />
      </View>
      
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="List Title"
        style={{ fontSize: 18, marginBottom: 12, ...textColor }}
      />
      
      {/* Tag section - moved to top */}
      <TextInput
        value={tags}
        onChangeText={setTags}
        placeholder="Add tags (comma-separated)"
        style={styles.input(isDark)}
      />
      
      {/* Visual tag display with individual removal */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
        {tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .map((tag) => (
            <View key={tag} style={[tagStyles.tag, { backgroundColor: stringToColor(tag), flexDirection: "row", alignItems: "center" }]}>
              <Text style={{ color: "#fff", marginRight: 6 }}>
                {tag}
              </Text>
              <Pressable onPress={() => {
                const updatedTags = tags
                  .split(",")
                  .map(t => t.trim())
                  .filter(t => t && t !== tag)
                  .join(", ");
                setTags(updatedTags);
              }}>
                <Text style={{ color: "#ccc", fontWeight: "bold" }}>
                  ×
                </Text>
              </Pressable>
            </View>
          ))}
      </View>
      
      <TagSuggestions input={tags} setInput={setTags} allTags={[]} />

      <FlatList
        data={items}
        extraData={{ editingItemId, editingItemText }}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Checkbox
              status={item.checked ? "checked" : "unchecked"}
              onPress={() => {
                const updated = items.map(i =>
                  i.id === item.id ? { ...i, checked: !i.checked } : i
                );
                setItems(updated);
              }}
            />
            {editingItemId === item.id ? (
              <>
                <TextInput
                  value={editingItemText}
                  onChangeText={setEditingItemText}
                  style={{ flex: 1, borderBottomWidth: 1, marginLeft: 8, ...textColor }}
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
                    marginLeft: 8,
                    cursor: "pointer",
                    backgroundColor: hovered ? (isDark ? "#333" : "#eee") : "transparent",
                  })}
                  onPress={() => {
                    setEditingItemId(item.id);
                    setEditingItemText(item.text);
                  }}
                >
                  <Text
                    style={{
                      ...textColor,
                      textDecorationLine: item.checked ? "line-through" : "none",
                    }}
                  >
                    {item.text}
                  </Text>
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
          returnKeyType="done"
          blurOnSubmit={false}
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

const styles = StyleSheet.create({
  input: (isDark) => ({
    borderWidth: 1,
    borderColor: isDark ? "#555" : "#ccc",
    backgroundColor: isDark ? "#333" : "#fff",
    color: isDark ? "#eee" : "#000",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    fontSize: 16,
  }),
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
});
