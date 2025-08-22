/**
 * Simple unified storage service using localStorage
 * Works identically in both web and Electron environments
 */
class StorageService {
  /**
   * Get a value from storage
   * @param {string} key - The key to retrieve
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} The stored value or default value
   */
  get(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(key);
      
      // Only log raw lookups if there's an issue
      if (stored === null || stored === 'undefined' || stored === 'null') {
        console.log(`📖 No valid data for key: ${key}, using default:`, defaultValue);
        return defaultValue;
      }
      
      const value = JSON.parse(stored);
      // Only log successful loads in development or for debugging
      if (process.env.NODE_ENV === 'development' && !window._storageLoggedKeys?.has(key)) {
        window._storageLoggedKeys = window._storageLoggedKeys || new Set();
        window._storageLoggedKeys.add(key);
        console.log(`📖 Loaded from storage: ${key}`, {
          parsedValue: value,
          type: typeof value
        });
      }
      return value;
    } catch (error) {
      console.error(`Storage get error for key ${key}:`, error);
      // Clear the corrupted value
      localStorage.removeItem(key);
      return defaultValue;
    }
  }

  /**
   * Set a value in storage
   * @param {string} key - The key to store
   * @param {*} value - The value to store
   */
  set(key, value) {
    try {
      // Validate the value before saving
      if (value === undefined) {
        console.warn(`⚠️ Attempted to save undefined value for key: ${key}. Skipping save.`);
        return;
      }
      
      if (value === null) {
        console.warn(`⚠️ Attempted to save null value for key: ${key}. Removing instead.`);
        this.remove(key);
        return;
      }
      
      const jsonValue = JSON.stringify(value);
      
      // Additional check for stringify result
      if (jsonValue === undefined) {
        console.warn(`⚠️ JSON.stringify returned undefined for key: ${key}, value:`, value);
        return;
      }
      
      localStorage.setItem(key, jsonValue);
      
      // Only log storage saves for important keys or in development mode
      if (process.env.NODE_ENV === 'development' && (key.includes('playlist') || key.includes('episode'))) {
        console.log(`💾 Saved to storage: ${key}`, {
          value: value,
          serialized: jsonValue,
          type: typeof value,
          isArray: Array.isArray(value),
          length: Array.isArray(value) ? value.length : 'N/A'
        });
      }
      
      // Verify it was saved correctly by reading it back (but don't log success)
      const verification = localStorage.getItem(key);
      if (verification !== jsonValue) {
        console.error(`❌ Storage verification failed for ${key}:`, {
          saved: jsonValue,
          retrieved: verification
        });
      }
    } catch (error) {
      console.error('Storage set error:', error);
    }
  }

  /**
   * Remove a value from storage
   * @param {string} key - The key to remove
   */
  remove(key) {
    try {
      const existingValue = localStorage.getItem(key);
      localStorage.removeItem(key);
      console.log(`🗑️ Removed from storage: ${key}`, {
        hadValue: existingValue !== null,
        previousValue: existingValue
      });
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  }

  /**
   * Clear all storage
   */
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }

  /**
   * Get all keys with a specific prefix
   * @param {string} prefix 
   * @returns {string[]}
   */
  getKeysWithPrefix(prefix) {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error('Storage getKeysWithPrefix error:', error);
      return [];
    }
  }

  /**
   * Debug method to inspect all storage contents
   */
  debugStorage() {
    console.group('🔍 localStorage Debug');
    console.log('Total localStorage items:', localStorage.length);
    
    const podbbangKeys = this.getKeysWithPrefix('podbbang_');
    console.log('Podbbang keys found:', podbbangKeys);
    
    podbbangKeys.forEach(key => {
      const value = localStorage.getItem(key);
      try {
        const parsed = JSON.parse(value);
        console.log(`${key}:`, {
          raw: value,
          parsed: parsed,
          type: typeof parsed,
          isArray: Array.isArray(parsed),
          length: Array.isArray(parsed) ? parsed.length : 'N/A'
        });
      } catch (e) {
        console.log(`${key}:`, { raw: value, parseError: e.message });
      }
    });
    console.groupEnd();
  }
}

// Storage keys constants
export const STORAGE_KEYS = {
  PLAYLIST: 'podbbang_playlist',
  CURRENT_EPISODE: 'podbbang_current_episode',
  PLAYBACK_POSITION: 'podbbang_playback_position',
  PLAYBACK_SPEED: 'podbbang_playback_speed',
  VOLUME: 'podbbang_volume',
  RECENT_CHANNELS: 'podbbang_recent_channels',
  FAVORITES: 'podbbang_favorites',
  SETTINGS: 'podbbang_settings',
};

export default new StorageService();
