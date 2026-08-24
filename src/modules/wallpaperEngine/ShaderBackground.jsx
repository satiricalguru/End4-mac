import React, { useEffect, useRef } from 'react';

/**
 * Animated Canvas Shaders for live wallpaper background.
 * Supports:
 * 1. 'aurora' - Soft fluid organic aurora mesh gradients
 * 2. 'waves' - Flowing multi-layered sine wave ribbons
 * 3. 'stars' - Deep space cosmic starfield with glowing nebulas
 * 4. 'cyber' - Cyberpunk neon retro-grid landscape
 */
export default function ShaderBackground({ type = 'aurora', isDark = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let t = 0;

    // Stars particle data for starfield
    const numStars = 180;
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      alpha: Math.random(),
    }));

    const render = () => {
      t += 0.008;

      if (type === 'aurora') {
        // Multi-point dynamic radial gradients
        ctx.fillStyle = isDark ? '#080d0b' : '#f0f7f4';
        ctx.fillRect(0, 0, width, height);

        const p1x = width * (0.3 + 0.25 * Math.sin(t * 0.7));
        const p1y = height * (0.3 + 0.2 * Math.cos(t * 0.5));
        const g1 = ctx.createRadialGradient(p1x, p1y, 10, p1x, p1y, width * 0.7);
        g1.addColorStop(0, isDark ? 'rgba(0, 180, 140, 0.45)' : 'rgba(0, 180, 140, 0.25)');
        g1.addColorStop(1, 'transparent');
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, width, height);

        const p2x = width * (0.7 + 0.2 * Math.cos(t * 0.6));
        const p2y = height * (0.6 + 0.25 * Math.sin(t * 0.8));
        const g2 = ctx.createRadialGradient(p2x, p2y, 10, p2x, p2y, width * 0.65);
        g2.addColorStop(0, isDark ? 'rgba(90, 80, 220, 0.4)' : 'rgba(120, 110, 240, 0.2)');
        g2.addColorStop(1, 'transparent');
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, width, height);

        const p3x = width * (0.5 + 0.3 * Math.sin(t * 0.4));
        const p3y = height * (0.8 + 0.15 * Math.cos(t * 0.9));
        const g3 = ctx.createRadialGradient(p3x, p3y, 10, p3x, p3y, width * 0.5);
        g3.addColorStop(0, isDark ? 'rgba(230, 90, 150, 0.3)' : 'rgba(240, 120, 180, 0.18)');
        g3.addColorStop(1, 'transparent');
        ctx.fillStyle = g3;
        ctx.fillRect(0, 0, width, height);
      } else if (type === 'waves') {
        ctx.fillStyle = isDark ? '#090e11' : '#eaf2f8';
        ctx.fillRect(0, 0, width, height);

        // Draw flowing smooth wave ribbons
        const layers = 5;
        for (let l = 0; l < layers; l++) {
          ctx.beginPath();
          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += 15) {
            const y =
              height * 0.55 +
              Math.sin(x * 0.003 + t + l * 0.8) * 70 +
              Math.cos(x * 0.006 - t * 0.5 + l) * 40 +
              l * 35;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.closePath();

          const waveGrad = ctx.createLinearGradient(0, height * 0.4, width, height);
          if (isDark) {
            waveGrad.addColorStop(0, `hsla(${160 + l * 25}, 70%, 45%, ${0.25 - l * 0.03})`);
            waveGrad.addColorStop(1, `hsla(${220 + l * 20}, 75%, 35%, ${0.3 - l * 0.04})`);
          } else {
            waveGrad.addColorStop(0, `hsla(${160 + l * 25}, 65%, 75%, ${0.3 - l * 0.04})`);
            waveGrad.addColorStop(1, `hsla(${220 + l * 20}, 70%, 70%, ${0.35 - l * 0.05})`);
          }
          ctx.fillStyle = waveGrad;
          ctx.fill();
        }
      } else if (type === 'stars') {
        ctx.fillStyle = isDark ? '#05070a' : '#141824';
        ctx.fillRect(0, 0, width, height);

        // Nebulae
        const g = ctx.createRadialGradient(width * 0.5, height * 0.5, 50, width * 0.5, height * 0.5, width * 0.6);
        g.addColorStop(0, 'rgba(70, 30, 110, 0.4)');
        g.addColorStop(0.6, 'rgba(20, 50, 90, 0.25)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);

        // Stars
        stars.forEach((s) => {
          s.y += s.speed;
          if (s.y > height) {
            s.y = 0;
            s.x = Math.random() * width;
          }
          s.alpha = 0.4 + 0.6 * Math.sin(t * 2 + s.x);

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, s.alpha)})`;
          ctx.fill();
        });
      } else if (type === 'cyber') {
        ctx.fillStyle = isDark ? '#0a0512' : '#f4edf9';
        ctx.fillRect(0, 0, width, height);

        // Horizon glowing sun
        const sunY = height * 0.48;
        const sunRadius = Math.min(width, height) * 0.22;
        const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
        sunGrad.addColorStop(0, '#ff3366');
        sunGrad.addColorStop(0.7, '#ffaa00');
        sunGrad.addColorStop(1, '#ffe600');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(width * 0.5, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // Perspective grid lines
        ctx.strokeStyle = isDark ? 'rgba(0, 240, 255, 0.35)' : 'rgba(160, 60, 200, 0.3)';
        ctx.lineWidth = 1.5;

        // Horizontal grid lines
        for (let i = 1; i <= 15; i++) {
          const y = sunY + Math.pow(i / 15, 2.2) * (height - sunY);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Vanishing rays
        for (let x = -width * 0.5; x <= width * 1.5; x += width * 0.1) {
          ctx.beginPath();
          ctx.moveTo(width * 0.5, sunY);
          ctx.lineTo(x + Math.sin(t * 0.5) * 40, height);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [type, isDark]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
