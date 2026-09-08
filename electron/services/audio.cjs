const { runAppleScript } = require('./command.cjs');

function audioIcon(volume, isMuted) {
  if (isMuted || volume === 0) return 'volume_off';
  if (volume < 33) return 'volume_mute';
  if (volume < 66) return 'volume_down';
  return 'volume_up';
}

function unavailableAudio(error) {
  return {
    volume: null,
    isMuted: false,
    icon: 'volume_off',
    supported: false,
    error,
  };
}

const audioService = {
  async getAudio() {
    const [volumeResult, mutedResult] = await Promise.all([
      runAppleScript('output volume of (get volume settings)'),
      runAppleScript('output muted of (get volume settings)'),
    ]);

    if (!volumeResult.ok || !mutedResult.ok) {
      return unavailableAudio(volumeResult.error || mutedResult.error || 'Audio status is unavailable.');
    }

    const volume = Number.parseInt(volumeResult.stdout, 10);
    const isMuted = mutedResult.stdout === 'true';
    if (!Number.isFinite(volume)) return unavailableAudio('Audio volume had an unexpected value.');

    return {
      volume,
      isMuted,
      icon: audioIcon(volume, isMuted),
      supported: true,
      error: null,
    };
  },

  async setVolume(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return unavailableAudio('Volume must be a number.');

    const clamped = Math.max(0, Math.min(100, Math.round(numericValue)));
    const result = await runAppleScript(`set volume output volume ${clamped}`);
    if (!result.ok) return unavailableAudio(result.error || 'Unable to set audio volume.');
    return this.getAudio();
  },

  async toggleMute() {
    const audio = await this.getAudio();
    if (!audio.supported) return audio;

    const result = await runAppleScript(`set volume output muted ${!audio.isMuted}`);
    if (!result.ok) return unavailableAudio(result.error || 'Unable to change mute state.');
    return this.getAudio();
  },
};

module.exports = { audioService, audioIcon };
