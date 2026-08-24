/**
 * Synchronized Lyrics Service ported from services/LyricsService.qml
 * Queries LRCLIB (https://lrclib.net) for time-synced lyrics based on title & artist.
 */

export const LyricsService = {
  /**
   * Fetch synced lyrics from LRCLIB
   * @param {string} trackName
   * @param {string} artistName
   * @param {number} duration - seconds
   */
  async fetchLyrics(trackName, artistName, duration = 0) {
    if (!trackName || !artistName) return null;

    try {
      const q = new URLSearchParams({
        track_name: trackName,
        artist_name: artistName,
      });
      if (duration > 0) q.append('duration', Math.round(duration));

      const res = await fetch(`https://lrclib.net/api/get?${q.toString()}`);
      if (!res.ok) return null;

      const data = await res.json();

      if (data.syncedLyrics) {
        // Parse LRC format "[mm:ss.xx] line text"
        const lines = [];
        const rawLines = data.syncedLyrics.split('\n');

        for (const line of rawLines) {
          const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
          if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const ms = parseInt(match[3].padEnd(3, '0').slice(0, 3));
            const time = minutes * 60 + seconds + ms / 1000;
            const text = match[4].trim();
            lines.push({ time, text: text || '♪' });
          }
        }
        return { isSynced: true, lines };
      }

      if (data.plainLyrics) {
        const lines = data.plainLyrics
          .split('\n')
          .filter((l) => l.trim().length > 0)
          .map((text, i) => ({ time: i * 4, text }));
        return { isSynced: false, lines };
      }

      return null;
    } catch (err) {
      console.warn('Lyrics fetch error:', err);
      return null;
    }
  },
};
