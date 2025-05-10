import React from "react";
import NoteApp from "./ui/NoteApp";
import 'expo-system-ui';

import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function App() {
  return (
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" backgroundColor="#fff" />
        return <NoteApp />;
      </View>
  );
}
