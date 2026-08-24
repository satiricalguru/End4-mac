import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to poll a function at a regular interval.
 * Returns the latest data and a refresh function.
 */
export function usePolling(fetchFn, intervalMs = 5000, enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (!enabled) return;

    refresh();
    intervalRef.current = setInterval(refresh, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh, intervalMs, enabled]);

  return { data, loading, error, refresh };
}

/**
 * Hook for battery status.
 */
export function useBattery() {
  const fetchBattery = useCallback(async () => {
    if (window.electronAPI?.getBattery) {
      return window.electronAPI.getBattery();
    }
    // Fallback for browser dev mode
    return {
      percentage: 85,
      isCharging: false,
      isCharged: false,
      isOnBattery: true,
      icon: 'battery_5_bar',
    };
  }, []);

  return usePolling(fetchBattery, 30000);
}

/**
 * Hook for audio/volume status.
 */
export function useAudio() {
  const fetchAudio = useCallback(async () => {
    if (window.electronAPI?.getAudio) {
      return window.electronAPI.getAudio();
    }
    return { volume: 72, isMuted: false, icon: 'volume_up' };
  }, []);

  const { data, loading, error, refresh } = usePolling(fetchAudio, 3000);

  const setVolume = useCallback(async (vol) => {
    if (window.electronAPI?.setVolume) {
      await window.electronAPI.setVolume(vol);
      refresh();
    }
  }, [refresh]);

  const toggleMute = useCallback(async () => {
    if (window.electronAPI?.toggleMute) {
      await window.electronAPI.toggleMute();
      refresh();
    }
  }, [refresh]);

  return { data, loading, error, refresh, setVolume, toggleMute };
}

/**
 * Hook for network/Wi-Fi status.
 */
export function useNetwork() {
  const fetchNetwork = useCallback(async () => {
    if (window.electronAPI?.getNetwork) {
      return window.electronAPI.getNetwork();
    }
    return {
      ssid: 'Demo Network',
      isConnected: true,
      isEnabled: true,
      signalStrength: 82,
      icon: 'wifi',
    };
  }, []);

  return usePolling(fetchNetwork, 10000);
}

/**
 * Hook for now-playing media.
 */
export function useMedia() {
  const fetchMedia = useCallback(async () => {
    if (window.electronAPI?.getMedia) {
      return window.electronAPI.getMedia();
    }
    return {
      isPlaying: true,
      isPaused: false,
      hasMedia: true,
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      duration: 202,
      position: 67,
    };
  }, []);

  const { data, loading, error, refresh } = usePolling(fetchMedia, 2000);

  const control = useCallback(async (action) => {
    if (window.electronAPI?.mediaControl) {
      await window.electronAPI.mediaControl(action);
      setTimeout(refresh, 300);
    }
  }, [refresh]);

  return { data, loading, error, refresh, control };
}

/**
 * Hook for brightness.
 */
export function useBrightness() {
  const fetchBrightness = useCallback(async () => {
    if (window.electronAPI?.getBrightness) {
      return window.electronAPI.getBrightness();
    }
    return { brightness: 80, isDarkMode: true };
  }, []);

  const { data, loading, error, refresh } = usePolling(fetchBrightness, 10000);

  const setBrightness = useCallback(async (val) => {
    if (window.electronAPI?.setBrightness) {
      await window.electronAPI.setBrightness(val);
      refresh();
    }
  }, [refresh]);

  return { data, loading, error, refresh, setBrightness };
}

/**
 * Hook for current date/time that updates every second.
 */
export function useDateTime() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return dateTime;
}

/**
 * Hook for weather data from Open-Meteo (free, no API key needed).
 */
export function useWeather(lat = 28.6139, lon = 77.2090) {
  const fetchWeather = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`
      );
      const data = await res.json();

      const weatherIcons = {
        0: 'clear_day', 1: 'partly_cloudy_day', 2: 'partly_cloudy_day',
        3: 'cloud', 45: 'foggy', 48: 'foggy',
        51: 'rainy', 53: 'rainy', 55: 'rainy',
        61: 'rainy', 63: 'rainy', 65: 'rainy',
        71: 'weather_snowy', 73: 'weather_snowy', 75: 'weather_snowy',
        80: 'rainy', 81: 'rainy', 82: 'rainy',
        95: 'thunderstorm', 96: 'thunderstorm', 99: 'thunderstorm',
      };

      return {
        temperature: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        weatherCode: data.current.weather_code,
        icon: weatherIcons[data.current.weather_code] || 'cloud',
        daily: data.daily,
      };
    } catch {
      return null;
    }
  }, [lat, lon]);

  return usePolling(fetchWeather, 600000); // Update every 10 minutes
}
