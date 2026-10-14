const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  downloads: {
    getState: () => ipcRenderer.invoke('downloads:get-state'),
    enqueue: episode => ipcRenderer.invoke('downloads:enqueue', episode),
    enqueueMany: episodes => ipcRenderer.invoke('downloads:enqueue-many', episodes),
    cancel: jobId => ipcRenderer.invoke('downloads:cancel', jobId),
    retry: jobId => ipcRenderer.invoke('downloads:retry', jobId),
    chooseFolder: () => ipcRenderer.invoke('downloads:choose-folder'),
    showFile: jobId => ipcRenderer.invoke('downloads:show-file', jobId),
    clearFinished: () => ipcRenderer.invoke('downloads:clear-finished'),
    onUpdate: callback => {
      if (typeof callback !== 'function') return () => {};
      const listener = (_event, update) => callback(update);
      ipcRenderer.on('downloads:update', listener);
      return () => ipcRenderer.removeListener('downloads:update', listener);
    },
  },
});
