const { exec } = require('child_process');

function runCommand(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (err, stdout) => {
      if (err) resolve('');
      else resolve(stdout.trim());
    });
  });
}

const mediaService = {
  async getNowPlaying() {
    try {
      // Use osascript to get now-playing info from Music, Spotify, or any media app
      const script = `
        tell application "System Events"
          set musicRunning to (name of processes) contains "Music"
          set spotifyRunning to (name of processes) contains "Spotify"
        end tell

        if spotifyRunning then
          tell application "Spotify"
            if player state is playing then
              set trackName to name of current track
              set artistName to artist of current track
              set albumName to album of current track
              set trackDuration to (duration of current track) / 1000
              set trackPosition to player position
              set artUrl to artwork url of current track
              return "PLAYING|" & trackName & "|" & artistName & "|" & albumName & "|" & trackDuration & "|" & trackPosition & "|" & artUrl
            else if player state is paused then
              set trackName to name of current track
              set artistName to artist of current track
              set albumName to album of current track
              set trackDuration to (duration of current track) / 1000
              set trackPosition to player position
              set artUrl to artwork url of current track
              return "PAUSED|" & trackName & "|" & artistName & "|" & albumName & "|" & trackDuration & "|" & trackPosition & "|" & artUrl
            else
              return "STOPPED"
            end if
          end tell
        else if musicRunning then
          tell application "Music"
            if player state is playing then
              set trackName to name of current track
              set artistName to artist of current track
              set albumName to album of current track
              set trackDuration to duration of current track
              set trackPosition to player position
              return "PLAYING|" & trackName & "|" & artistName & "|" & albumName & "|" & trackDuration & "|" & trackPosition & "|"
            else if player state is paused then
              set trackName to name of current track
              set artistName to artist of current track
              set albumName to album of current track
              set trackDuration to duration of current track
              set trackPosition to player position
              return "PAUSED|" & trackName & "|" & artistName & "|" & albumName & "|" & trackDuration & "|" & trackPosition & "|"
            else
              return "STOPPED"
            end if
          end tell
        else
          return "NONE"
        end if
      `;

      const result = await runCommand(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);

      if (result === 'NONE' || result === 'STOPPED' || !result) {
        return { isPlaying: false, isPaused: false, hasMedia: false };
      }

      const parts = result.split('|');
      const state = parts[0];

      return {
        isPlaying: state === 'PLAYING',
        isPaused: state === 'PAUSED',
        hasMedia: true,
        title: parts[1] || 'Unknown',
        artist: parts[2] || 'Unknown',
        album: parts[3] || '',
        duration: parseFloat(parts[4]) || 0,
        position: parseFloat(parts[5]) || 0,
        artworkUrl: parts[6] || null,
        source: result.includes('Spotify') ? 'spotify' : 'music',
      };
    } catch {
      return { isPlaying: false, isPaused: false, hasMedia: false };
    }
  },

  async control(action) {
    // action: 'play', 'pause', 'toggle', 'next', 'previous'
    try {
      const spotifyRunning = await runCommand(`pgrep -x Spotify`);
      const app = spotifyRunning ? 'Spotify' : 'Music';

      const commands = {
        play: `tell application "${app}" to play`,
        pause: `tell application "${app}" to pause`,
        toggle: `tell application "${app}" to playpause`,
        next: `tell application "${app}" to next track`,
        previous: `tell application "${app}" to previous track`,
      };

      if (commands[action]) {
        await runCommand(`osascript -e '${commands[action]}'`);
      }
    } catch {
      // Silently fail
    }
  },
};

module.exports = { mediaService };
