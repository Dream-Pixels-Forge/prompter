import path from 'node:path';
import { BrowserWindow, app, globalShortcut } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import { registerIpcHandlers } from './ipc';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Enable transparent visuals for Win/Linux (required for transparent window)
  if (process.platform === 'win32' || process.platform === 'linux') {
    app.commandLine.appendSwitch('enable-transparent-visuals');
  }

  mainWindow = new BrowserWindow({
    width: 520,
    height: 520,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: false,
    thickFrame: false,
    hasShadow: false,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // In dev, load from Vite dev server (vite-plugin-electron injects VITE_DEV_SERVER_URL).
  // In prod, load built files.
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setTimeout(() => {
    createWindow();
    if (!mainWindow) return;
    registerIpcHandlers(mainWindow);
  }, 300);

  // Global hotkey: Alt+Space to toggle
  globalShortcut.register('Alt+Space', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });

  // Global hotkey: Alt+M to toggle mic
  globalShortcut.register('Alt+M', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.webContents.send(IPC_CHANNELS.HOTKEY_TRIGGERED, 'toggle-mic');
    }
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
