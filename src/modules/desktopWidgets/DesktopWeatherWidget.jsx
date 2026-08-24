import React from 'react';
import { useWeather } from '../../hooks/useSystemData';

export default function DesktopWeatherWidget() {
  const { data: weather } = useWeather();

  if (!weather) return null;

  return (
    <div
      style={{
        padding: '20px 24px',
        borderRadius: 'var(--md-shape-xl)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: 'var(--glass-border)',
        boxShadow: 'var(--md-elevation-2)',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        minWidth: 260,
      }}
    >
      <span
        className="icon"
        style={{
          fontSize: 48,
          color: 'var(--md-primary)',
          filter: 'drop-shadow(0px 4px 12px rgba(125, 211, 192, 0.4))',
        }}
      >
        {weather.icon}
      </span>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ font: 'var(--md-display-small)', fontWeight: 700, color: 'var(--md-on-surface)' }}>
            {weather.temperature}°
          </span>
          <span style={{ font: 'var(--md-body-small)', color: 'var(--md-on-surface-variant)' }}>
            Feels {weather.feelsLike}°
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 2 }}>
          <span style={{ font: 'var(--md-label-small)', color: 'var(--md-on-surface-variant)' }}>
            💧 {weather.humidity}%
          </span>
          <span style={{ font: 'var(--md-label-small)', color: 'var(--md-on-surface-variant)' }}>
            💨 {weather.windSpeed} km/h
          </span>
        </div>
      </div>
    </div>
  );
}
