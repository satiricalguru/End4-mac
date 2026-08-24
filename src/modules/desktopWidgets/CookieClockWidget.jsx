import React from 'react';
import { useDateTime } from '../../hooks/useSystemData';
import { getScallopCookiePath } from '../wallpaperEngine/CenteredShape';

/**
 * Material 3 Expressive Scallop Cookie Analog Clock.
 * Recreates CookieClock.qml from end4-pC.
 */
export default function CookieClockWidget({
  size = 230,
  sides = 7,
  useSine = true,
  showDate = true,
  onClick,
}) {
  const dateTime = useDateTime();

  const hours = dateTime.getHours() % 12;
  const minutes = dateTime.getMinutes();
  const seconds = dateTime.getSeconds();
  const milliseconds = dateTime.getMilliseconds();

  // Smooth continuous angles
  const hourAngle = (hours + minutes / 60) * 30; // 360 / 12 = 30 deg/hr
  const minuteAngle = (minutes + seconds / 60) * 6; // 360 / 60 = 6 deg/min
  const secondAngle = (seconds + milliseconds / 1000) * 6;

  const baseRadius = size / 2.5;
  const depth = size * 0.055;
  const { path, size: svgSize } = getScallopCookiePath(sides, baseRadius, depth);

  const dateStr = dateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        filter: 'drop-shadow(0px 8px 24px rgba(0, 0, 0, 0.22))',
      }}
    >
      {/* ── Cookie Background ─────────────────────────── */}
      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        width={size}
        height={size}
        style={{ position: 'absolute', inset: 0 }}
      >
        <path
          d={path}
          fill="var(--md-primary-container)"
          stroke="var(--glass-border)"
          strokeWidth="1.5"
        />
      </svg>

      {/* ── Center Date Pill ──────────────────────────── */}
      {showDate && (
        <div
          style={{
            position: 'absolute',
            top: '32%',
            padding: '3px 10px',
            borderRadius: '9999px',
            background: 'color-mix(in srgb, var(--md-on-primary-container) 12%, transparent)',
            font: 'var(--md-label-small)',
            fontWeight: 600,
            color: 'var(--md-on-primary-container)',
            letterSpacing: '0.4px',
            zIndex: 2,
          }}
        >
          {dateStr}
        </div>
      )}

      {/* ── Clock Hands ───────────────────────────────── */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, zIndex: 3 }}
      >
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          {/* Hour Hand (Thick Rounded Pill) */}
          <g transform={`rotate(${hourAngle})`}>
            <rect
              x={-5}
              y={-size * 0.28}
              width={10}
              height={size * 0.32}
              rx={5}
              fill="var(--md-primary)"
            />
          </g>

          {/* Minute Hand (Slender Pill) */}
          <g transform={`rotate(${minuteAngle})`}>
            <rect
              x={-3.5}
              y={-size * 0.38}
              width={7}
              height={size * 0.42}
              rx={3.5}
              fill="var(--md-tertiary)"
            />
          </g>

          {/* Second Hand (Thin Needle + Dot) */}
          <g transform={`rotate(${secondAngle})`}>
            <line
              x1={0}
              y1={size * 0.08}
              x2={0}
              y2={-size * 0.42}
              stroke="var(--md-on-primary-container)"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <circle cx={0} cy={-size * 0.28} r={3.5} fill="var(--md-primary)" />
          </g>

          {/* Center Pin */}
          <circle cx={0} cy={0} r={6} fill="var(--md-on-primary-container)" />
          <circle cx={0} cy={0} r={2.5} fill="var(--md-primary-container)" />
        </g>
      </svg>
    </div>
  );
}
