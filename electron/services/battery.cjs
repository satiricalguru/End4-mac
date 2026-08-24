const { exec } = require('child_process');

function runCommand(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (err, stdout) => {
      if (err) resolve('');
      else resolve(stdout.trim());
    });
  });
}

const batteryService = {
  async getBattery() {
    try {
      const pmset = await runCommand('pmset -g batt');
      const lines = pmset.split('\n');

      // Parse percentage
      const match = pmset.match(/(\d+)%/);
      const percentage = match ? parseInt(match[1]) : 100;

      // Parse charging status
      const isCharging = pmset.includes('AC Power') || pmset.includes('charging');
      const isCharged = pmset.includes('charged');
      const isOnBattery = pmset.includes('Battery Power');

      // Parse time remaining
      const timeMatch = pmset.match(/(\d+:\d+)\s+remaining/);
      const timeRemaining = timeMatch ? timeMatch[1] : null;

      // Determine icon
      let icon = 'battery_full';
      if (percentage <= 10) icon = 'battery_alert';
      else if (percentage <= 20) icon = 'battery_1_bar';
      else if (percentage <= 35) icon = 'battery_2_bar';
      else if (percentage <= 50) icon = 'battery_3_bar';
      else if (percentage <= 65) icon = 'battery_4_bar';
      else if (percentage <= 80) icon = 'battery_5_bar';
      else if (percentage <= 95) icon = 'battery_6_bar';

      if (isCharging) icon = 'battery_charging_full';

      return {
        percentage,
        isCharging,
        isCharged,
        isOnBattery,
        timeRemaining,
        icon,
      };
    } catch {
      return {
        percentage: 100,
        isCharging: false,
        isCharged: true,
        isOnBattery: false,
        timeRemaining: null,
        icon: 'battery_full',
      };
    }
  },
};

module.exports = { batteryService };
