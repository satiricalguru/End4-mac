import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Overlay.css';

const FALLBACK_APPS = [
  { name: 'Finder', path: '/System/Library/CoreServices/Finder.app', icon: 'folder' },
  { name: 'Safari', path: '/Applications/Safari.app', icon: 'language' },
  { name: 'Terminal', path: '/System/Applications/Utilities/Terminal.app', icon: 'terminal' },
  { name: 'System Settings', path: '/System/Applications/System Settings.app', icon: 'settings' },
  { name: 'Activity Monitor', path: '/System/Applications/Utilities/Activity Monitor.app', icon: 'monitor_heart' },
  { name: 'Notes', path: '/System/Applications/Notes.app', icon: 'sticky_note_2' },
];

const QUICK_ACTIONS = [
  { id: 'studio', name: 'Wallpaper studio', icon: 'wallpaper', desc: 'Tune scenes, shapes, and desktop widgets', action: 'settings', accent: 'primary' },
  { id: 'theme', name: 'Appearance', icon: 'palette', desc: 'Switch between light and dark shell modes', action: 'theme', accent: 'secondary' },
  { id: 'screenshot', name: 'Screenshot', icon: 'screenshot_monitor', desc: 'Open the macOS capture utility', action: 'screenshot', accent: 'tertiary' },
  { id: 'downloads', name: 'Open Downloads', icon: 'download', desc: 'Jump to your Downloads folder', action: 'downloads', accent: 'primary' },
  { id: 'activity', name: 'System Monitor', icon: 'monitor_heart', desc: 'Inspect CPU, memory, and processes', action: 'activity', accent: 'secondary' },
  { id: 'emoji', name: 'Emoji & Symbols', icon: 'emoji_emotions', desc: 'Open the macOS character viewer', action: 'emoji', accent: 'tertiary' },
];

const FILTERS = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'apps', label: 'Apps', icon: 'grid_view' },
  { id: 'actions', label: 'Actions', icon: 'bolt' },
];

function safeCalc(expr) {
  try {
    if (!/^[\d\s+\-*/().%^]+$/.test(expr)) return null;
    const result = new Function(`'use strict'; return (${expr.replace(/\^/g, '**')})`)();
    return typeof result === 'number' && Number.isFinite(result)
      ? Math.round(result * 1000000) / 1000000
      : null;
  } catch {
    return null;
  }
}

