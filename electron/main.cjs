const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const BinaryManager = require('./binaryManager.cjs');
const QueueManager = require('./queueManager.cjs');
const InstagramAuth = require('./instagramAuth.cjs');

let mainWindow = null;
let binaryManager = null;
let queueManager = null;
let instagramAuth = null;


const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 960,
    minHeight: 650,
    title: 'Universal Media Downloader',
    backgroundColor: '#0e0e11',
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, '../assets/icon.svg')
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Fallback safety timeout in case ready-to-show is delayed
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 1000);

  // Log all renderer console output to terminal
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[Renderer L${level}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Load Error] ${errorCode}: ${errorDescription} on ${validatedURL}`);
    if (validatedURL.includes('5173')) {
      console.log('Falling back to local dist/index.html...');
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
    if (process.env.OPEN_DEVTOOLS) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    initBinaries();
    if (queueManager) {
      mainWindow.webContents.send('queue:updated', queueManager.getItems());
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initBinaries() {
  if (!binaryManager) {
    binaryManager = new BinaryManager(app.getPath('userData'));
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('binaries:status', binaryManager.getStatus());
  }

  try {
    const status = await binaryManager.init((progressInfo) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('binaries:progress', progressInfo);
      }
    });

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('binaries:status', status);
    }
  } catch (err) {
    console.error('Error during binary initialization:', err);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('binaries:status', binaryManager.getStatus());
    }
  }
}

// App lifecycle
app.whenReady().then(() => {
  binaryManager = new BinaryManager(app.getPath('userData'));
  instagramAuth = new InstagramAuth(app.getPath('userData'));
  queueManager = new QueueManager(binaryManager, () => mainWindow, instagramAuth);
  setupIpcHandlers();
  createWindow();


  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIpcHandlers() {
  // Directory Picker
  ipcMain.handle('dialog:openDirectory', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Destination Folder'
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // Default Download Directory
  ipcMain.handle('get-default-download-dir', () => {
    return app.getPath('downloads');
  });

  // Binary Management IPC
  ipcMain.handle('binaries:get-status', () => {
    return binaryManager ? binaryManager.getStatus() : null;
  });

  ipcMain.handle('binaries:retry', async () => {
    if (!binaryManager) {
      binaryManager = new BinaryManager(app.getPath('userData'));
    }
    return await binaryManager.init((progressInfo) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('binaries:progress', progressInfo);
      }
    });
  });

  // Queue Operations IPC
  ipcMain.handle('queue:get-items', () => {
    return queueManager ? queueManager.getItems() : [];
  });

  ipcMain.handle('queue:add-item', (_event, itemData) => {
    if (!queueManager) return null;
    return queueManager.addItem(itemData);
  });

  ipcMain.handle('queue:pause-item', (_event, id) => {
    if (queueManager) queueManager.pauseTask(id);
    return true;
  });

  ipcMain.handle('queue:resume-item', (_event, id) => {
    if (queueManager) queueManager.resumeTask(id);
    return true;
  });

  ipcMain.handle('queue:remove-item', (_event, id) => {
    if (queueManager) queueManager.removeTask(id);
    return true;
  });

  ipcMain.handle('queue:update-config', (_event, { id, config }) => {
    if (queueManager) queueManager.updateTaskConfig(id, config);
    return true;
  });

  ipcMain.handle('queue:pause-all', () => {
    if (queueManager) queueManager.pauseAll();
    return true;
  });

  ipcMain.handle('queue:resume-all', () => {
    if (queueManager) queueManager.resumeAll();
    return true;
  });

  ipcMain.handle('queue:start-all', () => {
    if (queueManager) queueManager.startAll();
    return true;
  });

  ipcMain.handle('queue:clear-completed', () => {
    if (queueManager) queueManager.clearCompleted();
    return true;
  });

  ipcMain.handle('queue:download-thumbnail', async (_event, taskId) => {
    if (!queueManager) return { success: false, error: 'QueueManager not ready' };
    return await queueManager.downloadThumbnailOnly(taskId);
  });

  ipcMain.handle('queue:save-metadata', async (_event, { taskId, type }) => {
    if (!queueManager) return { success: false, error: 'QueueManager not ready' };
    return await queueManager.saveMetadataOnly(taskId, type);
  });

  ipcMain.handle('queue:download-carousel-item', async (_event, { taskId, itemIndex }) => {
    if (!queueManager) return { success: false, error: 'QueueManager not ready' };
    return await queueManager.downloadCarouselItem(taskId, itemIndex);
  });

  ipcMain.handle('queue:download-all-carousel', async (_event, taskId) => {
    if (!queueManager) return { success: false, error: 'QueueManager not ready' };
    return await queueManager.downloadAllCarousel(taskId);
  });

  ipcMain.handle('queue:refresh-metadata', async (_event, taskId) => {
    if (!queueManager) return false;
    return await queueManager.refreshMetadata(taskId);
  });

  // Instagram Session Management IPC
  ipcMain.handle('instagram:get-status', async () => {
    if (!instagramAuth) return { connected: false, username: null };
    return await instagramAuth.checkStatus();
  });

  ipcMain.handle('instagram:connect', async () => {
    if (!instagramAuth) return { success: false, error: 'InstagramAuth not ready' };
    const res = await instagramAuth.openLoginWindow(mainWindow);
    if (res && res.connected && queueManager) {
      // Re-trigger metadata on all Instagram tasks that failed with auth error
      queueManager.refreshAllInstagramTasks();
    }
    return res;
  });

  ipcMain.handle('instagram:logout', async () => {
    if (!instagramAuth) return { success: false };
    return await instagramAuth.logout();
  });

  // Window Controls
  ipcMain.on('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window:close', () => {
    if (mainWindow) mainWindow.close();
  });
}
