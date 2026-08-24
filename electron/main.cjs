const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, nativeTheme, screen, shell } = require('electron');
const path = require('path');
const os = require('os');
const { batteryService } = require('./services/battery.cjs');
const { audioService } = require('./services/audio.cjs');
const { networkService } = require('./services/network.cjs');
const { mediaService } = require('./services/media.cjs');
const { brightnessService } = require('./services/brightness.cjs');
const { systemService } = require('./services/system.cjs');
const { togglesService } = require('./services/toggles.cjs');

let mainWindow = null;
let tray = null;

const isDev = !app.isPackaged;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: true,
    skipTaskbar: false,
    alwaysOnTop: false,
    visibleOnAllWorkspaces: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  // Enable interactive mouse events
  mainWindow.setIgnoreMouseEvents(false);

  // Load from Vite dev server if running, otherwise load production build
  const distPath = path.join(__dirname, '../dist/index.html');
  const useDevServer = process.env.VITE_DEV === '1' || process.argv.includes('--dev');

  if (useDevServer) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow.loadFile(distPath);
    });
  } else {
    mainWindow.loadFile(distPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Safety fallback to ensure window shows
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 1500);

  // Handle transparent click-through toggling from renderer
  ipcMain.on('set-ignore-mouse', (_, ignore) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
    }
  });

  ipcMain.on('set-window-mode', (_, mode) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mode === 'desktop') {
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      if (process.platform === 'darwin') {
        mainWindow.setWindowButtonVisibility?.(false);
      }
    } else {
      mainWindow.setAlwaysOnTop(true, 'floating');
    }
  });
}

function createTray() {
  const fs = require('fs');
  const iconPath = path.join(__dirname, '../public/assets/tray-icon.png');
  const fallbackPath = path.join(__dirname, '../src/assets/tray-icon.png');
  const chosenPath = fs.existsSync(iconPath) ? iconPath : fs.existsSync(fallbackPath) ? fallbackPath : null;

  if (!chosenPath) return;

  try {
    tray = new Tray(chosenPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show / Focus Shell', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
      { label: 'Wallpaper & Widget Settings', click: () => mainWindow?.webContents.send('toggle-settings') },
      { label: 'Spotlight Launcher', click: () => mainWindow?.webContents.send('toggle-overlay') },
      { type: 'separator' },
      { label: 'Quit end4-pC', click: () => app.quit() },
    ]);
    tray.setToolTip('end4-pC Mac Shell & Wallpaper Engine');
    tray.setContextMenu(contextMenu);
  } catch (err) {
    console.log('Tray creation notice:', err.message);
  }
}

function registerGlobalShortcuts() {
  // Toggle launcher overlay
  globalShortcut.register('Control+Space', () => {
    mainWindow?.webContents.send('toggle-overlay');
  });

  // Toggle left sidebar
  globalShortcut.register('Super+A', () => {
    mainWindow?.webContents.send('toggle-sidebar-left');
  });

  // Toggle right sidebar
  globalShortcut.register('Super+N', () => {
    mainWindow?.webContents.send('toggle-sidebar-right');
  });

  // Toggle settings
  globalShortcut.register('Super+Escape', () => {
    mainWindow?.webContents.send('toggle-settings');
  });
}

function registerIPCHandlers() {
  // System info handlers
  ipcMain.handle('get-battery', () => batteryService.getBattery());
  ipcMain.handle('get-audio', () => audioService.getAudio());
  ipcMain.handle('set-volume', (_, vol) => audioService.setVolume(vol));
  ipcMain.handle('toggle-mute', () => audioService.toggleMute());
  ipcMain.handle('get-network', () => networkService.getNetwork());
  ipcMain.handle('get-media', () => mediaService.getNowPlaying());
  ipcMain.handle('media-control', (_, action) => mediaService.control(action));
  ipcMain.handle('get-brightness', () => brightnessService.getBrightness());
  ipcMain.handle('set-brightness', (_, val) => brightnessService.setBrightness(val));
  ipcMain.handle('get-system-info', () => systemService.getSystemInfo());
  ipcMain.handle('get-cpu-usage', () => systemService.getCpuUsage());
  ipcMain.handle('get-memory-usage', () => systemService.getMemoryUsage());

  // Quick Toggles
  ipcMain.handle('get-toggle-states', () => togglesService.getToggleStates());
  ipcMain.handle('toggle-wifi', (_, enable) => togglesService.toggleWifi(enable));
  ipcMain.handle('toggle-dark-mode', () => togglesService.toggleDarkMode());
  ipcMain.handle('toggle-bluetooth', (_, enable) => togglesService.toggleBluetooth(enable));
  ipcMain.handle('toggle-dnd', () => togglesService.toggleDnd());

  // Wallpaper handler
  ipcMain.handle('set-wallpaper', async (_, filePath) => {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec(`osascript -e 'tell application "Finder" to set desktop picture to POSIX file "${filePath}"'`, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  });

  // App launcher
  ipcMain.handle('get-applications', () => systemService.getApplications());
  ipcMain.handle('launch-app', (_, appPath) => {
    const { exec } = require('child_process');
    exec(`open "${appPath}"`);
  });
  ipcMain.handle('open-path', (_, targetPath) => {
    if (!targetPath || typeof targetPath !== 'string') return false;
    const expandedPath = targetPath.startsWith('~/')
      ? path.join(os.homedir(), targetPath.slice(2))
      : targetPath;
    return shell.openPath(expandedPath);
  });

  // Dark mode
  ipcMain.handle('get-dark-mode', () => nativeTheme.shouldUseDarkColors);
  nativeTheme.on('updated', () => {
    mainWindow?.webContents.send('dark-mode-changed', nativeTheme.shouldUseDarkColors);
  });

  // Screen info
  ipcMain.handle('get-screen-info', () => {
    const display = screen.getPrimaryDisplay();
    return {
      width: display.workAreaSize.width,
      height: display.workAreaSize.height,
      scaleFactor: display.scaleFactor,
    };
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  // Tray icon is optional, skip if icon file doesn't exist
  try { createTray(); } catch (e) { console.log('Tray icon not found, skipping tray'); }
  registerGlobalShortcuts();
  registerIPCHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
