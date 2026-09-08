const { runCommand } = require('./command.cjs');

function batteryIcon(percentage, isCharging) {
  if (isCharging) return 'battery_charging_full';
  if (percentage <= 10) return 'battery_alert';
  if (percentage <= 20) return 'battery_1_bar';
  if (percentage <= 35) return 'battery_2_bar';
  if (percentage <= 50) return 'battery_3_bar';
  if (percentage <= 65) return 'battery_4_bar';
  if (percentage <= 80) return 'battery_5_bar';
  if (percentage <= 95) return 'battery_6_bar';
  return 'battery_full';
}

function parsePmsetOutput(pmset) {
  const percentageMatch = pmset.match(/(\d+)%/);
  if (!percentageMatch) {
    return {
      supported: false,
      percentage: null,
      isCharging: false,
      isCharged: false,
      isOnBattery: false,
      timeRemaining: null,
      icon: 'battery_unknown',
    };
  }

  const percentage = Number.parseInt(percentageMatch[1], 10);
  const state = pmset.match(/\d+%;\s*([^;]+);/)?.[1]?.trim().toLowerCase() ?? '';
  const isCharging = state === 'charging' || state === 'finishing charge';
  const isCharged = state === 'charged';
  const isOnBattery = /drawing from ['"]Battery Power['"]/i.test(pmset);
  const timeRemaining = pmset.match(/(\d+:\d+)\s+remaining/i)?.[1] ?? null;

  return {
    supported: true,
    percentage,
    isCharging,
    isCharged,
    isOnBattery,
    timeRemaining,
    icon: batteryIcon(percentage, isCharging),
  };
}

const batteryService = {
  async getBattery() {
    const result = await runCommand('/usr/bin/pmset', ['-g', 'batt']);
    if (!result.ok) {
      return {
        ...parsePmsetOutput(''),
        error: result.error || 'Unable to read battery status',
      };
    }

    return parsePmsetOutput(result.stdout);
  },
};

module.exports = { batteryService, parsePmsetOutput };
