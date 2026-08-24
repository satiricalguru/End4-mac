import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnlineWallpapersService } from '../../services/OnlineWallpapersService';
import { resolveAssetUrl } from '../../utils/assetUrl';
import './WallpaperSelectorModal.css';

const TABS = [
  { id: 'wallpapers', label: 'Library', icon: 'collections' },
  { id: 'online', label: 'Browse', icon: 'travel_explore' },
  { id: 'shaders', label: 'Live scenes', icon: 'auto_awesome' },
  { id: 'shapes', label: 'Shapes', icon: 'shapes' },
  { id: 'widgets', label: 'Widgets', icon: 'dashboard_customize' },
];

const SHADERS = [
  { id: 'aurora', name: 'Aurora', note: 'Slow, organic color drift', icon: 'lens_blur', className: 'scene-aurora' },
  { id: 'waves', name: 'Tidal', note: 'Layered fluid ribbons', icon: 'waves', className: 'scene-waves' },
  { id: 'stars', name: 'Deep space', note: 'A quiet field of stars', icon: 'auto_awesome', className: 'scene-stars' },
  { id: 'cyber', name: 'Night drive', note: 'Retro horizon grid', icon: 'grid_view', className: 'scene-cyber' },
];

const SHAPES = [
  { id: 'Cookie7Sided', name: 'Cookie 7', note: 'The end4 signature', icon: 'interests' },
  { id: 'Cookie9Sided', name: 'Cookie 9', note: 'Softened rhythm', icon: 'blur_on' },
  { id: 'Cookie12Sided', name: 'Cookie 12', note: 'More circular', icon: 'radio_button_unchecked' },
  { id: 'Flower', name: 'Flower', note: 'Expressive scallop', icon: 'filter_vintage' },
  { id: 'Clover4Leaf', name: 'Clover', note: 'Four rounded leaves', icon: 'spa' },
];

function Toggle({ checked, onChange }) {
  return <button className={`studio-toggle ${checked ? 'studio-toggle--on' : ''}`} onClick={() => onChange(!checked)} aria-pressed={checked}><span /></button>;
}

function WallpaperCard({ wallpaper, selected, onSelect }) {
  return (
    <button className={`wallpaper-card ${selected ? 'wallpaper-card--selected' : ''}`} onClick={onSelect}>
      <div className="wallpaper-card__preview" style={{ backgroundImage: `url(${resolveAssetUrl(wallpaper.thumb || wallpaper.full)})` }}>
        <span className="wallpaper-card__tag">{wallpaper.category || 'Preset'}</span>
        {selected && <span className="wallpaper-card__check icon icon-filled">check_circle</span>}
      </div>
      <div className="wallpaper-card__meta"><strong>{wallpaper.name || wallpaper.id}</strong><small>{wallpaper.resolution || 'Shell preset'}</small></div>
    </button>
  );
}

