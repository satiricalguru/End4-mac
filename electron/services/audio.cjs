const { exec } = require('child_process');

function runCommand(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (err, stdout) => {
      if (err) resolve('');
      else resolve(stdout.trim());
    });
  });
}

const audioService = {
  async getAudio() {
    try {
      const volume = await runCommand(`osascript -e 'output volume of (get volume settings)'`);
      const muted = await runCommand(`osascript -e 'output muted of (get volume settings)'`);

      const volumeLevel = parseInt(volume) || 0;
      const isMuted = muted === 'true';

      let icon = 'volume_up';
      if (isMuted || volumeLevel === 0) icon = 'volume_off';
      else if (volumeLevel < 33) icon = 'volume_mute';
      else if (volumeLevel < 66) icon = 'volume_down';

      return {
        volume: volumeLevel,
        isMuted,
        icon,
      };
    } catch {
      return { volume: 50, isMuted: false, icon: 'volume_up' };
    }
  },

  async setVolume(vol) {
    const clamped = Math.max(0, Math.min(100, Math.round(vol)));
    await runCommand(`osascript -e 'set volume output volume ${clamped}'`);
    return this.getAudio();
  },

  async toggleMute() {
    const audio = await this.getAudio();
    const newMuted = !audio.isMuted;
    await runCommand(`osascript -e 'set volume output muted ${newMuted}'`);
    return this.getAudio();
  },
};

module.exports = { audioService };
