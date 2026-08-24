import React, { useState, useEffect } from 'react';
import { MaterialThemeProvider, useTheme } from './theme/MaterialTheme';
import WallpaperBackground from './modules/wallpaperEngine/WallpaperBackground';
import DesktopWidgetsContainer from './modules/desktopWidgets/DesktopWidgetsContainer';
import WallpaperSelectorModal from './modules/wallpaperSelector/WallpaperSelectorModal';
import Bar from './modules/bar/Bar';
import SidebarLeft from './modules/sidebarLeft/SidebarLeft';
import SidebarRight from './modules/sidebarRight/SidebarRight';
import Overlay from './modules/overlay/Overlay';
import { resolveAssetUrl } from './utils/assetUrl';

const DEFAULT_WALLPAPER_CONFIG = {
  mode: 'image',
  wallpaperUrl: '/assets/images/default_wallpaper.png',
  shaderType: 'aurora',
  blur: 0,
  dim: 10,
  centeredShape: {
    enabled: true,
    shape: 'Cookie7Sided',
    size: 440,
    color: 'var(--md-primary-container)',
    opacity: 0.6,
    rotate: true,
  },
  clockStyle: 'cookie',
  showVisualizer: true,
  showWeather: true,
  showSystem: true,
};

function readWallpaperConfig() {
  try {
    const saved = localStorage.getItem('end4pc-wallpaper-config');
    return saved
      ? { ...DEFAULT_WALLPAPER_CONFIG, ...JSON.parse(saved) }
      : DEFAULT_WALLPAPER_CONFIG;
  } catch {
    return DEFAULT_WALLPAPER_CONFIG;
  }
}

function ShellContent() {
  const [sidebarLeftOpen, setSidebarLeftOpen] = useState(false);
  const [sidebarRightOpen, setSidebarRightOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [wallpaperModalOpen, setWallpaperModalOpen] = useState(false);

  const { isDark, toggleTheme, setAccentFromWallpaper } = useTheme();

  // Master Wallpaper Engine & Widgets state
  const [wallpaperConfig, setWallpaperConfig] = useState(readWallpaperConfig);

  const handleUpdateConfig = (newCfg) => {
    setWallpaperConfig((prev) => ({ ...prev, ...newCfg }));
  };

  useEffect(() => {
    localStorage.setItem('end4pc-wallpaper-config', JSON.stringify(wallpaperConfig));
  }, [wallpaperConfig]);

  // Initial theme extraction from default wallpaper
  useEffect(() => {
    setAccentFromWallpaper(resolveAssetUrl(wallpaperConfig.wallpaperUrl));
  }, [setAccentFromWallpaper, wallpaperConfig.wallpaperUrl]);

  // Ensure window is always interactive for widgets, bar, and modals
  useEffect(() => {
    window.electronAPI?.setIgnoreMouse(false);
  }, []);

  // Listen for global shortcut events from Electron
  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onToggleOverlay(() => {
      setOverlayOpen((prev) => !prev);
      setSidebarLeftOpen(false);
      setSidebarRightOpen(false);
      setWallpaperModalOpen(false);
    });

    window.electronAPI.onToggleSidebarLeft(() => {
      setSidebarLeftOpen((prev) => !prev);
      setOverlayOpen(false);
      setWallpaperModalOpen(false);
    });

    window.electronAPI.onToggleSidebarRight(() => {
      setSidebarRightOpen((prev) => !prev);
      setOverlayOpen(false);
      setWallpaperModalOpen(false);
    });

    window.electronAPI.onToggleSettings(() => {
      setWallpaperModalOpen((prev) => !prev);
    });

    return () => {
      window.electronAPI.removeAllListeners('toggle-overlay');
      window.electronAPI.removeAllListeners('toggle-sidebar-left');
      window.electronAPI.removeAllListeners('toggle-sidebar-right');
      window.electronAPI.removeAllListeners('toggle-settings');
    };
  }, []);

  // Keyboard shortcut fallback
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        setOverlayOpen((prev) => !prev);
      }
      if (e.metaKey && e.key === ',') {
        e.preventDefault();
        setWallpaperModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="shell-container">
      {/* ── 1. Live Wallpaper Background (Shaders / Images / Shapes) ── */}
      <WallpaperBackground
        mode={wallpaperConfig.mode}
        wallpaperUrl={wallpaperConfig.wallpaperUrl}
        shaderType={wallpaperConfig.shaderType}
        isDark={isDark}
        blur={wallpaperConfig.blur}
        dim={wallpaperConfig.dim}
        centeredShape={wallpaperConfig.centeredShape}
      />

      {/* ── 2. On-Desktop Live Widgets (Clocks, Visualizer, Weather, Stats) ── */}
      <DesktopWidgetsContainer
        clockStyle={wallpaperConfig.clockStyle}
        showVisualizer={wallpaperConfig.showVisualizer}
        showWeather={wallpaperConfig.showWeather}
        showSystem={wallpaperConfig.showSystem}
        onOpenSelector={() => setWallpaperModalOpen(true)}
      />

      {/* ── 3. Top Floating Status Bar ── */}
      <Bar
        onToggleSidebarLeft={() => setSidebarLeftOpen((p) => !p)}
        onToggleSidebarRight={() => setSidebarRightOpen((p) => !p)}
        onToggleOverlay={() => setOverlayOpen((p) => !p)}
        onOpenWallpaperSettings={() => setWallpaperModalOpen((p) => !p)}
      />

      {/* ── 4. Left Sidebar (Quick Settings, Calendar, 5-Day Forecast) ── */}
      <SidebarLeft
        isOpen={sidebarLeftOpen}
        onClose={() => setSidebarLeftOpen(false)}
      />

      {/* ── 5. Right Sidebar (Now Playing, Notes, System Monitor) ── */}
      <SidebarRight
        isOpen={sidebarRightOpen}
        onClose={() => setSidebarRightOpen(false)}
      />

      {/* ── 6. App Launcher / Spotlight Overlay ── */}
      <Overlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        onOpenSettings={() => {
          setOverlayOpen(false);
          setWallpaperModalOpen(true);
        }}
        onToggleTheme={toggleTheme}
      />

      {/* ── 7. Wallpaper Engine & Widgets Customizer Modal ── */}
      <WallpaperSelectorModal
        isOpen={wallpaperModalOpen}
        onClose={() => setWallpaperModalOpen(false)}
        wallpaperConfig={wallpaperConfig}
        onUpdateConfig={handleUpdateConfig}
        onExtractTheme={setAccentFromWallpaper}
      />
    </div>
  );
}

export default function App() {
  return (
    <MaterialThemeProvider>
      <ShellContent />
    </MaterialThemeProvider>
  );
}
