const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Storage methods
  store: {
    get: (key, defaultValue) => ipcRenderer.invoke('storage:get', key, defaultValue),
    set: (key, value) => ipcRenderer.invoke('storage:set', key, value),
    delete: (key) => ipcRenderer.invoke('storage:delete', key),
    clear: () => ipcRenderer.invoke('storage:clear'),
    getAll: () => ipcRenderer.invoke('storage:getAll')
  },
  
  // File system methods
  writeFile: (filePath, content) => ipcRenderer.invoke('file:write', filePath, content),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  
  // Utility methods
  getStoragePath: () => ipcRenderer.invoke('storage:getPath'),
  
  // App info
  isElectron: true,
  platform: process.platform
});
