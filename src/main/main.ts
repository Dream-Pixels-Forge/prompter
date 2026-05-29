import path from 'node:path';
import { BrowserWindow, app, globalShortcut, session, shell } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import { registerIpcHandlers } from './ipc';

let mainWindow: BrowserWindow | null = null;

// Track whether the app is intentionally quitting (not just hiding to tray)
// biome-ignore lint/suspicious/noExplicitAny: Electron App type omits isQuitting
(app as any).isQuitting = false;

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

  // Security: prevent window navigation (phishing protection)
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  // Security: open external links in the OS default browser, not inside the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Hide to tray instead of closing (unless app is quitting)
  mainWindow.on('close', (e) => {
    // biome-ignore lint/suspicious/noExplicitAny: Electron App type omits isQuitting
    if (!(app as any).isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Security: enforce CSP at the session level (defense-in-depth beyond meta tag).
  // In dev, Vite injects inline module scripts for HMR (@react-refresh, @vite/client),
  // so we allow 'unsafe-inline' for scripts only in dev to keep HMR working.
  // In prod, the meta tag in index.html enforces the strict policy.
  const csp = process.env.VITE_DEV_SERVER_URL
    ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws://localhost:*; img-src 'self' data:; form-action 'none'; base-uri 'none'; frame-ancestors 'none'"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; form-action 'none'; base-uri 'none'; frame-ancestors 'none'";

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });

  setTimeout(() => {
    createWindow();
    if (!mainWindow) return;
    registerIpcHandlers(mainWindow);
  }, 0);

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

app.on('before-quit', () => {
  // biome-ignore lint/suspicious/noExplicitAny: Electron App type omits isQuitting
  (app as any).isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
