const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, nativeImage, nativeTheme, screen, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { batteryService } = require('./services/battery.cjs');
const { audioService } = require('./services/audio.cjs');
const { networkService } = require('./services/network.cjs');
const { mediaService } = require('./services/media.cjs');
const { brightnessService } = require('./services/brightness.cjs');
const { systemService } = require('./services/system.cjs');
const { togglesService } = require('./services/toggles.cjs');
const { wallpaperService } = require('./services/wallpaper.cjs');

let mainWindow = null;
let tray = null;

function createWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: true,
    skipTaskbar: true,
    alwaysOnTop: false,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setFocusable(false);
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

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
    mainWindow.showInactive();
  });

  // Safety fallback to ensure window shows
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.showInactive();
    }
  }, 1500);
}

function showInteractivePanel(channel) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setFocusable(true);
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send(channel);
}

function createTray() {
  const iconCandidates = [
    path.join(__dirname, '../dist/assets/tray-icon.png'),
    path.join(__dirname, '../public/assets/tray-icon.png'),
    path.join(__dirname, '../src/assets/tray-icon.png'),
  ];
  const chosenPath = iconCandidates.find((candidate) => fs.existsSync(candidate));

  if (!chosenPath) return;

  try {
    const trayIcon = nativeImage.createFromPath(chosenPath).resize({ width: 18, height: 18 });
    trayIcon.setTemplateImage(true);
    tray = new Tray(trayIcon);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show Launcher', click: () => showInteractivePanel('toggle-overlay') },
      { label: 'Wallpaper & Widget Settings', click: () => showInteractivePanel('toggle-settings') },
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
  const shortcuts = [
    ['CommandOrControl+Shift+Space', 'toggle-overlay'],
    ['CommandOrControl+Shift+A', 'toggle-sidebar-left'],
    ['CommandOrControl+Shift+N', 'toggle-sidebar-right'],
    ['CommandOrControl+Shift+,', 'toggle-settings'],
  ];

  for (const [accelerator, channel] of shortcuts) {
    if (!globalShortcut.register(accelerator, () => showInteractivePanel(channel))) {
      console.warn(`Global shortcut unavailable: ${accelerator}`);
    }
  }
}

function isAllowedApplicationPath(targetPath) {
  if (typeof targetPath !== 'string' || !path.isAbsolute(targetPath) || !targetPath.endsWith('.app')) return false;
  const normalized = path.resolve(targetPath);
  const roots = ['/Applications', '/System/Applications', '/System/Library/CoreServices', path.join(os.homedir(), 'Applications')];
  return roots.some((root) => normalized.startsWith(`${path.resolve(root)}${path.sep}`));
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

  ipcMain.handle('set-wallpaper', (_, source) => wallpaperService.setWallpaper(source, {
    appPath: app.getAppPath(),
    userDataPath: app.getPath('userData'),
  }));

  // App launcher
  ipcMain.handle('get-applications', () => systemService.getApplications());
  ipcMain.handle('launch-app', async (_, appPath) => {
    if (!isAllowedApplicationPath(appPath)) return { ok: false, error: 'Application path is not allowed' };
    const error = await shell.openPath(appPath);
    return error ? { ok: false, error } : { ok: true };
  });
  ipcMain.handle('open-path', (_, targetPath) => {
    if (!targetPath || typeof targetPath !== 'string') return false;
    const expandedPath = targetPath.startsWith('~/')
      ? path.join(os.homedir(), targetPath.slice(2))
      : path.isAbsolute(targetPath) ? targetPath : path.join(os.homedir(), targetPath);
    return shell.openPath(expandedPath);
  });
  ipcMain.handle('open-external', async (_, targetUrl) => {
    try {
      const url = new URL(targetUrl);
      if (!['https:', 'http:'].includes(url.protocol)) return false;
      await shell.openExternal(url.toString());
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.on('set-ignore-mouse', (_, ignore) => {
    if (!mainWindow || mainWindow.isDestroyed() || typeof ignore !== 'boolean') return;
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  });
  ipcMain.on('set-always-on-top', (_, flag) => {
    if (!mainWindow || mainWindow.isDestroyed() || typeof flag !== 'boolean') return;
    mainWindow.setAlwaysOnTop(flag, flag ? 'floating' : 'normal');
  });
  ipcMain.on('set-window-mode', (_, mode) => {
    if (!mainWindow || mainWindow.isDestroyed() || !['desktop', 'interactive'].includes(mode)) return;
    const interactive = mode === 'interactive';
    mainWindow.setFocusable(interactive);
    mainWindow.setAlwaysOnTop(interactive, interactive ? 'floating' : 'normal');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
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
      x: display.workArea.x,
      y: display.workArea.y,
      width: display.workAreaSize.width,
      height: display.workAreaSize.height,
      scaleFactor: display.scaleFactor,
    };
  });
}

// App lifecycle
app.whenReady().then(() => {
  app.dock?.hide();
  registerIPCHandlers();
  createWindow();
  // Tray icon is optional, skip if icon file doesn't exist
  try { createTray(); } catch { console.log('Tray icon not found, skipping tray'); }
  registerGlobalShortcuts();

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
