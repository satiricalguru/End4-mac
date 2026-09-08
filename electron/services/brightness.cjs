const { commandExists, runCommand } = require('./command.cjs');

function parseBrightnessOutput(output) {
  const matches = [...output.matchAll(/brightness\s+([01](?:\.\d+)?)/gi)];
  if (!matches.length) return null;

  const value = Number.parseFloat(matches.at(-1)[1]);
  if (!Number.isFinite(value)) return null;
  return Math.round(Math.max(0, Math.min(1, value)) * 100);
}

function unsupportedBrightness() {
  return {
    brightness: null,
    supported: false,
    error: 'Display brightness control requires the optional `brightness` helper.',
  };
}

const brightnessService = {
  async getBrightness() {
    if (!(await commandExists('brightness'))) return unsupportedBrightness();

    const result = await runCommand('brightness', ['-l']);
    const brightness = result.ok ? parseBrightnessOutput(result.stdout) : null;

    if (brightness === null) {
      return {
        ...unsupportedBrightness(),
        supported: true,
        error: result.error || 'The display did not report a brightness value.',
      };
    }

    return { brightness, supported: true, error: null };
  },

  async setBrightness(value) {
    if (!(await commandExists('brightness'))) return unsupportedBrightness();

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return { ...unsupportedBrightness(), error: 'Brightness must be a number.' };
    }

    const clamped = Math.max(0, Math.min(100, Math.round(numericValue)));
    const result = await runCommand('brightness', [String(clamped / 100)]);
    if (!result.ok) {
      return {
        brightness: null,
        supported: true,
        error: result.error || 'Unable to change display brightness.',
      };
    }

    return this.getBrightness();
  },
};

module.exports = { brightnessService, parseBrightnessOutput };
