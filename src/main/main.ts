import path from 'node:path';
import { BrowserWindow, app, globalShortcut } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import { registerIpcHandlers } from './ipc';

// Transparent window fixes per platform:
// - Windows: enable-transparent-visuals enables DWM alpha channel
// - Linux: GPU drivers often don't produce correct alpha in window surfaces.
//          SwiftShader (bundled software GL renderer) handles transparency correctly.
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
} else if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
  app.commandLine.appendSwitch('use-gl', 'swiftshader');
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 540,
    height: 540,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
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
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Make transparent areas click-through by default.
  // The renderer toggles this via IPC when the mouse enters/leaves the widget.
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

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
