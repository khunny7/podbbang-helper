const {app, BrowserWindow} = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function create() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: { contextIsolation: false, nodeIntegration: true }
  });

  const url = isDev
    ? 'http://localhost:5173'
    : `file://${path.resolve(__dirname, '../webapp/dist/index.html')}`;

  win.loadURL(url);            // dev ➞ CRA server, prod ➞ built HTML
  if (isDev) win.webContents.openDevTools({mode: 'detach'});
}

app.whenReady().then(create);
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && create());
