import React from 'react';
import CookieClockWidget from './CookieClockWidget';
import DigitalClockWidget from './DigitalClockWidget';
import VisualizerWidget from './VisualizerWidget';
import DesktopWeatherWidget from './DesktopWeatherWidget';
import DesktopSystemWidget from './DesktopSystemWidget';

export default function DesktopWidgetsContainer({
  clockStyle = 'cookie', // 'cookie' | 'digital' | 'none'
  showVisualizer = true,
  showWeather = true,
  showSystem = true,
  onOpenSelector,
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 2,
        padding: '64px 36px 36px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Top Area: Clock & Weather ─────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pointerEvents: 'auto',
        }}
      >
        {clockStyle === 'cookie' && (
          <CookieClockWidget size={240} sides={7} onClick={onOpenSelector} />
        )}
        {clockStyle === 'digital' && (
          <DigitalClockWidget onClick={onOpenSelector} />
        )}

        {showWeather && (
          <div style={{ pointerEvents: 'auto' }}>
            <DesktopWeatherWidget />
          </div>
        )}
      </div>

      {/* ── Bottom Area: Visualizer & System Meters ──── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          pointerEvents: 'auto',
        }}
      >
        {showVisualizer && (
          <div style={{ pointerEvents: 'auto' }}>
            <VisualizerWidget width={320} height={80} />
          </div>
        )}

        {showSystem && (
          <div style={{ pointerEvents: 'auto' }}>
            <DesktopSystemWidget />
          </div>
        )}
      </div>
    </div>
  );
}
