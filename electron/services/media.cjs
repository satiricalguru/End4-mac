const { runAppleScript } = require('./command.cjs');

function emptyMedia(supported = true, error = null) {
  return {
    isPlaying: false,
    isPaused: false,
    hasMedia: false,
    supported,
    error,
  };
}

function parseMediaOutput(output) {
  if (!output || output === 'NONE' || output === 'STOPPED') return emptyMedia();

  const parts = output.split('\t');
  const [source, state, title, artist, album, duration, position, artworkUrl] = parts;
  if (!source || !state || !title) return emptyMedia(false, 'Unexpected media metadata format.');

  return {
    isPlaying: state === 'PLAYING',
    isPaused: state === 'PAUSED',
    hasMedia: state === 'PLAYING' || state === 'PAUSED',
    supported: true,
    error: null,
    title: title || 'Unknown',
    artist: artist || 'Unknown',
    album: album || '',
    duration: Number.parseFloat(duration) || 0,
    position: Number.parseFloat(position) || 0,
    artworkUrl: artworkUrl || null,
    source,
  };
}

const NOW_PLAYING_SCRIPT = `
  tell application "System Events"
    set musicRunning to (name of processes) contains "Music"
    set spotifyRunning to (name of processes) contains "Spotify"
  end tell
  set fieldSeparator to ASCII character 9

  if spotifyRunning then
    tell application "Spotify"
      if player state is playing or player state is paused then
        set stateName to "PAUSED"
        if player state is playing then set stateName to "PLAYING"
        set currentItem to current track
        return "spotify" & fieldSeparator & stateName & fieldSeparator & (name of currentItem) & fieldSeparator & (artist of currentItem) & fieldSeparator & (album of currentItem) & fieldSeparator & ((duration of currentItem) / 1000) & fieldSeparator & player position & fieldSeparator & (artwork url of currentItem)
      end if
    end tell
  end if

  if musicRunning then
    tell application "Music"
      if player state is playing or player state is paused then
        set stateName to "PAUSED"
        if player state is playing then set stateName to "PLAYING"
        set currentItem to current track
        return "music" & fieldSeparator & stateName & fieldSeparator & (name of currentItem) & fieldSeparator & (artist of currentItem) & fieldSeparator & (album of currentItem) & fieldSeparator & (duration of currentItem) & fieldSeparator & player position & fieldSeparator
      end if
    end tell
  end if

  return "NONE"
`;

const mediaService = {
  async getNowPlaying() {
    const result = await runAppleScript(NOW_PLAYING_SCRIPT, [], { timeout: 3500 });
    if (!result.ok) return emptyMedia(false, result.error || 'Media automation is unavailable.');
    return parseMediaOutput(result.stdout);
  },

  async control(action) {
    const commands = {
      play: 'play',
      pause: 'pause',
      toggle: 'playpause',
      next: 'next track',
      previous: 'previous track',
    };
    if (!commands[action]) return { ok: false, error: 'Unknown media action.' };

    const media = await this.getNowPlaying();
    if (!media.hasMedia || !['spotify', 'music'].includes(media.source)) {
      return { ok: false, error: media.error || 'No controllable media is active.' };
    }

    const appName = media.source === 'spotify' ? 'Spotify' : 'Music';
    const result = await runAppleScript(`tell application "${appName}" to ${commands[action]}`);
    return { ok: result.ok, error: result.error };
  },
};

module.exports = { mediaService, parseMediaOutput };
