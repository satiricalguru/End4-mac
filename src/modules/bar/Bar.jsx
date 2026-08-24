import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattery, useAudio, useNetwork, useMedia, useDateTime, useWeather } from '../../hooks/useSystemData';
import './Bar.css';

const WORKSPACES = [1, 2, 3, 4, 5];

export default function Bar({
  onToggleSidebarLeft,
  onToggleSidebarRight,
  onToggleOverlay,
  onOpenWallpaperSettings,
}) {
  const [activeWorkspace, setActiveWorkspace] = useState(1);
  const dateTime = useDateTime();
  const { data: battery } = useBattery();
  const { data: audio, toggleMute } = useAudio();
  const { data: network } = useNetwork();
  const { data: media, control: mediaControl } = useMedia();
  const { data: weather } = useWeather();

  const formatTime = useCallback((dt) => {
    return dt.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  const formatDate = useCallback((dt) => {
    return dt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  return (
    <>
      <motion.div className="bar">
        {/* ── Left: Workspace + Sidebar Trigger ──────── */}
        <div className="bar__left">
          <div
            className="bar-widget"
            onClick={onToggleSidebarLeft}
            title="Quick Settings"
          >
            <span className="icon" style={{ fontSize: 20 }}>dashboard</span>
          </div>

          <div className="bar__divider" />

          <div className="workspaces">
            {WORKSPACES.map((ws) => (
              <div
                key={ws}
                className={`workspace-dot ${ws === activeWorkspace ? 'workspace-dot--active' : ''}`}
                onClick={() => setActiveWorkspace(ws)}
                title={`Desktop ${ws}`}
              />
            ))}
          </div>
        </div>

        {/* ── Center: Clock + Weather ────────────────── */}
        <div className="bar__center">
          <div className="bar-widget bar-widget--clock" onClick={onToggleOverlay}>
            {weather && (
              <>
                <span className="icon" style={{ fontSize: 18 }}>{weather.icon}</span>
                <span className="bar-widget__label">{weather.temperature}°</span>
                <div className="bar__divider" />
              </>
            )}
            <span className="clock__time">{formatTime(dateTime)}</span>
            <span className="clock__date">{formatDate(dateTime)}</span>
          </div>
        </div>

        {/* ── Right: System Tray ─────────────────────── */}
        <div className="bar__right">
          {/* Media (if playing) */}
          {media?.hasMedia && (
            <>
              <div
                className="bar-widget bar-widget--media"
                onClick={() => mediaControl('toggle')}
                title={media.title ? `${media.title} — ${media.artist}` : 'Media'}
              >
                <span className="icon" style={{ fontSize: 18 }}>
                  {media.isPlaying ? 'pause' : 'play_arrow'}
                </span>
                <div className={`media-marquee ${(media.title?.length || 0) > 15 ? 'scrolling' : ''}`}>
                  <span className="media-marquee__text bar-widget__label">
                    {media.title || 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="bar__divider" />
            </>
          )}

          {/* Volume */}
          <div
            className="bar-widget"
            onClick={toggleMute}
            title={`Volume: ${audio?.volume ?? 0}%`}
          >
            <span className="icon" style={{ fontSize: 18 }}>
              {audio?.icon || 'volume_up'}
            </span>
          </div>

          {/* Network */}
          <div
            className="bar-widget"
            title={network?.ssid ? `${network.ssid} (${network.signalStrength}%)` : 'No Wi-Fi'}
          >
            <span className="icon" style={{ fontSize: 18 }}>
              {network?.icon || 'wifi'}
            </span>
          </div>

          {/* Battery */}
          <div
            className="bar-widget bar-widget--battery"
            title={`Battery: ${battery?.percentage ?? '—'}%${battery?.isCharging ? ' (charging)' : ''}`}
          >
            <span className={`icon ${battery?.isCharging ? 'charging' : ''} ${(battery?.percentage ?? 100) <= 15 ? 'low' : ''}`} style={{ fontSize: 18 }}>
              {battery?.icon || 'battery_full'}
            </span>
            <span className="bar-widget__label">{battery?.percentage ?? '—'}%</span>
          </div>

          <div className="bar__divider" />

          {/* Notification Center */}
          <div
            className="bar-widget"
            onClick={onToggleSidebarRight}
            title="Notification Center (⌘ + N)"
          >
            <span className="icon" style={{ fontSize: 20 }}>notifications</span>
          </div>

          {/* Wallpaper Engine & Settings */}
          <div
            className="bar-widget"
            onClick={onOpenWallpaperSettings}
            title="Wallpaper Engine & Widgets (⌘ + ,)"
          >
            <span className="icon" style={{ fontSize: 20, color: 'var(--md-primary)' }}>tune</span>
          </div>
        </div>
      </motion.div>

      {/* Invisible sidebar trigger zones */}
      <div
        className="bar__sidebar-trigger bar__sidebar-trigger--left"
        onMouseEnter={onToggleSidebarLeft}
      />
      <div
        className="bar__sidebar-trigger bar__sidebar-trigger--right"
        onMouseEnter={onToggleSidebarRight}
      />
    </>
  );
}
