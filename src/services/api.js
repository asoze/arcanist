/**
 * API service for handling all network operations related to notes
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '../utils/logger';
import NetInfo from '@react-native-community/netinfo';
import { resolveNotesUrl } from '../utils/resolveNotesUrl';
import { requestWithRetry } from './requestWithRetry';
import { API_TIMEOUT_MS, API_RETRIES } from '../constants/api';

async function authHeaders() {
  try {
    const token = await AsyncStorage.getItem('apiToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export const NotesAPI = {
  /**
   * Check if the device is connected to the internet
   * @returns {Promise<boolean>} - True if connected, false otherwise
   */
  isConnected: async () => {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected && state.isInternetReachable;
    } catch (error) {
      logError('Error checking connectivity:', error);
      return false;
    }
  },

  /**
   * Fetch notes from the server
   * @param {string} serverUrl - The server URL (base or full /notes URL)
   * @param {Object} options - Options for the fetch operation
   * @returns {Promise<Array>} - Array of notes from the server
   */
  fetchNotes: async (serverUrl, options = { timeout: API_TIMEOUT_MS, retries: API_RETRIES }) => {
    const endpoint = resolveNotesUrl(serverUrl);
    const httpFallback = endpoint.replace('https://', 'http://');

    const isConnected = await NotesAPI.isConnected();
    if (!isConnected) {
      const offlineError = new Error('Device is offline');
      offlineError.isOffline = true;
      logError('Cannot fetch notes: Device is offline');
      throw offlineError;
    }

    try {
      const auth = await authHeaders();
      const response = await requestWithRetry(
        endpoint,
        {
          method: 'GET',
          headers: { Accept: 'application/json', ...auth },
          mode: 'cors',
        },
        {
          timeout: options.timeout,
          retries: options.retries,
          httpFallbackUrl: httpFallback,
        }
      );
      return await response.json();
    } catch (error) {
      logError('All fetch attempts failed:', error);
      throw error;
    }
  },

  /**
   * Push notes to the server
   * @param {string} serverUrl - The server URL
   * @param {Array} notesToPush - Array of notes to push
   * @param {Object} options - Options for the push operation
   */
  pushNotes: async (serverUrl, notesToPush, options = { timeout: API_TIMEOUT_MS, retries: API_RETRIES }) => {
    if (!notesToPush.length) return;

    const endpoint = resolveNotesUrl(serverUrl);
    const httpFallback = endpoint.replace('https://', 'http://');

    const isConnected = await NotesAPI.isConnected();
    if (!isConnected) {
      const offlineError = new Error('Device is offline');
      offlineError.isOffline = true;
      logError('Cannot push notes: Device is offline');
      throw offlineError;
    }

    try {
      const auth = await authHeaders();
      await requestWithRetry(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...auth },
          body: JSON.stringify(notesToPush),
        },
        {
          timeout: options.timeout,
          retries: options.retries,
          httpFallbackUrl: httpFallback,
        }
      );
    } catch (error) {
      logError('All push attempts failed:', error);
      throw error;
    }
  },
};
