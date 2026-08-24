const { exec } = require('child_process');

function runCommand(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (err, stdout) => {
      if (err) resolve('');
      else resolve(stdout.trim());
    });
  });
}

const togglesService = {
  async toggleWifi(enable) {
    try {
      const ifName = await runCommand(`networksetup -listallhardwareports | awk '/Wi-Fi/{getline; print $2}'`);
      const iface = ifName || 'en0';
      const state = enable ? 'on' : 'off';
      await runCommand(`networksetup -setairportpower ${iface} ${state}`);
      return true;
    } catch {
      return false;
    }
  },

  async toggleDarkMode() {
    try {
      await runCommand(`osascript -e 'tell application "System Events" to tell appearance preferences to set dark mode to not dark mode'`);
      const isDark = await runCommand(`osascript -e 'tell application "System Events" to tell appearance preferences to get dark mode'`);
      return isDark === 'true';
    } catch {
      return false;
    }
  },

  async toggleBluetooth(enable) {
    try {
      const state = enable ? '1' : '0';
      await runCommand(`blueutil --power ${state} 2>/dev/null || osascript -e 'tell application "System Events" to click (first menu bar item of menu bar 1 whose description contains "Bluetooth")' 2>/dev/null`);
      return true;
    } catch {
      return false;
    }
  },

  async toggleDnd() {
    try {
      // Toggle focus mode via shortcuts or notification center
      await runCommand(`shortcuts run "Do Not Disturb" 2>/dev/null || osascript -e 'tell application "System Events" to key code 0 using {control down, option down, command down}' 2>/dev/null`);
      return true;
    } catch {
      return false;
    }
  },

  async getToggleStates() {
    try {
      const ifName = await runCommand(`networksetup -listallhardwareports | awk '/Wi-Fi/{getline; print $2}'`);
      const wifiStatus = await runCommand(`networksetup -getairportpower ${ifName || 'en0'}`);
      const isWifiOn = wifiStatus.includes('On');

      const isDark = (await runCommand(`osascript -e 'tell application "System Events" to tell appearance preferences to get dark mode'`)) === 'true';

      return {
        wifi: isWifiOn,
        bluetooth: true,
        dnd: false,
        nightShift: isDark,
        airdrop: true,
        hotspot: false,
      };
    } catch {
      return {
        wifi: true,
        bluetooth: false,
        dnd: false,
        nightShift: false,
        airdrop: false,
        hotspot: false,
      };
    }
  },
};

module.exports = { togglesService };
