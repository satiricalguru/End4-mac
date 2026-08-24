import React, { useCallback } from 'react';
import { usePolling } from '../../hooks/useSystemData';

function CircularMeter({ label, percentage, value, icon, color = 'var(--md-primary)' }) {
  const radius = 28;
  const stroke = 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
        <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            stroke="var(--md-surface-container-highest)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.6s ease' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="icon" style={{ fontSize: 16, color: 'var(--md-on-surface-variant)' }}>
            {icon}
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ font: 'var(--md-label-small)', fontWeight: 600, color: 'var(--md-on-surface)' }}>
          {percentage}%
        </div>
        <div style={{ font: 'var(--md-label-small)', color: 'var(--md-outline)', fontSize: 10 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export default function DesktopSystemWidget() {
  const fetchStats = useCallback(async () => {
    if (window.electronAPI) {
      const [cpu, mem] = await Promise.all([
        window.electronAPI.getCpuUsage(),
        window.electronAPI.getMemoryUsage(),
      ]);
      return { cpu, mem };
    }
    return {
      cpu: { usage: 22 },
      mem: { percentage: 58, usedGB: '9.3', totalGB: '16.0' },
    };
  }, []);

  const { data: stats } = usePolling(fetchStats, 4000);

  if (!stats) return null;

  return (
    <div
      style={{
        padding: '18px 22px',
        borderRadius: 'var(--md-shape-xl)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: 'var(--glass-border)',
        boxShadow: 'var(--md-elevation-2)',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
      }}
    >
      <CircularMeter
        label="CPU"
        percentage={Math.round(stats.cpu.usage)}
        icon="memory"
        color="var(--md-primary)"
      />
      <CircularMeter
        label="RAM"
        percentage={stats.mem.percentage}
        icon="storage"
        color="var(--md-tertiary)"
      />
    </div>
  );
}
