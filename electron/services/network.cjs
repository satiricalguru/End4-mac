const { runCommand } = require('./command.cjs');

function parseWifiInterface(output) {
  const lines = output.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    if (/Hardware Port:\s*(Wi-Fi|AirPort)/i.test(lines[index])) {
      return lines[index + 1]?.match(/Device:\s*(\S+)/i)?.[1] ?? null;
    }
  }
  return null;
}

function parseNetworkSummary(summary, isEnabled) {
  const ssidValue = summary.match(/^\s*SSID\s*:\s*(.+)$/im)?.[1]?.trim() ?? null;
  const ssid = !ssidValue || ssidValue === '<redacted>' ? null : ssidValue;
  const ip = summary.match(/^\s*\d+\s*:\s*((?:\d{1,3}\.){3}\d{1,3})\s*$/m)?.[1] ?? null;
  const linkActive = /LinkStatusActive\s*:\s*TRUE/i.test(summary);
  const hasBoundAddress = /State\s*:\s*BOUND/i.test(summary) || Boolean(ip);
  const isConnected = isEnabled && (linkActive || hasBoundAddress);

  return {
    ssid,
    isConnected,
    isEnabled,
    signalStrength: null,
    rssi: null,
    ip,
    icon: !isEnabled ? 'wifi_off' : isConnected ? 'wifi' : 'wifi_find',
    supported: true,
  };
}

async function getWifiInterface() {
  const result = await runCommand('/usr/sbin/networksetup', ['-listallhardwareports']);
  return result.ok ? parseWifiInterface(result.stdout) : null;
}

const networkService = {
  async getNetwork() {
    const iface = await getWifiInterface();
    if (!iface) {
      return {
        ...parseNetworkSummary('', false),
        supported: false,
        error: 'No Wi-Fi interface was found',
      };
    }

    const [powerResult, summaryResult] = await Promise.all([
      runCommand('/usr/sbin/networksetup', ['-getairportpower', iface]),
      runCommand('/usr/sbin/ipconfig', ['getsummary', iface]),
    ]);

    if (!powerResult.ok) {
      return {
        ...parseNetworkSummary('', false),
        supported: false,
        error: powerResult.error || 'Unable to read Wi-Fi power state',
      };
    }

    const isEnabled = /:\s*On\s*$/i.test(powerResult.stdout);
    const network = parseNetworkSummary(summaryResult.ok ? summaryResult.stdout : '', isEnabled);

    // Recent macOS versions redact SSID/BSSID unless Location Services access
    // has been granted. Connection and IP remain useful and truthful.
    if (!summaryResult.ok && isEnabled) {
      network.error = summaryResult.error || 'Wi-Fi details are unavailable';
    }

    return network;
  },
};

module.exports = {
  getWifiInterface,
  networkService,
  parseNetworkSummary,
  parseWifiInterface,
};
