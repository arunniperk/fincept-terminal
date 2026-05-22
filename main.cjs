const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(app.getPath('documents'), 'FinceptTerminal');
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width, height,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: '#080808',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

const DIST_HTML = path.join(__dirname, 'dist', 'index.html');

  if (fs.existsSync(DIST_HTML)) {
    mainWindow.loadFile(DIST_HTML);
  } else {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// File-based storage IPC (Documents\FinceptTerminal\<key>.json)
ipcMain.handle('storage-read', async (_event, key) => {
  try {
    if (!fs.existsSync(DATA_DIR)) await fs.promises.mkdir(DATA_DIR, { recursive: true });
    const file = path.join(DATA_DIR, `${key}.json`);
    if (!fs.existsSync(file)) return null;
    return await fs.promises.readFile(file, 'utf8');
  } catch { return null; }
});

ipcMain.handle('storage-write', async (_event, key, value) => {
  try {
    if (!fs.existsSync(DATA_DIR)) await fs.promises.mkdir(DATA_DIR, { recursive: true });
    await fs.promises.writeFile(path.join(DATA_DIR, `${key}.json`), value, 'utf8');
    return true;
  } catch { return false; }
});

ipcMain.handle('file-save', async (_event, name, data) => {
  try {
    if (!fs.existsSync(DATA_DIR)) await fs.promises.mkdir(DATA_DIR, { recursive: true });
    await fs.promises.writeFile(path.join(DATA_DIR, name), data, 'utf8');
    return true;
  } catch { return false; }
});

// Secure cross-origin fetch via main process (avoids CORS)
ipcMain.handle('net-fetch', async (_event, url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        ...(options.headers || {})
      }
    });
    if (!response.ok) return null;
    return await response.text();
  } catch { return null; }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
