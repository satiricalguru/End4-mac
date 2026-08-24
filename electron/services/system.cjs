const { exec } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

function runCommand(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (err, stdout) => {
      if (err) resolve('');
      else resolve(stdout.trim());
    });
  });
}

const systemService = {
  async getSystemInfo() {
    try {
      const hostname = os.hostname();
      const platform = os.platform();
      const arch = os.arch();
      const uptime = os.uptime();

      const macVersion = await runCommand('sw_vers -productVersion');
      const macName = await runCommand('sw_vers -productName');
      const chipInfo = await runCommand('sysctl -n machdep.cpu.brand_string');

      return {
        hostname,
        platform,
        arch,
        uptime,
        macVersion,
        macName,
        chip: chipInfo,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
      };
    } catch {
      return {
        hostname: os.hostname(),
        platform: 'darwin',
        arch: os.arch(),
        uptime: os.uptime(),
      };
    }
  },

  async getCpuUsage() {
    try {
      const result = await runCommand(
        `ps -A -o %cpu | awk '{s+=$1} END {print s}'`
      );
      const cpuCount = os.cpus().length;
      const totalUsage = parseFloat(result) || 0;
      // Normalize to per-CPU percentage
      const normalized = Math.min(100, totalUsage / cpuCount);

      return {
        usage: Math.round(normalized * 10) / 10,
        cores: cpuCount,
        model: os.cpus()[0]?.model || 'Unknown',
      };
    } catch {
      return { usage: 0, cores: os.cpus().length };
    }
  },

  async getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percentage = Math.round((used / total) * 100);

    return {
      total,
      free,
      used,
      percentage,
      totalGB: (total / 1073741824).toFixed(1),
      usedGB: (used / 1073741824).toFixed(1),
      freeGB: (free / 1073741824).toFixed(1),
    };
  },

  async getApplications() {
    try {
      const appDirs = ['/Applications', '/System/Applications', `${os.homedir()}/Applications`];
      const apps = [];

      for (const dir of appDirs) {
        try {
          const entries = fs.readdirSync(dir);
          for (const entry of entries) {
            if (entry.endsWith('.app')) {
              const appPath = path.join(dir, entry);
              const name = entry.replace('.app', '');

              // Try to get app icon path
              let iconPath = null;
              const infoPlist = path.join(appPath, 'Contents', 'Info.plist');
              if (fs.existsSync(infoPlist)) {
                const iconName = await runCommand(
                  `defaults read "${infoPlist}" CFBundleIconFile 2>/dev/null`
                );
                if (iconName) {
                  const icnsName = iconName.endsWith('.icns') ? iconName : `${iconName}.icns`;
                  const icnsPath = path.join(appPath, 'Contents', 'Resources', icnsName);
                  if (fs.existsSync(icnsPath)) {
                    iconPath = icnsPath;
                  }
                }
              }

              apps.push({
                name,
                path: appPath,
                iconPath,
              });
            }
          }
        } catch {
          // Directory might not exist
        }
      }

      // Sort alphabetically
      apps.sort((a, b) => a.name.localeCompare(b.name));
      return apps;
    } catch {
      return [];
    }
  },
};

module.exports = { systemService };
