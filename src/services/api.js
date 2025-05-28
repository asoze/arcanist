// src/services/api.js
import { logInfo, logError } from '../utils/logger';
import NetInfo from '@react-native-community/netinfo';

/**
 * API service for handling all network operations related to notes
 */
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
   * Fetch notes from the server with improved error handling and retry logic
   * @param {string} serverUrl - The server URL
   * @param {Object} options - Options for the fetch operation
   * @param {number} options.timeout - Timeout in milliseconds
   * @param {number} options.retries - Number of retries
   * @returns {Promise<Array>} - Array of notes from the server
   */
  fetchNotes: async (serverUrl, options = { timeout: 10000, retries: 2 }) => {
    // Try to use the provided server URL, or fall back to default
    const NOTES_ENDPOINT = (serverUrl?.endsWith("/notes") ? serverUrl : null)
      || "https://home.andrewrsweeney.com/notes";
      
    // For Android emulator testing, we might need to use HTTP fallback
    const HTTP_FALLBACK = NOTES_ENDPOINT.replace('https://', 'http://');

    // Check connectivity first
    const isConnected = await NotesAPI.isConnected();
    if (!isConnected) {
      const offlineError = new Error('Device is offline');
      offlineError.isOffline = true;
      logError('Cannot fetch notes: Device is offline');
      throw offlineError;
    }

    // Only log errors, not regular operations
    
    let lastError;
    let useHttpFallback = false;
    
    for (let attempt = 0; attempt <= options.retries; attempt++) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);
        
        // Try HTTPS first, then fall back to HTTP if needed
        const endpoint = useHttpFallback ? HTTP_FALLBACK : NOTES_ENDPOINT;
        
        const response = await fetch(endpoint, {
          method: "GET",
          headers: { "Accept": "application/json" },
          mode: "cors",
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = new Error(`Failed to fetch notes: ${response.status}`);
          error.status = response.status;
          throw error;
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        
        // Don't retry if it's a 4xx error
        if (error.status && error.status >= 400 && error.status < 500) {
          logError(`Client error (${error.status}), not retrying:`, error);
          break;
        }
        
        // Don't retry if it's an abort error (timeout)
        if (error.name === 'AbortError') {
          logError(`Request timed out after ${options.timeout}ms`);
          lastError = new Error(`Request timed out after ${options.timeout}ms`);
          continue;
        }
        
        // If we get a TLS/SSL error and haven't tried HTTP yet, try the HTTP fallback
        if (error.message && 
            (error.message.includes('SSL') || 
             error.message.includes('TLS') || 
             error.message.includes('certificate')) && 
            !useHttpFallback) {
          logInfo("SSL/TLS error detected, trying HTTP fallback");
          useHttpFallback = true;
          continue;
        }
        
        if (attempt < options.retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          logInfo(`Retrying in ${delay}ms... (Attempt ${attempt + 1} of ${options.retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    logError('All fetch attempts failed:', lastError);
    throw lastError;
  },

  /**
   * Push notes to the server with improved error handling
   * @param {string} serverUrl - The server URL
   * @param {Array} notesToPush - Array of notes to push to the server
   * @param {Object} options - Options for the push operation
   * @param {number} options.timeout - Timeout in milliseconds
   * @param {number} options.retries - Number of retries
   * @returns {Promise<void>}
   */
  pushNotes: async (serverUrl, notesToPush, options = { timeout: 10000, retries: 2 }) => {
    if (!notesToPush.length) return;

    // Check connectivity first
    const isConnected = await NotesAPI.isConnected();
    if (!isConnected) {
      const offlineError = new Error('Device is offline');
      offlineError.isOffline = true;
      logError('Cannot push notes: Device is offline');
      throw offlineError;
    }

    // For Android emulator testing, we might need to use HTTP fallback
    const HTTP_FALLBACK = serverUrl.replace('https://', 'http://');

    // Only log errors, not regular operations

    let lastError;
    let useHttpFallback = false;
    
    for (let attempt = 0; attempt <= options.retries; attempt++) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);
        
        // Try HTTPS first, then fall back to HTTP if needed
        const endpoint = useHttpFallback ? HTTP_FALLBACK : serverUrl;
        
        const response = await fetch(`${endpoint}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notesToPush),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = new Error(`Upstream push failed: ${response.status}`);
          error.status = response.status;
          throw error;
        }
        
        // Success doesn't need to be logged
        return;
      } catch (error) {
        lastError = error;
        
        // Don't retry if it's a 4xx error
        if (error.status && error.status >= 400 && error.status < 500) {
          logError(`Client error (${error.status}), not retrying:`, error);
          break;
        }
        
        // Don't retry if it's an abort error (timeout)
        if (error.name === 'AbortError') {
          logError(`Request timed out after ${options.timeout}ms`);
          lastError = new Error(`Request timed out after ${options.timeout}ms`);
          continue;
        }
        
        // If we get a TLS/SSL error and haven't tried HTTP yet, try the HTTP fallback
        if (error.message && 
            (error.message.includes('SSL') || 
             error.message.includes('TLS') || 
             error.message.includes('certificate')) && 
            !useHttpFallback) {
          logInfo("SSL/TLS error detected, trying HTTP fallback");
          useHttpFallback = true;
          continue;
        }
        
        if (attempt < options.retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          logInfo(`Retrying in ${delay}ms... (Attempt ${attempt + 1} of ${options.retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    logError('All push attempts failed:', lastError);
    throw lastError;
  }
};
