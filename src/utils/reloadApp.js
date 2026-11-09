import { Platform } from 'react-native';

export async function reloadApp() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return;
  }
  try {
    // eslint-disable-next-line import/no-unresolved
    const Updates = await import('expo-updates');
    if (Updates?.reloadAsync) {
      await Updates.reloadAsync();
    }
  } catch (_err) {
    // expo-updates not available (e.g. bare workflow without updates configured).
    // The user was already told the app needs to reload.
  }
}
