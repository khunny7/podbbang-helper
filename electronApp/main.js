const {app, BrowserWindow} = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function create() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: { contextIsolation: false, nodeIntegration: true }
  });

   if (isDev) {
       // CRA dev server
       win.loadURL('http://localhost:5173');
     } else {
       // packaged: serve the extraResources copy
       const { resourcesPath } = process; 
       const indexHtml = path.join(resourcesPath, 'webapp', 'dist', 'index.html');
       win.loadURL(`file://${indexHtml}`);
     }
  if (isDev) win.webContents.openDevTools({mode: 'detach'});
}

app.whenReady().then(create);
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && create());
