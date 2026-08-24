import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext({
  isDark: true,
  toggleTheme: () => {},
  accentColor: '#7dd3c0',
  setAccentColor: () => {},
});

export const useTheme = () => useContext(ThemeContext);

/**
 * Generates a Material 3-style tonal palette from a hex color.
 * Simplified version of HCT tonal palette generation.
 */
function hexToHSL(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateTonalPalette(hex) {
  const [h, s, ] = hexToHSL(hex);
  return {
    0: hslToHex(h, s, 0),
    10: hslToHex(h, s * 0.9, 10),
    20: hslToHex(h, s * 0.85, 20),
    25: hslToHex(h, s * 0.83, 25),
    30: hslToHex(h, s * 0.8, 30),
    35: hslToHex(h, s * 0.78, 35),
    40: hslToHex(h, s * 0.75, 40),
    50: hslToHex(h, s * 0.7, 50),
    60: hslToHex(h, s * 0.65, 60),
    70: hslToHex(h, s * 0.6, 70),
    80: hslToHex(h, s * 0.55, 80),
    90: hslToHex(h, s * 0.5, 90),
    95: hslToHex(h, s * 0.45, 95),
    99: hslToHex(h, s * 0.3, 99),
    100: '#ffffff',
  };
}

function generateMaterial3Scheme(sourceColor, isDark) {
  const primary = generateTonalPalette(sourceColor);
  const [h, s, ] = hexToHSL(sourceColor);
  const secondary = generateTonalPalette(hslToHex(h, s * 0.5, 50));
  const tertiary = generateTonalPalette(hslToHex((h + 60) % 360, s * 0.6, 50));
  const neutral = generateTonalPalette(hslToHex(h, 8, 50));
  const neutralVariant = generateTonalPalette(hslToHex(h, 14, 50));

  if (isDark) {
    return {
      '--md-primary': primary[80],
      '--md-on-primary': primary[20],
      '--md-primary-container': primary[30],
      '--md-on-primary-container': primary[90],
      '--md-secondary': secondary[80],
      '--md-on-secondary': secondary[20],
      '--md-secondary-container': secondary[30],
      '--md-on-secondary-container': secondary[90],
      '--md-tertiary': tertiary[80],
      '--md-on-tertiary': tertiary[20],
      '--md-tertiary-container': tertiary[30],
      '--md-on-tertiary-container': tertiary[90],
      '--md-surface': neutral[10],
      '--md-on-surface': neutral[90],
      '--md-surface-variant': neutralVariant[30],
      '--md-on-surface-variant': neutralVariant[80],
      '--md-surface-dim': neutral[10],
      '--md-surface-bright': neutral[25],
      '--md-surface-container-lowest': neutral[0],
      '--md-surface-container-low': neutral[10],
      '--md-surface-container': neutral[20],
      '--md-surface-container-high': neutral[25],
      '--md-surface-container-highest': neutral[30],
      '--md-outline': neutralVariant[60],
      '--md-outline-variant': neutralVariant[30],
      '--md-inverse-surface': neutral[90],
      '--md-inverse-on-surface': neutral[20],
      '--md-inverse-primary': primary[40],
    };
  } else {
    return {
      '--md-primary': primary[40],
      '--md-on-primary': '#ffffff',
      '--md-primary-container': primary[90],
      '--md-on-primary-container': primary[10],
      '--md-secondary': secondary[40],
      '--md-on-secondary': '#ffffff',
      '--md-secondary-container': secondary[90],
      '--md-on-secondary-container': secondary[10],
      '--md-tertiary': tertiary[40],
      '--md-on-tertiary': '#ffffff',
      '--md-tertiary-container': tertiary[90],
      '--md-on-tertiary-container': tertiary[10],
      '--md-surface': neutral[99],
      '--md-on-surface': neutral[10],
      '--md-surface-variant': neutralVariant[90],
      '--md-on-surface-variant': neutralVariant[30],
      '--md-surface-dim': neutral[90],
      '--md-surface-bright': neutral[99],
      '--md-surface-container-lowest': '#ffffff',
      '--md-surface-container-low': neutral[95],
      '--md-surface-container': neutral[90],
      '--md-surface-container-high': neutral[90],
      '--md-surface-container-highest': neutral[80],
      '--md-outline': neutralVariant[50],
      '--md-outline-variant': neutralVariant[80],
      '--md-inverse-surface': neutral[20],
      '--md-inverse-on-surface': neutral[95],
      '--md-inverse-primary': primary[80],
    };
  }
}

/**
 * Extracts dominant color from an image using a canvas.
 */
function extractDominantColor(imageSrc) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 50;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const data = ctx.getImageData(0, 0, size, size).data;
      let r = 0, g = 0, b = 0, count = 0;

      for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
        const pr = data[i], pg = data[i + 1], pb = data[i + 2];
        // Skip very dark and very light pixels
        const brightness = (pr + pg + pb) / 3;
        if (brightness > 30 && brightness < 230) {
          r += pr; g += pg; b += pb; count++;
        }
      }

      if (count === 0) {
        resolve('#7dd3c0');
        return;
      }

      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);

      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      resolve(hex);
    };
    img.onerror = () => resolve('#7dd3c0');
    img.src = imageSrc;
  });
}

export function MaterialThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const [accentColor, setAccentColor] = useState('#7dd3c0');

  // Apply scheme to CSS custom properties
  const applyScheme = useCallback((color, dark) => {
    const scheme = generateMaterial3Scheme(color, dark);
    const root = document.documentElement;

    Object.entries(scheme).forEach(([prop, value]) => {
      root.style.setProperty(prop, value);
    });

    // Update glass backgrounds based on dark/light
    if (dark) {
      root.style.setProperty('--glass-bg', 'rgba(14, 21, 19, 0.72)');
      root.style.setProperty('--glass-bg-heavy', 'rgba(14, 21, 19, 0.88)');
      root.style.setProperty('--glass-bg-light', 'rgba(14, 21, 19, 0.5)');
      root.style.setProperty('--glass-border', '1px solid rgba(255, 255, 255, 0.08)');
    } else {
      root.style.setProperty('--glass-bg', 'rgba(245, 251, 247, 0.78)');
      root.style.setProperty('--glass-bg-heavy', 'rgba(245, 251, 247, 0.92)');
      root.style.setProperty('--glass-bg-light', 'rgba(245, 251, 247, 0.55)');
      root.style.setProperty('--glass-border', '1px solid rgba(0, 0, 0, 0.06)');
    }
  }, []);

  useEffect(() => {
    applyScheme(accentColor, isDark);
  }, [accentColor, isDark, applyScheme]);

  // Listen for system dark mode changes
  useEffect(() => {
    if (window.electronAPI?.onDarkModeChanged) {
      window.electronAPI.onDarkModeChanged((dark) => {
        setIsDark(dark);
      });
    }

    // Try to detect initial dark mode
    if (window.electronAPI?.getDarkMode) {
      window.electronAPI.getDarkMode().then((dark) => setIsDark(dark));
    } else {
      // Fallback: use media query
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(mq.matches);
      const handler = (e) => setIsDark(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const setAccentFromWallpaper = useCallback(async (imageSrc) => {
    const color = await extractDominantColor(imageSrc);
    setAccentColor(color);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleTheme,
        accentColor,
        setAccentColor,
        setAccentFromWallpaper,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export default MaterialThemeProvider;
