const { execFile } = require('node:child_process');

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_BUFFER = 1024 * 1024;

function runCommand(file, args = [], options = {}) {
  return new Promise((resolve) => {
    execFile(
      file,
      args,
      {
        timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
        maxBuffer: options.maxBuffer ?? DEFAULT_MAX_BUFFER,
        encoding: 'utf8',
        windowsHide: true,
      },
      (error, stdout = '', stderr = '') => {
        resolve({
          ok: !error,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          code: error?.code ?? null,
          error: error ? (stderr.trim() || error.message) : null,
        });
      },
    );
  });
}

async function commandExists(name) {
  const result = await runCommand('/usr/bin/which', [name]);
  return result.ok && Boolean(result.stdout);
}

async function runAppleScript(script, args = [], options = {}) {
  return runCommand('/usr/bin/osascript', ['-e', script, ...args], options);
}

module.exports = { commandExists, runAppleScript, runCommand };
