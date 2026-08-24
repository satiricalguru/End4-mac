const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── System Info ──────────────────────────────
  getBattery: () => ipcRenderer.invoke('get-battery'),
  getAudio: () => ipcRenderer.invoke('get-audio'),
  setVolume: (vol) => ipcRenderer.invoke('set-volume', vol),
  toggleMute: () => ipcRenderer.invoke('toggle-mute'),
  getNetwork: () => ipcRenderer.invoke('get-network'),
  getBrightness: () => ipcRenderer.invoke('get-brightness'),
  setBrightness: (val) => ipcRenderer.invoke('set-brightness', val),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getCpuUsage: () => ipcRenderer.invoke('get-cpu-usage'),
  getMemoryUsage: () => ipcRenderer.invoke('get-memory-usage'),

  // ── Quick Toggles ────────────────────────────
  getToggleStates: () => ipcRenderer.invoke('get-toggle-states'),
  toggleWifi: (enable) => ipcRenderer.invoke('toggle-wifi', enable),
  toggleDarkMode: () => ipcRenderer.invoke('toggle-dark-mode'),
  toggleBluetooth: (enable) => ipcRenderer.invoke('toggle-bluetooth', enable),
  toggleDnd: () => ipcRenderer.invoke('toggle-dnd'),

  // ── Media ────────────────────────────────────
  getMedia: () => ipcRenderer.invoke('get-media'),
  mediaControl: (action) => ipcRenderer.invoke('media-control', action),

  // ── Wallpaper ────────────────────────────────
  setWallpaper: (path) => ipcRenderer.invoke('set-wallpaper', path),

  // ── Apps ─────────────────────────────────────
  getApplications: () => ipcRenderer.invoke('get-applications'),
  launchApp: (path) => ipcRenderer.invoke('launch-app', path),
  openPath: (path) => ipcRenderer.invoke('open-path', path),

  // ── Screen ───────────────────────────────────
  getScreenInfo: () => ipcRenderer.invoke('get-screen-info'),
  getDarkMode: () => ipcRenderer.invoke('get-dark-mode'),

  // ── Window Control ───────────────────────────
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),
  setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', flag),
  setWindowMode: (mode) => ipcRenderer.send('set-window-mode', mode),

  // ── Event Listeners ──────────────────────────
  onToggleOverlay: (cb) => ipcRenderer.on('toggle-overlay', cb),
  onToggleSidebarLeft: (cb) => ipcRenderer.on('toggle-sidebar-left', cb),
  onToggleSidebarRight: (cb) => ipcRenderer.on('toggle-sidebar-right', cb),
  onToggleSettings: (cb) => ipcRenderer.on('toggle-settings', cb),
  onOpenSettings: (cb) => ipcRenderer.on('open-settings', cb),
  onDarkModeChanged: (cb) => ipcRenderer.on('dark-mode-changed', (_, val) => cb(val)),

  // ── Cleanup ──────────────────────────────────
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