export default function WallpaperSelectorModal({ isOpen, onClose, wallpaperConfig, onUpdateConfig, onExtractTheme }) {
  const [tab, setTab] = useState('wallpapers');
  const [customUrl, setCustomUrl] = useState('');
  const [onlineQuery, setOnlineQuery] = useState('');
  const [onlineCategory, setOnlineCategory] = useState('general');
  const [onlineResults, setOnlineResults] = useState([]);
  const [loadingOnline, setLoadingOnline] = useState(false);
  const curatedPresets = OnlineWallpapersService.getCuratedPresets();

  const updateShape = (changes) => onUpdateConfig({ centeredShape: { ...wallpaperConfig.centeredShape, ...changes } });
  const selectImage = (url) => { onUpdateConfig({ mode: 'image', wallpaperUrl: url }); onExtractTheme?.(resolveAssetUrl(url)); };
  const selectShader = (id) => onUpdateConfig({ mode: 'shader', shaderType: id });

  const searchOnline = async () => {
    setLoadingOnline(true);
    setOnlineResults(await OnlineWallpapersService.searchWallhaven(onlineQuery, onlineCategory));
    setLoadingOnline(false);
  };

  useEffect(() => {
    if (isOpen && tab === 'online' && !onlineResults.length) searchOnline();
  }, [isOpen, tab]);

  const currentScene = useMemo(() => SHADERS.find((scene) => scene.id === wallpaperConfig.shaderType), [wallpaperConfig.shaderType]);

  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div className="studio-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="studio-modal" initial={{ scale: 0.96, y: 18, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.96, y: 18, opacity: 0 }} transition={{ type: 'spring', stiffness: 360, damping: 30 }} onClick={(event) => event.stopPropagation()}>
          <header className="studio-header">
            <div className="studio-title-group"><div className="studio-title-icon"><span className="icon icon-filled">wallpaper</span></div><div><div className="studio-kicker">Desktop studio</div><h2>Shape the atmosphere</h2><p>Wallpaper, widgets, and motion — one calm surface.</p></div></div>
            <button className="studio-close" onClick={onClose}><span className="icon">close</span></button>
          </header>

          <nav className="studio-tabs">{TABS.map((item) => <button key={item.id} className={tab === item.id ? 'studio-tab studio-tab--active' : 'studio-tab'} onClick={() => setTab(item.id)}><span className="icon icon-sm">{item.icon}</span>{item.label}</button>)}</nav>

          <main className="studio-content">
            {tab === 'wallpapers' && <div className="studio-view"><div className="studio-view-heading"><div><span className="studio-overline">Curated for end4-pC</span><h3>Pick a visual anchor</h3></div><span className="studio-count">{curatedPresets.length} presets</span></div><div className="wallpaper-grid">{curatedPresets.map((wallpaper) => <WallpaperCard key={wallpaper.id} wallpaper={wallpaper} selected={wallpaperConfig.mode === 'image' && wallpaperConfig.wallpaperUrl === wallpaper.full} onSelect={() => selectImage(wallpaper.full)} />)}</div><div className="custom-source"><span className="icon">link</span><input placeholder="Paste an image URL…" value={customUrl} onChange={(event) => setCustomUrl(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && customUrl && selectImage(customUrl)} /><button onClick={() => customUrl && selectImage(customUrl)}>Use URL</button></div></div>}

            {tab === 'online' && <div className="studio-view"><div className="studio-view-heading"><div><span className="studio-overline">Wallhaven explorer</span><h3>Find a new mood</h3></div><span className="studio-count">Public wallpapers</span></div><div className="browse-row"><div className="browse-input"><span className="icon">search</span><input placeholder="nature, anime, minimalist…" value={onlineQuery} onChange={(event) => setOnlineQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && searchOnline()} /></div><select value={onlineCategory} onChange={(event) => setOnlineCategory(event.target.value)}><option value="general">General</option><option value="anime">Anime</option><option value="people">People</option><option value="all">All</option></select><button className="studio-primary-button" onClick={searchOnline}><span className="icon icon-sm">{loadingOnline ? 'progress_activity' : 'search'}</span>{loadingOnline ? 'Searching' : 'Browse'}</button></div>{loadingOnline ? <div className="studio-empty"><span className="icon spin-icon">progress_activity</span><span>Finding good light…</span></div> : onlineResults.length ? <div className="wallpaper-grid">{onlineResults.map((wallpaper) => <WallpaperCard key={wallpaper.id} wallpaper={wallpaper} selected={wallpaperConfig.wallpaperUrl === wallpaper.full} onSelect={() => selectImage(wallpaper.full)} />)}</div> : <div className="studio-empty"><span className="icon">travel_explore</span><span>Search for a place, color, or feeling.</span></div>}</div>}

            {tab === 'shaders' && <div className="studio-view"><div className="studio-view-heading"><div><span className="studio-overline">Live wallpaper engine</span><h3>Let the background breathe</h3></div>{currentScene && <span className="studio-count">Active · {currentScene.name}</span>}</div><div className="scene-grid">{SHADERS.map((scene) => <button key={scene.id} className={`scene-card ${wallpaperConfig.mode === 'shader' && wallpaperConfig.shaderType === scene.id ? 'scene-card--selected' : ''}`} onClick={() => selectShader(scene.id)}><div className={`scene-card__preview ${scene.className}`}><span className="icon icon-filled">{scene.icon}</span></div><div><strong>{scene.name}</strong><small>{scene.note}</small></div>{wallpaperConfig.mode === 'shader' && wallpaperConfig.shaderType === scene.id && <span className="icon scene-card__check">check</span>}</button>)}</div><div className="studio-note"><span className="icon">tips_and_updates</span><span>Live scenes are rendered locally on the canvas, so they stay smooth without a network connection.</span></div></div>}

            {tab === 'shapes' && <div className="studio-view"><div className="studio-view-heading"><div><span className="studio-overline">Material 3 expressive</span><h3>Choose your center of gravity</h3></div><Toggle checked={wallpaperConfig.centeredShape.enabled} onChange={(enabled) => updateShape({ enabled })} /></div><div className="shape-grid">{SHAPES.map((shape) => <button key={shape.id} className={`shape-card ${wallpaperConfig.centeredShape.shape === shape.id ? 'shape-card--selected' : ''}`} onClick={() => updateShape({ shape: shape.id })}><div className="shape-card__visual"><span className={`shape-preview shape-preview--${shape.id.toLowerCase()}`} /></div><strong>{shape.name}</strong><small>{shape.note}</small></button>)}</div><div className="studio-controls"><label><span>Scale <b>{wallpaperConfig.centeredShape.size}px</b></span><input type="range" min="260" max="620" value={wallpaperConfig.centeredShape.size} onChange={(event) => updateShape({ size: Number(event.target.value) })} /></label><label><span>Presence <b>{Math.round(wallpaperConfig.centeredShape.opacity * 100)}%</b></span><input type="range" min="0" max="1" step="0.05" value={wallpaperConfig.centeredShape.opacity} onChange={(event) => updateShape({ opacity: Number(event.target.value) })} /></label><label className="studio-check-row"><span><b>Slow rotation</b><small>Subtle motion behind your work</small></span><Toggle checked={wallpaperConfig.centeredShape.rotate} onChange={(rotate) => updateShape({ rotate })} /></label></div></div>}

            {tab === 'widgets' && <div className="studio-view"><div className="studio-view-heading"><div><span className="studio-overline">Desktop widgets</span><h3>Keep the useful things close</h3></div><span className="studio-count">Saved automatically</span></div><div className="widget-options"><div className="widget-option widget-option--wide"><div className="widget-option__icon"><span className="icon">schedule</span></div><div><strong>Clock face</strong><small>Choose the hero widget on the desktop</small></div><select value={wallpaperConfig.clockStyle} onChange={(event) => onUpdateConfig({ clockStyle: event.target.value })}><option value="cookie">Cookie</option><option value="digital">Digital</option><option value="none">Hidden</option></select></div>{[{ key: 'showWeather', icon: 'partly_cloudy_day', name: 'Weather', note: 'Local conditions and forecast' }, { key: 'showVisualizer', icon: 'graphic_eq', name: 'Visualizer', note: 'A quiet pulse for playing audio' }, { key: 'showSystem', icon: 'memory', name: 'System meters', note: 'CPU and memory at a glance' }].map((widget) => <div className="widget-option" key={widget.key}><div className="widget-option__icon"><span className="icon">{widget.icon}</span></div><div><strong>{widget.name}</strong><small>{widget.note}</small></div><Toggle checked={wallpaperConfig[widget.key]} onChange={(value) => onUpdateConfig({ [widget.key]: value })} /></div>)}</div><div className="studio-controls"><label><span>Wallpaper dim <b>{wallpaperConfig.dim}%</b></span><input type="range" min="0" max="60" value={wallpaperConfig.dim} onChange={(event) => onUpdateConfig({ dim: Number(event.target.value) })} /></label><label><span>Background softness <b>{wallpaperConfig.blur}px</b></span><input type="range" min="0" max="18" value={wallpaperConfig.blur} onChange={(event) => onUpdateConfig({ blur: Number(event.target.value) })} /></label></div></div>}
          </main>

          <footer className="studio-footer"><span><span className="icon icon-sm">cloud_done</span> Configuration persists on this Mac</span><button className="studio-done-button" onClick={onClose}>Done <span className="icon icon-sm">check</span></button></footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