function AppGlyph({ app }) {
  const colors = ['#9ce8d6', '#c6b7ff', '#f4c990', '#9fc7ff', '#f0a8c9'];
  const color = colors[(app.name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className="launcher-app-glyph" style={{ '--glyph-color': color }}>
      <span className="icon">{app.icon || 'apps'}</span>
    </div>
  );
}

export default function Overlay({ isOpen, onClose, onOpenSettings, onToggleTheme }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [apps, setApps] = useState(FALLBACK_APPS);
  const [recentApps, setRecentApps] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = JSON.parse(localStorage.getItem('end4pc-recent-apps') || '[]');
      setRecentApps(Array.isArray(saved) ? saved : []);
    } catch {
      setRecentApps([]);
    }
    if (window.electronAPI?.getApplications) {
      window.electronAPI.getApplications().then((installed) => {
        if (installed?.length) setApps(installed);
      });
    }
    setQuery('');
    setFilter('all');
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen]);

  const parsedQuery = query.trim();
  const mode = parsedQuery.startsWith('>') ? 'actions'
    : parsedQuery.startsWith('=') ? 'calculator'
      : parsedQuery.startsWith('@') ? 'files' : filter;
  const searchTerm = parsedQuery.replace(/^[>=@]/, '').trim().toLowerCase();
  const calcResult = mode === 'calculator' ? safeCalc(searchTerm) : (!parsedQuery.includes(' ') ? safeCalc(parsedQuery) : null);

  const visibleActions = useMemo(() => {
    if (mode === 'apps' || mode === 'files' || mode === 'calculator') return [];
    return QUICK_ACTIONS.filter((action) =>
      !searchTerm || `${action.name} ${action.desc}`.toLowerCase().includes(searchTerm)
    );
  }, [mode, searchTerm]);

  const visibleApps = useMemo(() => {
    if (mode === 'actions' || mode === 'calculator') return [];
    const source = searchTerm ? apps : [...recentApps, ...apps];
    const unique = source.filter((app, index, all) => all.findIndex((candidate) => candidate.path === app.path) === index);
    return unique.filter((app) => !searchTerm || app.name.toLowerCase().includes(searchTerm)).slice(0, searchTerm ? 12 : 6);
  }, [apps, mode, recentApps, searchTerm]);

  const results = useMemo(() => {
    const items = [];
    if (calcResult !== null && calcResult !== undefined) items.push({ type: 'calc', value: calcResult });
    visibleActions.forEach((action) => items.push({ type: 'action', ...action }));
    visibleApps.forEach((app) => items.push({ type: 'app', ...app }));
    if (mode === 'files' && searchTerm) items.push({ type: 'file', name: `Open “${searchTerm}”`, path: searchTerm, icon: 'folder_open' });
    if (searchTerm && !items.length) items.push({ type: 'web-search', name: `Search the web for “${searchTerm}”`, icon: 'travel_explore', desc: 'Open in your default browser' });
    return items;
  }, [calcResult, mode, searchTerm, visibleActions, visibleApps]);

  const rememberApp = useCallback((app) => {
    const next = [app, ...recentApps.filter((recent) => recent.path !== app.path)].slice(0, 5);
    setRecentApps(next);
    localStorage.setItem('end4pc-recent-apps', JSON.stringify(next));
  }, [recentApps]);

  const handleSelect = useCallback((item) => {
    if (!item) return;
    if (item.type === 'app') {
      rememberApp(item);
      window.electronAPI?.launchApp(item.path);
    } else if (item.type === 'file') {
      window.electronAPI?.openPath(item.path.replace(/^~/, ''));
    } else if (item.type === 'calc') {
      navigator.clipboard?.writeText(String(item.value));
    } else if (item.type === 'web-search') {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`);
    } else if (item.type === 'action') {
      const appPaths = {
        screenshot: '/System/Applications/Utilities/Screenshot.app',
        activity: '/System/Applications/Utilities/Activity Monitor.app',
      };
      if (item.action === 'settings') onOpenSettings?.();
      if (item.action === 'theme') onToggleTheme?.();
      if (item.action === 'screenshot' || item.action === 'activity') window.electronAPI?.launchApp(appPaths[item.action]);
      if (item.action === 'downloads') window.electronAPI?.openPath('~/Downloads');
      if (item.action === 'emoji') window.electronAPI?.launchApp('/System/Applications/Utilities/Character Viewer.app');
    }
    onClose();
  }, [onClose, onOpenSettings, onToggleTheme, rememberApp, searchTerm]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') return onClose();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((index) => Math.min(index + 1, results.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  }, [handleSelect, onClose, results, selectedIndex]);

  useEffect(() => setSelectedIndex(0), [query, filter]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="launcher"
            initial={{ scale: 0.94, opacity: 0, y: -18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <div className="launcher__header">
              <div className="launcher__identity">
                <div className="launcher__mark"><span className="icon icon-filled">auto_awesome</span></div>
                <div><div className="launcher__eyebrow">end4-pC / command center</div><div className="launcher__title">What are you looking for?</div></div>
              </div>
              <div className="launcher__status"><span className="status-dot" /> ready</div>
            </div>

            <div className="launcher__search">
              <span className="icon">search</span>
              <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search apps, actions, or calculate…" autoFocus />
              <span className="launcher__search-hint">⌃ Space</span>
            </div>

            <div className="launcher__toolbar">
              <div className="launcher__filters">
                {FILTERS.map((item) => <button key={item.id} className={`launcher-filter ${filter === item.id ? 'launcher-filter--active' : ''}`} onClick={() => setFilter(item.id)}><span className="icon icon-sm">{item.icon}</span>{item.label}</button>)}
              </div>
              <div className="launcher__syntax"><kbd>&gt;</kbd> actions <kbd>=</kbd> math <kbd>@</kbd> files</div>
            </div>

            <div className="launcher__results">
              {!parsedQuery && filter === 'all' && <div className="launcher__welcome"><span>Fast paths</span><em>Recent apps appear first</em></div>}
              {calcResult !== null && calcResult !== undefined && <button className={`launcher-calc ${selectedIndex === 0 ? 'launcher-calc--selected' : ''}`} onClick={() => handleSelect(results[0])}><span className="launcher-calc__icon icon">calculate</span><span className="launcher-calc__formula">{searchTerm || parsedQuery}</span><span className="launcher-calc__value">= {calcResult}</span></button>}
              {visibleActions.length > 0 && <section className="launcher__section"><div className="launcher__section-title">{mode === 'actions' ? 'Command actions' : 'Quick actions'}</div><div className="launcher__action-grid">{visibleActions.map((action) => { const index = results.findIndex((result) => result.id === action.id); return <button key={action.id} className={`launcher-action launcher-action--${action.accent} ${index === selectedIndex ? 'launcher-action--selected' : ''}`} onClick={() => handleSelect({ type: 'action', ...action })} onMouseEnter={() => setSelectedIndex(index)}><span className="launcher-action__icon icon">{action.icon}</span><span className="launcher-action__copy"><strong>{action.name}</strong><small>{action.desc}</small></span><span className="icon launcher-action__arrow">arrow_outward</span></button>; })}</div></section>}
              {visibleApps.length > 0 && <section className="launcher__section"><div className="launcher__section-title">{searchTerm ? 'Applications' : 'Recent apps'}</div><div className="launcher__app-list">{visibleApps.map((app) => { const index = results.findIndex((result) => result.type === 'app' && result.path === app.path); return <button key={app.path} className={`launcher-item ${index === selectedIndex ? 'launcher-item--selected' : ''}`} onClick={() => handleSelect({ type: 'app', ...app })} onMouseEnter={() => setSelectedIndex(index)}><AppGlyph app={app} /><span className="launcher-item__text"><strong>{app.name}</strong><small>{app.path?.replace('/System/Applications', 'System') || 'Application'}</small></span><span className="icon launcher-item__arrow">arrow_forward</span></button>; })}</div></section>}
              {mode === 'files' && searchTerm && <button className={`launcher-item ${selectedIndex === results.length - 1 ? 'launcher-item--selected' : ''}`} onClick={() => handleSelect(results[results.length - 1])}><AppGlyph app={{ name: 'Folder', icon: 'folder_open' }} /><span className="launcher-item__text"><strong>Open “{searchTerm}”</strong><small>Open this path in Finder</small></span></button>}
              {!results.length && <div className="launcher__empty"><span className="icon">search_off</span><strong>No matches yet</strong><small>Try an app name or use &gt; for actions</small></div>}
            </div>

            <div className="launcher__footer"><span><span className="icon icon-sm">keyboard</span> Keyboard-first</span><div><kbd>↑</kbd><kbd>↓</kbd> navigate <kbd>↵</kbd> open <kbd>esc</kbd> close</div></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
