import React from "react";
import { View, Text, FlatList, Button, useColorScheme, PanResponder, Animated } from "react-native";
import { tagStyles } from "../styles/tagStyles";
import { stringToColor } from "../utils/stringToColor";
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
  
  // Gesture handling for swipe-to-go-back using PanResponder
  const translateX = React.useRef(new Animated.Value(0)).current;
  
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow right swipe (positive dx)
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 100) {
          // If swiped more than 100 pixels to the right, go back
          onBack();
        } else {
          // Spring back to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View 
      style={[{ padding: 16 }, { transform: [{ translateX }] }]}
      {...panResponder.panHandlers}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16, ...textColor }}>
        {note.title}
      </Text>

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

      {note.tags && note.tags.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: "bold", color: isDark ? "#bbb" : "#444" }}>Tags:</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {note.tags.map((tag, index) => (
              <View key={index} style={{ 
                paddingHorizontal: 8, 
                paddingVertical: 4, 
                borderRadius: 12, 
                backgroundColor: stringToColor(tag) 
              }}>
                <Text style={{ fontSize: 12, color: isDark ? "#eee" : "#333" }}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ marginTop: 24, flexDirection: "row", justifyContent: "flex-end" }}>
        <View style={{ marginRight: 8 }}>
          <Button title="Edit" onPress={onEdit} />
        </View>
        <View>
          <Button title="Back" onPress={onBack} color="gray" />
        </View>
      </View>
    </Animated.View>
  );
}
