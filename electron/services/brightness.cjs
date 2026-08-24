const { exec } = require('child_process');

function runCommand(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (err, stdout) => {
      if (err) resolve('');
      else resolve(stdout.trim());
    });
  });
}

const brightnessService = {
  async getBrightness() {
    try {
      // Try using brightness command if available
      const result = await runCommand(`osascript -e 'tell application "System Events" to tell appearance preferences to get dark mode'`);
      const isDark = result === 'true';

      // AppleScript method for brightness (requires accessibility permissions)
      const brightnessResult = await runCommand(
        `osascript -e 'tell application "System Preferences" to quit' 2>/dev/null; ioreg -c AppleBacklightDisplay | grep -i brightness | tail -1 | sed 's/.*= //'`
      );

      let brightness = parseInt(brightnessResult);
      if (isNaN(brightness)) {
        // Fallback: try with corebrightnessdiag or default to 80
        brightness = 80;
      }

      // Normalize to 0-100 range
      if (brightness > 100) brightness = Math.round((brightness / 1024) * 100);

      return {
        brightness: Math.max(0, Math.min(100, brightness)),
        isDarkMode: isDark,
      };
    } catch {
      return { brightness: 80, isDarkMode: true };
    }
  },

  async setBrightness(val) {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    // This requires the 'brightness' CLI tool (brew install brightness)
    try {
      await runCommand(`brightness ${clamped / 100}`);
    } catch {
      // Fallback: try AppleScript
      await runCommand(
        `osascript -e 'tell application "System Preferences" to quit'`
      );
    }
    return this.getBrightness();
  },
};

module.exports = { brightnessService };
