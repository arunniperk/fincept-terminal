const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  storageRead:  (key)        => ipcRenderer.invoke('storage-read',  key),
  storageWrite: (key, value) => ipcRenderer.invoke('storage-write', key, value),
  fileSave:     (name, data) => ipcRenderer.invoke('file-save', name, data),
  netFetch:     (url, options) => ipcRenderer.invoke('net-fetch', url, options),
});
