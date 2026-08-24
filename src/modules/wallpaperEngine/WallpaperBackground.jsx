import React from 'react';
import ShaderBackground from './ShaderBackground';
import CenteredShape from './CenteredShape';
import { resolveAssetUrl } from '../../utils/assetUrl';

export default function WallpaperBackground({
  mode = 'image', // 'image' | 'shader' | 'video'
  wallpaperUrl = '/assets/images/default_wallpaper.png',
  shaderType = 'aurora',
  isDark = true,
  blur = 0,
  dim = 0,
  centeredShape = {
    enabled: true,
    shape: 'Cookie7Sided',
    size: 420,
    color: 'var(--md-primary-container)',
    opacity: 0.65,
    rotate: true,
  },
}) {
  const resolvedWallpaperUrl = resolveAssetUrl(wallpaperUrl);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      {/* ── Mode 1: Image Wallpaper ───────────────────── */}
      {mode === 'image' && (
        <div
          style={{
            position: 'absolute',
            inset: -20,
            backgroundImage: `url(${resolvedWallpaperUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: `blur(${blur}px)`,
            transition: 'background-image 0.6s ease-in-out, filter 0.3s ease',
          }}
        />
      )}

      {/* ── Mode 2: Live Shader Wallpaper ─────────────── */}
      {mode === 'shader' && (
        <ShaderBackground type={shaderType} isDark={isDark} />
      )}

      {/* ── Mode 3: Video Wallpaper ───────────────────── */}
      {mode === 'video' && (
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: `blur(${blur}px)`,
          }}
          src={resolvedWallpaperUrl}
        />
      )}

      {/* ── Dim Overlay Layer ─────────────────────────── */}
      {dim > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: isDark ? `rgba(0, 0, 0, ${dim / 100})` : `rgba(255, 255, 255, ${dim / 100})`,
            transition: 'background-color 0.3s ease',
          }}
        />
      )}

      {/* ── Centered Material 3 Shape Cutout ───────────── */}
      {centeredShape?.enabled && (
        <CenteredShape
          shape={centeredShape.shape}
          size={centeredShape.size}
          color={centeredShape.color}
          opacity={centeredShape.opacity}
          rotate={centeredShape.rotate}
        />
      )}
    </div>
  );
}
