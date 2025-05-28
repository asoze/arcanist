// src/components/common/OfflineNotice.js
import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useNotes } from '../../store/NotesContext';

const { width } = Dimensions.get('window');

/**
 * Component to display an offline notice when the device is offline
 * @returns {React.ReactNode}
 */
export function OfflineNotice() {
  const { isOffline } = useNotes();
  const [animation] = React.useState(new Animated.Value(0));
  
  React.useEffect(() => {
    if (isOffline) {
      // Slide in from top
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false, // Changed from true to false
      }).start();
    } else {
      // Slide out to top
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false, // Changed from true to false
      }).start();
    }
  }, [isOffline, animation]);
  
  // Don't render anything if online
  if (!isOffline) return null;
  
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateY }] }
      ]}
    >
      <Text style={styles.text}>
        You are offline. Changes will sync when you reconnect.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#cc3333',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width,
    zIndex: 10,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default OfflineNotice;
