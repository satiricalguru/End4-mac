const test = require('node:test');
const assert = require('node:assert/strict');

const { parsePmsetOutput } = require('../electron/services/battery.cjs');
const { parseBrightnessOutput } = require('../electron/services/brightness.cjs');
const { parseMediaOutput } = require('../electron/services/media.cjs');
const { parseNetworkSummary } = require('../electron/services/network.cjs');
const { parseMemoryPressure } = require('../electron/services/system.cjs');

test('a discharging battery is never reported as charging', () => {
  const output = `Now drawing from 'Battery Power'
 -InternalBattery-0 (id=22151267)\t76%; discharging; 4:05 remaining present: true`;

  assert.deepEqual(parsePmsetOutput(output), {
    supported: true,
    percentage: 76,
    isCharging: false,
    isCharged: false,
    isOnBattery: true,
    timeRemaining: '4:05',
    icon: 'battery_5_bar',
  });
});

test('a charging battery is reported from the explicit state field', () => {
  const output = `Now drawing from 'AC Power'
 -InternalBattery-0 (id=1)\t42%; charging; 1:15 remaining present: true`;

  const battery = parsePmsetOutput(output);
  assert.equal(battery.isCharging, true);
  assert.equal(battery.isOnBattery, false);
  assert.equal(battery.percentage, 42);
});

test('modern redacted Wi-Fi output still reports an active connection', () => {
  const summary = `<dictionary> {
  BSSID : <redacted>
  LinkStatusActive : TRUE
  SSID : <redacted>
  IPv4 : <array> {
    Addresses : <array> {
      0 : 172.20.10.2
    }
  }
}`;

  assert.deepEqual(parseNetworkSummary(summary, true), {
    ssid: null,
    isConnected: true,
    isEnabled: true,
    signalStrength: null,
    rssi: null,
    ip: '172.20.10.2',
    icon: 'wifi',
    supported: true,
  });
});

test('memory pressure counts reclaimable memory as available', () => {
  const result = parseMemoryPressure('System-wide memory free percentage: 71%', 16 * 1024 ** 3);

  assert.equal(result.percentage, 29);
  assert.equal(result.availablePercentage, 71);
  assert.equal(result.usedGB, '4.6');
  assert.equal(result.totalGB, '16.0');
});

test('brightness output is normalized only when the helper returns a real value', () => {
  assert.equal(parseBrightnessOutput('display 0: brightness 0.500000'), 50);
  assert.equal(parseBrightnessOutput('display 1: brightness 1.000000'), 100);
  assert.equal(parseBrightnessOutput(''), null);
});

test('media output carries its source explicitly and preserves pipes in metadata', () => {
  const media = parseMediaOutput(
    'spotify\tPLAYING\tA Song | Live\tAn Artist\tAn Album\t240\t12.5\thttps://example.test/art.jpg',
  );

  assert.equal(media.source, 'spotify');
  assert.equal(media.title, 'A Song | Live');
  assert.equal(media.isPlaying, true);
  assert.equal(media.position, 12.5);
});
