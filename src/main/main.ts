import path from 'node:path';
import { BrowserWindow, app, globalShortcut, screen } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import { registerIpcHandlers } from './ipc';

// Transparent window fixes per platform:
// - Windows: enable-transparent-visuals enables DWM alpha channel
// - Linux (X11): enables transparency via X composite extension
if (process.platform === 'win32' || process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    x: screenWidth - 80 - 20,
    y: screenHeight - 80 - 20,
    width: 80,
    height: 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    thickFrame: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
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
  createWindow();
  if (!mainWindow) return;
  registerIpcHandlers(mainWindow);

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
