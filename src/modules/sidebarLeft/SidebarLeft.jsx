import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio, useBrightness, useWeather, useNetwork } from '../../hooks/useSystemData';
import './SidebarLeft.css';

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEATHER_DESCRIPTIONS = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle',
  55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Rain showers',
  81: 'Rain showers', 82: 'Violent rain', 95: 'Thunderstorm',
  96: 'Thunderstorm + hail', 99: 'Heavy thunderstorm',
};

function CalendarWidget() {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();

  const { year, month, days } = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrevMonth = new Date(y, m, 0).getDate();

    const calDays = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      calDays.push({ day: daysInPrevMonth - i, otherMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      calDays.push({
        day: d,
        otherMonth: false,
        isToday: d === today.getDate() && m === today.getMonth() && y === today.getFullYear(),
      });
    }
    const remaining = 42 - calDays.length;
    for (let d = 1; d <= remaining; d++) {
      calDays.push({ day: d, otherMonth: true });
    }

    return { year: y, month: m, days: calDays };
  }, [viewDate]);

  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="calendar-widget">
      <div className="calendar-widget__header">
        <span className="calendar-widget__title">{monthName}</span>
        <div className="calendar-widget__nav">
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))}>
            <span className="icon" style={{ fontSize: 18 }}>chevron_left</span>
          </button>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))}>
            <span className="icon" style={{ fontSize: 18 }}>chevron_right</span>
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="calendar-grid__day-name">{d}</div>
        ))}
        {days.map((d, i) => (
          <div
            key={i}
            className={`calendar-grid__day ${d.isToday ? 'calendar-grid__day--today' : ''} ${d.otherMonth ? 'calendar-grid__day--other-month' : ''}`}
          >
            {d.day}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeatherWidget() {
  const { data: weather } = useWeather();

  if (!weather) return null;

  const weatherIcons = {
    0: 'clear_day', 1: 'partly_cloudy_day', 2: 'partly_cloudy_day',
    3: 'cloud', 45: 'foggy', 48: 'foggy', 51: 'rainy', 53: 'rainy',
    55: 'rainy', 61: 'rainy', 63: 'rainy', 65: 'rainy',
    71: 'weather_snowy', 73: 'weather_snowy', 75: 'weather_snowy',
    80: 'rainy', 81: 'rainy', 82: 'rainy',
    95: 'thunderstorm', 96: 'thunderstorm', 99: 'thunderstorm',
  };

  return (
    <div className="weather-widget">
      <div className="weather-widget__current">
        <span className="icon icon-xl" style={{ color: 'var(--md-primary)' }}>
          {weather.icon}
        </span>
        <span className="weather-widget__temp">{weather.temperature}°</span>
        <div className="weather-widget__details">
          <span className="weather-widget__detail">
            {WEATHER_DESCRIPTIONS[weather.weatherCode] || 'Unknown'}
          </span>
          <span className="weather-widget__detail">
            <span className="icon" style={{ fontSize: 14 }}>thermostat</span>
            Feels like {weather.feelsLike}°
          </span>
          <span className="weather-widget__detail">
            <span className="icon" style={{ fontSize: 14 }}>water_drop</span>
            {weather.humidity}%
          </span>
        </div>
      </div>
      {weather.daily && (
        <div className="weather-widget__forecast">
          {weather.daily.time?.slice(1, 5).map((date, i) => {
            const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
            const code = weather.daily.weather_code?.[i + 1] || 0;
            return (
              <div key={date} className="weather-forecast-day">
                <span>{dayName}</span>
                <span className="icon">{weatherIcons[code] || 'cloud'}</span>
                <div className="weather-forecast-day__temps">
                  <span className="weather-forecast-day__high">
                    {Math.round(weather.daily.temperature_2m_max?.[i + 1] || 0)}°
                  </span>
                  <span className="weather-forecast-day__low">
                    {Math.round(weather.daily.temperature_2m_min?.[i + 1] || 0)}°
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SidebarLeft({ isOpen, onClose }) {
  const { data: audio, setVolume, toggleMute } = useAudio();
  const { data: brightness, setBrightness } = useBrightness();
  const { data: network } = useNetwork();

  // Instant local slider states for 120fps zero-latency dragging
  const [localVolume, setLocalVolume] = useState(50);
  const [localBrightness, setLocalBrightness] = useState(80);
  const volumeDebounceRef = useRef(null);
  const brightnessDebounceRef = useRef(null);

  // Sync initial values from system
  useEffect(() => {
    if (audio?.volume !== undefined) setLocalVolume(audio.volume);
  }, [audio?.volume]);

  useEffect(() => {
    if (brightness?.brightness !== undefined) setLocalBrightness(brightness.brightness);
  }, [brightness?.brightness]);

  // Handle immediate volume drag
  const handleVolumeChange = (val) => {
    setLocalVolume(val);
    if (volumeDebounceRef.current) clearTimeout(volumeDebounceRef.current);
    volumeDebounceRef.current = setTimeout(() => {
      setVolume(val);
    }, 40);
  };

  // Handle immediate brightness drag
  const handleBrightnessChange = (val) => {
    setLocalBrightness(val);
    if (brightnessDebounceRef.current) clearTimeout(brightnessDebounceRef.current);
    brightnessDebounceRef.current = setTimeout(() => {
      setBrightness(val);
    }, 40);
  };

  const [toggles, setToggles] = useState({
    wifi: true,
    bluetooth: true,
    dnd: false,
    nightShift: true,
    airdrop: true,
    hotspot: false,
  });

  // Load real system toggle states
  useEffect(() => {
    if (window.electronAPI?.getToggleStates) {
      window.electronAPI.getToggleStates().then((st) => {
        if (st) setToggles((prev) => ({ ...prev, ...st }));
      });
    }
  }, [isOpen]);

  const handleToggle = async (key) => {
    const nextVal = !toggles[key];
    // Immediate optimistic update for instant feedback
    setToggles((prev) => ({ ...prev, [key]: nextVal }));

    if (window.electronAPI) {
      if (key === 'wifi' && window.electronAPI.toggleWifi) {
        await window.electronAPI.toggleWifi(nextVal);
      } else if (key === 'bluetooth' && window.electronAPI.toggleBluetooth) {
        await window.electronAPI.toggleBluetooth(nextVal);
      } else if (key === 'nightShift' && window.electronAPI.toggleDarkMode) {
        await window.electronAPI.toggleDarkMode();
      } else if (key === 'dnd' && window.electronAPI.toggleDnd) {
        await window.electronAPI.toggleDnd();
      }
    }
  };

  const toggleData = [
    { key: 'wifi', icon: 'wifi', label: 'Wi-Fi' },
    { key: 'bluetooth', icon: 'bluetooth', label: 'Bluetooth' },
    { key: 'dnd', icon: 'do_not_disturb_on', label: 'DND' },
    { key: 'nightShift', icon: 'nightlight', label: 'Night Shift' },
    { key: 'airdrop', icon: 'share', label: 'AirDrop' },
    { key: 'hotspot', icon: 'wifi_tethering', label: 'Hotspot' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="sidebar-left"
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 30,
              mass: 0.8,
            }}
          >
            {/* Quick Toggles Grid with Spring Animations */}
            <div className="quick-toggles">
              {toggleData.map(({ key, icon, label }) => {
                const isActive = toggles[key];
                return (
                  <motion.div
                    key={key}
                    className={`quick-toggle ${isActive ? 'quick-toggle--active' : ''}`}
                    onClick={() => handleToggle(key)}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <span className="icon quick-toggle__icon">{icon}</span>
                    <span className="quick-toggle__label">{label}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Brightness Slider with Real-time Gradient Fill */}
            <div className="slider-widget">
              <span
                className="icon"
                style={{ cursor: 'pointer' }}
                onClick={() => handleBrightnessChange(localBrightness > 50 ? 20 : 100)}
                title="Toggle Brightness"
              >
                brightness_medium
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={localBrightness}
                onChange={(e) => handleBrightnessChange(parseInt(e.target.value))}
                style={{
                  background: `linear-gradient(to right, var(--md-primary) 0%, var(--md-primary) ${localBrightness}%, var(--md-surface-container-highest) ${localBrightness}%, var(--md-surface-container-highest) 100%)`,
                }}
              />
              <span className="slider-widget__value">{localBrightness}%</span>
            </div>

            {/* Volume Slider with Real-time Gradient Fill & Mute Toggle */}
            <div className="slider-widget">
              <span
                className="icon"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  toggleMute();
                  setLocalVolume((v) => (v === 0 ? 50 : 0));
                }}
                title="Mute / Unmute"
              >
                {audio?.isMuted || localVolume === 0 ? 'volume_off' : audio?.icon || 'volume_up'}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={localVolume}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                style={{
                  background: `linear-gradient(to right, var(--md-primary) 0%, var(--md-primary) ${localVolume}%, var(--md-surface-container-highest) ${localVolume}%, var(--md-surface-container-highest) 100%)`,
                }}
              />
              <span className="slider-widget__value">{localVolume}%</span>
            </div>

            {/* Weather */}
            <WeatherWidget />

            {/* Calendar */}
            <CalendarWidget />

            {/* Network Info */}
            {network?.isConnected && (
              <div className="slider-widget" style={{ justifyContent: 'flex-start', gap: '12px' }}>
                <span className="icon" style={{ color: 'var(--md-primary)' }}>{network.icon}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ font: 'var(--md-label-large)', color: 'var(--md-on-surface)' }}>
                    {network.ssid}
                  </span>
                  <span style={{ font: 'var(--md-body-small)', color: 'var(--md-on-surface-variant)' }}>
                    Signal: {network.signalStrength}% {network.ip ? `· ${network.ip}` : ''}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
