const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Platform & Environment
  platform: process.platform,

  // Window Controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Directory Selection
  selectDownloadDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  getDefaultDownloadDirectory: () => ipcRenderer.invoke('get-default-download-dir'),

  // Binaries Management
  getBinariesStatus: () => ipcRenderer.invoke('binaries:get-status'),
  retryDownloadBinaries: () => ipcRenderer.invoke('binaries:retry'),

  // Queue Operations
  getQueueItems: () => ipcRenderer.invoke('queue:get-items'),
  addItem: (data) => ipcRenderer.invoke('queue:add-item', data),
  pauseItem: (id) => ipcRenderer.invoke('queue:pause-item', id),
  resumeItem: (id) => ipcRenderer.invoke('queue:resume-item', id),
  removeItem: (id) => ipcRenderer.invoke('queue:remove-item', id),
  updateItemConfig: (id, config) => ipcRenderer.invoke('queue:update-config', { id, config }),
  pauseAll: () => ipcRenderer.invoke('queue:pause-all'),
  resumeAll: () => ipcRenderer.invoke('queue:resume-all'),
  startAll: () => ipcRenderer.invoke('queue:start-all'),
  clearCompleted: () => ipcRenderer.invoke('queue:clear-completed'),
  downloadThumbnail: (taskId) => ipcRenderer.invoke('queue:download-thumbnail', taskId),
  saveMetadata: (taskId, type) => ipcRenderer.invoke('queue:save-metadata', { taskId, type }),
  downloadCarouselItem: (taskId, itemIndex) => ipcRenderer.invoke('queue:download-carousel-item', { taskId, itemIndex }),
  downloadAllCarousel: (taskId) => ipcRenderer.invoke('queue:download-all-carousel', taskId),
  refreshItemMetadata: (taskId) => ipcRenderer.invoke('queue:refresh-metadata', taskId),

  // Instagram Session Management
  getInstagramStatus: () => ipcRenderer.invoke('instagram:get-status'),
  connectInstagram: () => ipcRenderer.invoke('instagram:connect'),
  logoutInstagram: () => ipcRenderer.invoke('instagram:logout'),
  onInstagramStatusChanged: (callback) => {
    const sub = (_event, val) => callback(val);
    ipcRenderer.on('instagram:status-changed', sub);
    return () => ipcRenderer.removeListener('instagram:status-changed', sub);
  },

  // Binary Event Listeners
  onBinaryProgress: (callback) => {
    const sub = (_event, val) => callback(val);
    ipcRenderer.on('binaries:progress', sub);
    return () => ipcRenderer.removeListener('binaries:progress', sub);
  },
  onBinaryStatus: (callback) => {
    const sub = (_event, val) => callback(val);
    ipcRenderer.on('binaries:status', sub);
    return () => ipcRenderer.removeListener('binaries:status', sub);
  },

  // Queue Event Listeners
  onQueueUpdated: (callback) => {
    const sub = (_event, items) => callback(items);
    ipcRenderer.on('queue:updated', sub);
    return () => ipcRenderer.removeListener('queue:updated', sub);
  },
  onQueueProgress: (callback) => {
    const sub = (_event, progressData) => callback(progressData);
    ipcRenderer.on('queue:progress', sub);
    return () => ipcRenderer.removeListener('queue:progress', sub);
  },
  onQueueItemCompleted: (callback) => {
    const sub = (_event, data) => callback(data);
    ipcRenderer.on('queue:item-completed', sub);
    return () => ipcRenderer.removeListener('queue:item-completed', sub);
  },
  onQueueItemError: (callback) => {
    const sub = (_event, data) => callback(data);
    ipcRenderer.on('queue:item-error', sub);
    return () => ipcRenderer.removeListener('queue:item-error', sub);
  },
});
