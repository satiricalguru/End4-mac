const { exec } = require('child_process');

function runCommand(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (err, stdout) => {
      if (err) resolve('');
      else resolve(stdout.trim());
    });
  });
}

const networkService = {
  async getNetwork() {
    try {
      // Get Wi-Fi interface name (usually en0)
      const ifName = await runCommand(`networksetup -listallhardwareports | awk '/Wi-Fi/{getline; print $2}'`);
      const iface = ifName || 'en0';

      // Get Wi-Fi status
      const status = await runCommand(`networksetup -getairportpower ${iface}`);
      const isEnabled = status.includes('On');

      if (!isEnabled) {
        return {
          ssid: null,
          isConnected: false,
          isEnabled: false,
          signalStrength: 0,
          icon: 'wifi_off',
        };
      }

      // Get current SSID
      const ssid = await runCommand(`/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | awk '/ SSID/ {print substr($0, index($0, $2))}'`);

      // Get signal strength (RSSI)
      const rssiStr = await runCommand(`/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | awk '/ agrCtlRSSI/ {print $2}'`);
      const rssi = parseInt(rssiStr) || -100;

      // Convert RSSI to 0-100 scale
      const signalStrength = Math.max(0, Math.min(100, 2 * (rssi + 100)));

      const isConnected = !!ssid;

      let icon = 'wifi';
      if (!isConnected) icon = 'wifi_find';
      else if (signalStrength < 25) icon = 'wifi_1_bar';
      else if (signalStrength < 50) icon = 'wifi_2_bar';
      else if (signalStrength < 75) icon = 'signal_wifi_statusbar_not_connected';

      // Get IP address
      const ip = await runCommand(`ipconfig getifaddr ${iface}`);

      return {
        ssid: ssid || null,
        isConnected,
        isEnabled,
        signalStrength,
        rssi,
        ip: ip || null,
        icon,
      };
    } catch {
      return {
        ssid: null,
        isConnected: false,
        isEnabled: false,
        signalStrength: 0,
        icon: 'wifi_off',
      };
    }
  },
};

module.exports = { networkService };
