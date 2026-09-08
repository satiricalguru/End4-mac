const { commandExists, runAppleScript, runCommand } = require('./command.cjs');
const { getWifiInterface } = require('./network.cjs');

const DARK_MODE_READ_SCRIPT = 'tell application "System Events" to tell appearance preferences to get dark mode';
const DARK_MODE_TOGGLE_SCRIPT = 'tell application "System Events" to tell appearance preferences to set dark mode to not dark mode';

function operationResult(ok, supported, value, error = null) {
  return { ok, supported, value, error };
}

async function readWifiState() {
  const iface = await getWifiInterface();
  if (!iface) return operationResult(false, false, false, 'No Wi-Fi interface was found.');

  const result = await runCommand('/usr/sbin/networksetup', ['-getairportpower', iface]);
  if (!result.ok) return operationResult(false, false, false, result.error);
  return operationResult(true, true, /:\s*On\s*$/i.test(result.stdout), null);
}

async function readDarkMode() {
  const result = await runAppleScript(DARK_MODE_READ_SCRIPT);
  if (!result.ok) return operationResult(false, false, false, result.error);
  return operationResult(true, true, result.stdout === 'true', null);
}

async function readBluetoothState() {
  if (!(await commandExists('blueutil'))) {
    return operationResult(false, false, false, 'Bluetooth control requires the optional `blueutil` helper.');
  }

  const result = await runCommand('blueutil', ['--power']);
  if (!result.ok) return operationResult(false, true, false, result.error);
  return operationResult(true, true, result.stdout === '1', null);
}

const togglesService = {
  async toggleWifi(enable) {
    const iface = await getWifiInterface();
    if (!iface) return operationResult(false, false, false, 'No Wi-Fi interface was found.');

    const result = await runCommand('/usr/sbin/networksetup', [
      '-setairportpower',
      iface,
      enable ? 'on' : 'off',
    ]);
    if (!result.ok) return operationResult(false, true, !enable, result.error);
    return operationResult(true, true, Boolean(enable), null);
  },

  async toggleDarkMode() {
    const toggleResult = await runAppleScript(DARK_MODE_TOGGLE_SCRIPT);
    if (!toggleResult.ok) return operationResult(false, false, false, toggleResult.error);
    return readDarkMode();
  },

  async toggleBluetooth(enable) {
    if (!(await commandExists('blueutil'))) {
      return operationResult(false, false, !enable, 'Bluetooth control requires the optional `blueutil` helper.');
    }

    const result = await runCommand('blueutil', ['--power', enable ? '1' : '0']);
    if (!result.ok) return operationResult(false, true, !enable, result.error);
    return operationResult(true, true, Boolean(enable), null);
  },

  async toggleDnd() {
    return operationResult(
      false,
      false,
      false,
      'Focus mode has no supported public toggle API. Create an explicit macOS Shortcut before enabling this control.',
    );
  },

  async getToggleStates() {
    const [wifi, bluetooth, darkMode] = await Promise.all([
      readWifiState(),
      readBluetoothState(),
      readDarkMode(),
    ]);

    return {
      wifi: wifi.value,
      bluetooth: bluetooth.value,
      darkMode: darkMode.value,
      dnd: false,
      airdrop: false,
      hotspot: false,
      capabilities: {
        wifi: wifi.supported,
        bluetooth: bluetooth.supported,
        darkMode: darkMode.supported,
        dnd: false,
        airdrop: false,
        hotspot: false,
      },
      errors: {
        wifi: wifi.error,
        bluetooth: bluetooth.error,
        darkMode: darkMode.error,
        dnd: 'Focus status is unavailable through a supported public API.',
        airdrop: 'AirDrop control is unavailable through a supported public API.',
        hotspot: 'Personal Hotspot control is unavailable through a supported public API.',
      },
    };
  },
};

module.exports = { operationResult, togglesService };
