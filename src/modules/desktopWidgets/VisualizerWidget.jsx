import React, { useEffect, useRef } from 'react';
import { useMedia } from '../../hooks/useSystemData';

export default function VisualizerWidget({
  width = 340,
  height = 90,
  numBars = 28,
  color = 'var(--md-primary)',
}) {
  const { data: media } = useMedia();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const isPlaying = media?.isPlaying ?? false;
    let t = 0;

    // Heights simulation
    const bars = Array.from({ length: numBars }, () => Math.random() * 20 + 5);

    const render = () => {
      t += 0.08;
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / (numBars * 1.5);
      const gap = barWidth * 0.5;

      for (let i = 0; i < numBars; i++) {
        let targetHeight = 6;
        if (isPlaying) {
          // Dynamic animated wave simulating audio frequencies
          const freq1 = Math.sin(t * 1.8 + i * 0.45);
          const freq2 = Math.cos(t * 0.9 - i * 0.3);
          const freq3 = Math.sin(t * 2.7 + i * 0.8);
          targetHeight = Math.max(
            8,
            (Math.abs(freq1 * 0.5 + freq2 * 0.3 + freq3 * 0.2) * (height - 16))
          );
        }

        // Smooth interpolate
        bars[i] += (targetHeight - bars[i]) * 0.2;

        const x = i * (barWidth + gap) + gap;
        const y = height - bars[i];

        // Draw rounded bar
        ctx.fillStyle = isPlaying ? '#7dd3c0' : 'rgba(125, 211, 192, 0.3)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, bars[i], [barWidth / 2, barWidth / 2, 2, 2]);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [width, height, numBars, media?.isPlaying]);

  return (
    <div
      style={{
        padding: '16px 20px',
        borderRadius: 'var(--md-shape-xl)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: 'var(--glass-border)',
        boxShadow: 'var(--md-elevation-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="icon" style={{ fontSize: 18, color: 'var(--md-primary)' }}>
            graphic_eq
          </span>
          <span style={{ font: 'var(--md-label-medium)', color: 'var(--md-on-surface-variant)' }}>
            {media?.isPlaying ? 'Audio Reactive' : 'Visualizer (Idle)'}
          </span>
        </div>
        {media?.title && (
          <span
            style={{
              font: 'var(--md-label-small)',
              color: 'var(--md-on-surface)',
              maxWidth: 160,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {media.title}
          </span>
        )}
      </div>

      <canvas
        ref={canvasRef}
        style={{
          width,
          height,
          display: 'block',
        }}
      />
    </div>
  );
}
