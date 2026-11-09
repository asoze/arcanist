// src/utils/cacheManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logInfo, logError } from './logger';

/**
 * Keys this app writes for user/app settings (not note data).
 * Anything else found in AsyncStorage is treated as note data, because
 * `usePersistedNotes(username)` stores each user's notes under their
 * username as the key (so the actual key value is user-defined).
 */
const SETTINGS_KEYS = ['username', 'serverUrl', 'themePreference'];

const isSettingsKey = (key) => SETTINGS_KEYS.includes(key);

/**
 * Cache manager utility for clearing app data
 */
export class CacheManager {
  /**
   * @deprecated Kept for backward compatibility. Prefer `listSettingsKeys` /
   * `listNoteKeys` which inspect AsyncStorage at runtime.
   */
  static getAppStorageKeys() {
    return [...SETTINGS_KEYS];
  }

  /**
   * Return settings keys currently present in AsyncStorage.
   */
  static async listSettingsKeys() {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys.filter(isSettingsKey);
  }

  /**
   * Return all AsyncStorage keys that look like note data (i.e. anything not
   * in the settings allowlist). This catches the user's note bucket which is
   * stored under their username as the key.
   */
  static async listNoteKeys() {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys.filter((k) => !isSettingsKey(k));
  }

  /**
   * Remove a set of keys, returning per-key success/failure info.
   * @param {string[]} keys
   * @returns {Promise<{success: boolean, clearedKeys: string[], errors: Array<{key: string, error: string}>}>}
   */
  static async _removeKeys(keys) {
    const results = { success: true, clearedKeys: [], errors: [] };

    for (const key of keys) {
      try {
        await AsyncStorage.removeItem(key);
        results.clearedKeys.push(key);
        logInfo(`[CacheManager] Cleared: ${key}`);
      } catch (error) {
        logError(`[CacheManager] Failed to clear ${key}:`, error);
        results.errors.push({ key, error: error.message });
        results.success = false;
      }
    }

    return results;
  }

  /**
   * Clear all app cache and local storage (settings + every note bucket).
   */
  static async clearAllCache() {
    try {
      logInfo('[CacheManager] Starting cache clear operation...');
      const allKeys = await AsyncStorage.getAllKeys();
      logInfo('[CacheManager] Found storage keys:', allKeys);

      if (allKeys.length === 0) {
        logInfo('[CacheManager] No app data found to clear');
        return { success: true, clearedKeys: [], errors: [] };
      }

      const results = await this._removeKeys(allKeys);
      logInfo(
        `[CacheManager] Cache clear completed. Cleared ${results.clearedKeys.length} keys, ${results.errors.length} errors`
      );
      return results;
    } catch (error) {
      logError('[CacheManager] Cache clear operation failed:', error);
      return {
        success: false,
        clearedKeys: [],
        errors: [{ key: 'general', error: error.message }],
      };
    }
  }

  /**
   * Clear only notes data (preserve user settings).
   */
  static async clearNotesOnly() {
    try {
      logInfo('[CacheManager] Clearing notes data only...');
      const noteKeys = await this.listNoteKeys();

      if (noteKeys.length === 0) {
        logInfo('[CacheManager] No note data found to clear');
        return { success: true, clearedKeys: [], errors: [] };
      }

      return await this._removeKeys(noteKeys);
    } catch (error) {
      logError('[CacheManager] Notes clear operation failed:', error);
      return {
        success: false,
        clearedKeys: [],
        errors: [{ key: 'general', error: error.message }],
      };
    }
  }

  /**
   * Clear only user settings (preserve notes).
   */
  static async clearSettingsOnly() {
    try {
      logInfo('[CacheManager] Clearing settings data only...');
      const presentSettings = await this.listSettingsKeys();
      return await this._removeKeys(presentSettings);
    } catch (error) {
      logError('[CacheManager] Settings clear operation failed:', error);
      return {
        success: false,
        clearedKeys: [],
        errors: [{ key: 'general', error: error.message }],
      };
    }
  }

  /**
   * Get storage usage information for everything this app could have written.
   */
  static async getStorageInfo() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const settingsKeys = allKeys.filter(isSettingsKey);
      const noteKeys = allKeys.filter((k) => !isSettingsKey(k));

      let totalSize = 0;
      for (const key of allKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) totalSize += value.length;
        } catch (error) {
          logError(`[CacheManager] Error reading key ${key} for size calculation:`, error);
        }
      }

      const sizeInKB = (totalSize / 1024).toFixed(2);
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

      return {
        totalKeys: allKeys.length,
        appKeys: allKeys,
        settingsKeys,
        noteKeys,
        storageSize:
          totalSize > 1024 * 1024 ? `${sizeInMB} MB` : `${sizeInKB} KB`,
        rawSize: totalSize,
      };
    } catch (error) {
      logError('[CacheManager] Error getting storage info:', error);
      return {
        totalKeys: 0,
        appKeys: [],
        settingsKeys: [],
        noteKeys: [],
        storageSize: 'Unknown',
        rawSize: 0,
      };
    }
  }
}

export default CacheManager;
