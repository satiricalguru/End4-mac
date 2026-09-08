const os = require('os');
const path = require('path');
const fs = require('fs');
const { runCommand } = require('./command.cjs');

function parseMemoryPressure(output, total) {
  const availablePercentage = Number.parseInt(
    output.match(/memory free percentage:\s*(\d+)%/i)?.[1] ?? '',
    10,
  );

  if (!Number.isFinite(availablePercentage)) return null;

  const percentage = Math.max(0, Math.min(100, 100 - availablePercentage));
  const used = total * (percentage / 100);
  const free = total - used;

  return {
    total,
    free,
    used,
    percentage,
    availablePercentage,
    totalGB: (total / 1073741824).toFixed(1),
    usedGB: (used / 1073741824).toFixed(1),
    freeGB: (free / 1073741824).toFixed(1),
    metric: 'pressure',
  };
}

const systemService = {
  async getSystemInfo() {
    try {
      const hostname = os.hostname();
      const platform = os.platform();
      const arch = os.arch();
      const uptime = os.uptime();

      const [macVersion, macName, chipInfo] = await Promise.all([
        runCommand('/usr/bin/sw_vers', ['-productVersion']),
        runCommand('/usr/bin/sw_vers', ['-productName']),
        runCommand('/usr/sbin/sysctl', ['-n', 'machdep.cpu.brand_string']),
      ]);

      return {
        hostname,
        platform,
        arch,
        uptime,
        macVersion: macVersion.stdout,
        macName: macName.stdout,
        chip: chipInfo.stdout,
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
      const result = await runCommand('/bin/ps', ['-A', '-o', '%cpu=']);
      const cpuCount = os.cpus().length;
      const totalUsage = result.ok
        ? result.stdout.split('\n').reduce((sum, value) => sum + (Number.parseFloat(value) || 0), 0)
        : 0;
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
    const pressure = await runCommand('/usr/bin/memory_pressure', ['-Q']);
    const parsed = pressure.ok ? parseMemoryPressure(pressure.stdout, total) : null;

    if (parsed) return parsed;

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
      metric: 'physical',
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
                const iconResult = await runCommand('/usr/bin/defaults', [
                  'read',
                  infoPlist,
                  'CFBundleIconFile',
                ]);
                const iconName = iconResult.stdout;
                if (iconResult.ok && iconName) {
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

module.exports = { parseMemoryPressure, systemService };
