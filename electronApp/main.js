const { app, BrowserWindow, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const { fileURLToPath } = require('url');
const isDev = require('electron-is-dev');
const { DownloadManager } = require('./download-manager');

let mainWindow;
let downloadManager;
let isQuitting = false;
let quitPromptOpen = false;

const promptBeforeQuit = window => {
  if (quitPromptOpen || !downloadManager || downloadManager.getPendingCount() === 0) return;
  quitPromptOpen = true;
  dialog.showMessageBox(window, {
    type: 'warning',
    title: 'Downloads are in progress',
    message: 'There are downloads in progress or waiting in the queue.',
    detail: 'Keep the app open to finish downloading, or quit and save the queue to restart later.',
    buttons: ['Keep app open', 'Quit and save queue'],
    defaultId: 0,
    cancelId: 0,
    noLink: true,
  }).then(async result => {
    if (result.response === 1) {
      isQuitting = true;
      await downloadManager.shutdown();
      if (window && !window.isDestroyed()) window.close();
      else app.quit();
    }
  }).catch(() => {}).finally(() => { quitPromptOpen = false; });
};

const isTrustedUrl = (value, localIndexHtml) => {
  try {
    const url = new URL(value);
    return (isDev && url.protocol === 'http:' && url.hostname === 'localhost' && url.port === '5173')
      || (url.protocol === 'file:' && path.resolve(fileURLToPath(url)) === path.resolve(localIndexHtml));
  } catch {
    return false;
  }
};

function createWindow() {
  const indexHtml = path.join(process.resourcesPath, 'dist', 'index.html');
  const window = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 360,
    minHeight: 480,
    icon: path.join(__dirname, 'assets', 'appx', 'Square256x256Logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = window;

  const preventUntrustedNavigation = (event, url) => {
    if (!isTrustedUrl(url, indexHtml)) {
      event.preventDefault();
      if (url.startsWith('https://')) shell.openExternal(url).catch(() => {});
    }
  };
  window.webContents.on('will-navigate', preventUntrustedNavigation);
  window.webContents.on('will-redirect', preventUntrustedNavigation);

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  window.on('closed', () => {
    if (mainWindow === window) mainWindow = null;
  });

  window.on('close', event => {
    if (isQuitting || !downloadManager || downloadManager.getPendingCount() === 0) return;
    event.preventDefault();
    promptBeforeQuit(window);
  });

  if (isDev) {
    window.loadURL('http://localhost:5173');
    if (process.env.OPEN_DEV_TOOLS === 'true') window.webContents.openDevTools({ mode: 'detach' });
  } else {
    window.loadFile(indexHtml);
  }
}

const registerDownloadIpc = () => {
  const indexHtml = path.join(process.resourcesPath, 'dist', 'index.html');
  const assertTrustedSender = event => {
    if (!mainWindow || event.sender !== mainWindow.webContents) throw new Error('Downloads can only be managed from the app window.');
    const frameUrl = event.senderFrame?.url || '';
    if (!isTrustedUrl(frameUrl, indexHtml)) throw new Error('The download request came from an untrusted page.');
  };
  const handle = (channel, action) => ipcMain.handle(channel, async (event, ...args) => {
    assertTrustedSender(event);
    return action(...args);
  });

  handle('downloads:get-state', () => downloadManager.snapshot());
  handle('downloads:enqueue', episode => downloadManager.enqueue(episode));
  handle('downloads:enqueue-many', episodes => downloadManager.enqueueMany(episodes));
  handle('downloads:cancel', jobId => downloadManager.cancel(jobId));
  handle('downloads:retry', jobId => downloadManager.retry(jobId));
  handle('downloads:choose-folder', () => downloadManager.chooseFolder());
  handle('downloads:show-file', jobId => downloadManager.showFile(jobId));
  handle('downloads:clear-finished', () => downloadManager.clearFinished());
};

app.whenReady().then(async () => {
  downloadManager = new DownloadManager({
    app,
    dialog,
    shell,
    getWindow: () => mainWindow,
    onChange: update => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('downloads:update', update);
    },
  });
  await downloadManager.initialize();
  registerDownloadIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', event => {
  if (isQuitting || !downloadManager || downloadManager.getPendingCount() === 0) return;
  event.preventDefault();
  promptBeforeQuit(mainWindow);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
