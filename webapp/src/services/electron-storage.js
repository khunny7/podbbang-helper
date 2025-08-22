import { isElectron } from '../common';

/**
 * Enhanced storage service with Electron-specific optimizations
 */
class ElectronStorageService {
  constructor() {
    this.isElectronApp = isElectron();
    this.electronStore = null;
    
    // Initialize electron-specific storage if available
    if (this.isElectronApp) {
      this.initElectronStorage();
    }
  }

  /**
   * Initialize Electron-specific storage
   * This would require adding electron-store package and IPC setup
   */
  initElectronStorage() {
    try {
      // Check if we have access to electron APIs
      if (window.electronAPI) {
        this.electronStore = window.electronAPI.store;
        console.log('✅ Electron native storage initialized');
      } else {
        console.log('📱 Using localStorage fallback in Electron');
      }
    } catch (error) {
      console.log('📱 Electron APIs not available, using localStorage');
    }
  }

  /**
   * Get value from storage
   */
  async get(key, defaultValue = null) {
    try {
      if (this.isElectronApp && this.electronStore) {
        // Use Electron's native storage (main process)
        return await this.electronStore.get(key, defaultValue);
      } else {
        // Fallback to localStorage (renderer process or web)
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
      }
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  }

  /**
   * Set value in storage
   */
  async set(key, value) {
    try {
      if (this.isElectronApp && this.electronStore) {
        // Use Electron's native storage
        await this.electronStore.set(key, value);
      } else {
        // Fallback to localStorage
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Storage set error:', error);
    }
  }

  /**
   * Remove value from storage
   */
  async remove(key) {
    try {
      if (this.isElectronApp && this.electronStore) {
        await this.electronStore.delete(key);
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  }

  /**
   * Clear all storage
   */
  async clear() {
    try {
      if (this.isElectronApp && this.electronStore) {
        await this.electronStore.clear();
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }

  /**
   * Get storage path (Electron only)
   */
  getStoragePath() {
    if (this.isElectronApp && window.electronAPI) {
      return window.electronAPI.getStoragePath();
    }
    return null;
  }

  /**
   * Backup data to file (Electron only)
   */
  async backupToFile(filePath) {
    if (this.isElectronApp && window.electronAPI) {
      try {
        const allData = await this.getAllData();
        await window.electronAPI.writeFile(filePath, JSON.stringify(allData, null, 2));
        return true;
      } catch (error) {
        console.error('Backup failed:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Restore data from file (Electron only)
   */
  async restoreFromFile(filePath) {
    if (this.isElectronApp && window.electronAPI) {
      try {
        const data = await window.electronAPI.readFile(filePath);
        const parsedData = JSON.parse(data);
        
        for (const [key, value] of Object.entries(parsedData)) {
          await this.set(key, value);
        }
        return true;
      } catch (error) {
        console.error('Restore failed:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Get all stored data
   */
  async getAllData() {
    if (this.isElectronApp && this.electronStore) {
      return await this.electronStore.getAll();
    } else {
      // Fallback: get all localStorage data
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key));
          } catch {
            data[key] = localStorage.getItem(key);
          }
        }
      }
      return data;
    }
  }
}

export default new ElectronStorageService();
