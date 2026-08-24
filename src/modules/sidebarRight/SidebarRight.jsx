import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMedia, usePolling } from '../../hooks/useSystemData';
import { LyricsService } from '../../services/LyricsService';
import { AiService } from '../../services/AiService';
import './SidebarRight.css';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function NowPlayingCard() {
  const { data: media, control } = useMedia();
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsData, setLyricsData] = useState(null);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const lyricsContainerRef = useRef(null);

  // Fetch lyrics when track changes
  useEffect(() => {
    if (media?.hasMedia && media.title && media.artist) {
      LyricsService.fetchLyrics(media.title, media.artist, media.duration).then(setLyricsData);
    } else {
      setLyricsData(null);
    }
  }, [media?.title, media?.artist]);

  // Sync active lyrics line with playback position
  useEffect(() => {
    if (!lyricsData?.lines || !media?.position) return;
    const pos = media.position;
    let idx = -1;
    for (let i = 0; i < lyricsData.lines.length; i++) {
      if (lyricsData.lines[i].time <= pos) idx = i;
      else break;
    }
    if (idx !== activeLineIndex) {
      setActiveLineIndex(idx);
      // Auto-scroll active line into view
      if (lyricsContainerRef.current) {
        const activeEl = lyricsContainerRef.current.children[idx];
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [media?.position, lyricsData, activeLineIndex]);

  if (!media?.hasMedia) {
    return (
      <div className="now-playing-card">
        <div className="now-playing-card__bg" />
        <div className="now-playing-card__content" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
          <span className="icon" style={{ fontSize: 48, color: 'var(--md-on-surface-variant)', opacity: 0.5 }}>music_off</span>
          <span style={{ font: 'var(--md-body-medium)', color: 'var(--md-on-surface-variant)' }}>
            No media playing
          </span>
        </div>
      </div>
    );
  }

  const progress = media.duration > 0 ? (media.position / media.duration) * 100 : 0;

  return (
    <div className="now-playing-card">
      <div className="now-playing-card__bg" />
      <div className="now-playing-card__content">
        <div className="now-playing-card__info">
          <div className="now-playing-card__art">
            {media.artworkUrl ? (
              <img src={media.artworkUrl} alt="Album art" />
            ) : (
              <span className="icon">album</span>
            )}
          </div>
          <div className="now-playing-card__text">
            <div className="now-playing-card__title">{media.title}</div>
            <div className="now-playing-card__artist">{media.artist}</div>
          </div>
          <button
            onClick={() => setShowLyrics((p) => !p)}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--md-shape-full)',
              background: showLyrics ? 'var(--md-primary)' : 'var(--md-surface-container)',
              color: showLyrics ? 'var(--md-on-primary)' : 'var(--md-on-surface)',
              font: 'var(--md-label-small)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span className="icon" style={{ fontSize: 16 }}>lyrics</span>
            Lyrics
          </button>
        </div>

        {/* ── Synced Lyrics Overlay ────────────── */}
        {showLyrics && lyricsData?.lines ? (
          <div
            ref={lyricsContainerRef}
            style={{
              maxHeight: 120,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '8px 4px',
              textAlign: 'center',
            }}
          >
            {lyricsData.lines.map((line, i) => (
              <div
                key={i}
                style={{
                  font: 'var(--md-body-medium)',
                  fontWeight: i === activeLineIndex ? 700 : 400,
                  color: i === activeLineIndex ? 'var(--md-primary)' : 'var(--md-on-surface-variant)',
                  transform: i === activeLineIndex ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.3s ease',
                }}
              >
                {line.text}
              </div>
            ))}
          </div>
        ) : (
          <div className="now-playing-card__progress">
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-bar__times">
              <span>{formatTime(media.position)}</span>
              <span>{formatTime(media.duration)}</span>
            </div>
          </div>
        )}

        <div className="playback-controls">
          <button className="playback-btn" onClick={() => control('previous')}>
            <span className="icon">skip_previous</span>
          </button>
          <button className="playback-btn playback-btn--main" onClick={() => control('toggle')}>
            <span className="icon" style={{ fontSize: 28 }}>
              {media.isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button className="playback-btn" onClick={() => control('next')}>
            <span className="icon">skip_next</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function NotesWidget() {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('end4pc-notes');
      return saved ? JSON.parse(saved) : [
        { id: 1, text: 'Welcome to end4-pC Mac! ✨', done: false },
        { id: 2, text: 'Press ⌘ + Space for Launcher', done: false },
        { id: 3, text: 'Press ⌘ + , for Wallpaper Engine', done: false },
      ];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');

  useEffect(() => {
    localStorage.setItem('end4pc-notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (!input.trim()) return;
    setNotes((prev) => [...prev, { id: Date.now(), text: input.trim(), done: false }]);
    setInput('');
  };

  const toggleNote = (id) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, done: !n.done } : n)));
  };

  const deleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="notes-widget">
      <div className="notes-widget__header">
        <span className="notes-widget__title">
          <span className="icon" style={{ fontSize: 18 }}>checklist</span>
          Quick Notes & Tasks
        </span>
        <span style={{ font: 'var(--md-label-small)', color: 'var(--md-outline)' }}>
          {notes.filter((n) => !n.done).length} remaining
        </span>
      </div>
      <div className="notes-widget__input">
        <input
          type="text"
          placeholder="Add a note or todo item..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addNote()}
        />
        <button onClick={addNote}>
          <span className="icon" style={{ fontSize: 18 }}>add</span>
        </button>
      </div>
      <div className="notes-list">
        <AnimatePresence>
          {notes.map((note) => (
            <motion.div
              key={note.id}
              className={`note-item ${note.done ? 'note-item--done' : ''}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              layout
            >
              <span className="icon" onClick={() => toggleNote(note.id)}>
                {note.done ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span style={{ flex: 1 }}>{note.text}</span>
              <span className="icon" onClick={() => deleteNote(note.id)} style={{ fontSize: 16 }}>
                close
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AiChatWidget() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your Material 3 assistant. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const reply = await AiService.sendMessage({ prompt: userMsg });
    setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    setLoading(false);
  };

  return (
    <div className="notes-widget" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="notes-widget__header">
        <span className="notes-widget__title">
          <span className="icon" style={{ fontSize: 18, color: 'var(--md-primary)' }}>smart_toy</span>
          AI Assistant
        </span>
      </div>

      <div style={{ flex: 1, maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              padding: '8px 12px',
              borderRadius: 'var(--md-shape-lg)',
              background: m.role === 'user' ? 'var(--md-primary-container)' : 'var(--md-surface-container)',
              color: m.role === 'user' ? 'var(--md-on-primary-container)' : 'var(--md-on-surface)',
              font: 'var(--md-body-small)',
              maxWidth: '85%',
              whiteSpace: 'pre-wrap',
            }}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ font: 'var(--md-body-small)', color: 'var(--md-outline)', fontStyle: 'italic' }}>
            Thinking...
          </div>
        )}
      </div>

      <div className="notes-widget__input" style={{ marginTop: 'auto' }}>
        <input
          type="text"
          placeholder="Ask AI anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} disabled={loading}>
          <span className="icon" style={{ fontSize: 18 }}>send</span>
        </button>
      </div>
    </div>
  );
}

function SystemMonitor() {
  const fetchStats = useCallback(async () => {
    if (window.electronAPI) {
      const [cpu, mem] = await Promise.all([
        window.electronAPI.getCpuUsage(),
        window.electronAPI.getMemoryUsage(),
      ]);
      return { cpu, mem };
    }
    return {
      cpu: { usage: 23.5, cores: 10 },
      mem: { percentage: 62, usedGB: '9.9', totalGB: '16.0' },
    };
  }, []);

  const { data: stats } = usePolling(fetchStats, 5000);

  if (!stats) return null;

  return (
    <div className="system-monitor">
      <span className="system-monitor__title">
        <span className="icon" style={{ fontSize: 18, color: 'var(--md-primary)' }}>monitor_heart</span>
        System Resources
      </span>
      <div className="system-monitor__row">
        <span className="system-monitor__label">CPU</span>
        <div className="system-monitor__bar">
          <div
            className={`system-monitor__bar-fill ${stats.cpu.usage > 80 ? 'system-monitor__bar-fill--warning' : ''}`}
            style={{ width: `${stats.cpu.usage}%` }}
          />
        </div>
        <span className="system-monitor__value">{stats.cpu.usage}%</span>
      </div>
      <div className="system-monitor__row">
        <span className="system-monitor__label">RAM</span>
        <div className="system-monitor__bar">
          <div
            className={`system-monitor__bar-fill ${stats.mem.percentage > 85 ? 'system-monitor__bar-fill--warning' : ''}`}
            style={{ width: `${stats.mem.percentage}%` }}
          />
        </div>
        <span className="system-monitor__value">{stats.mem.usedGB}/{stats.mem.totalGB}G</span>
      </div>
    </div>
  );
}

export default function SidebarRight({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'ai'

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
            className="sidebar-right"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
          >
            {/* Now Playing with Synced Lyrics */}
            <NowPlayingCard />

            {/* Tab switch for Notes vs AI */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setActiveTab('notes')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--md-shape-full)',
                  background: activeTab === 'notes' ? 'var(--md-primary-container)' : 'var(--md-surface-container)',
                  color: activeTab === 'notes' ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                📝 Notes & Tasks
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--md-shape-full)',
                  background: activeTab === 'ai' ? 'var(--md-primary-container)' : 'var(--md-surface-container)',
                  color: activeTab === 'ai' ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                🤖 AI Assistant
              </button>
            </div>

            {activeTab === 'notes' ? <NotesWidget /> : <AiChatWidget />}

            {/* System Monitor */}
            <SystemMonitor />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
