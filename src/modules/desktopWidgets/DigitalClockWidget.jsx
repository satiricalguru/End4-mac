import React from 'react';
import { useDateTime, useWeather } from '../../hooks/useSystemData';

export default function DigitalClockWidget({ onClick }) {
  const dateTime = useDateTime();
  const { data: weather } = useWeather();

  const hours = dateTime.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }).split(' ')[0];
  const ampm = dateTime.toLocaleTimeString('en-US', { hour12: true }).slice(-2);
  const minutes = dateTime.getMinutes().toString().padStart(2, '0');
  const dateStr = dateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '24px 32px',
        borderRadius: 'var(--md-shape-xl)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: 'var(--glass-border)',
        boxShadow: 'var(--md-elevation-3)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span
          style={{
            font: 'var(--md-display-large)',
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: '-1.5px',
            color: 'var(--md-on-surface)',
          }}
        >
          {hours}:{minutes}
        </span>
        <span
          style={{
            font: 'var(--md-title-medium)',
            fontWeight: 600,
            color: 'var(--md-primary)',
            textTransform: 'uppercase',
          }}
        >
          {ampm}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
        <span
          style={{
            font: 'var(--md-title-small)',
            color: 'var(--md-on-surface-variant)',
          }}
        >
          {dateStr}
        </span>

        {weather && (
          <>
            <span style={{ color: 'var(--md-outline-variant)' }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="icon" style={{ fontSize: 18, color: 'var(--md-primary)' }}>
                {weather.icon}
              </span>
              <span style={{ font: 'var(--md-label-large)', color: 'var(--md-on-surface)' }}>
                {weather.temperature}°
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
