const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { runAppleScript } = require('./command.cjs');

const MAX_WALLPAPER_BYTES = 30 * 1024 * 1024;
const CONTENT_TYPE_EXTENSIONS = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/heic', '.heic'],
  ['image/heif', '.heif'],
]);

function isAllowedRemoteUrl(source) {
  if (typeof source !== 'string') return false;
  try {
    const url = new URL(source);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function resolveBundledAsset(source, appPath) {
  if (typeof source !== 'string' || typeof appPath !== 'string') return null;
  if (!source.startsWith('/') || isAllowedRemoteUrl(source)) return null;

  const segments = source.split('/').filter(Boolean);
  if (!segments.length || segments.some((segment) => segment === '..' || segment === '.')) return null;
  if (!['assets', 'screenshots'].includes(segments[0])) return null;

  const distPath = path.resolve(appPath, 'dist');
  const assetPath = path.resolve(distPath, ...segments);
  if (assetPath !== distPath && !assetPath.startsWith(`${distPath}${path.sep}`)) return null;
  return assetPath;
}

async function downloadRemoteWallpaper(source, userDataPath) {
  const response = await fetch(source, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Wallpaper download failed (${response.status})`);

  const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  const extension = CONTENT_TYPE_EXTENSIONS.get(contentType);
  if (!extension) throw new Error('Wallpaper URL did not return a supported image');

  const declaredSize = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_WALLPAPER_BYTES) {
    throw new Error('Wallpaper is larger than 30 MB');
  }

  const chunks = [];
  let receivedBytes = 0;
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Wallpaper response had no readable body');
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    receivedBytes += value.byteLength;
    if (receivedBytes > MAX_WALLPAPER_BYTES) {
      await reader.cancel();
      throw new Error('Wallpaper is larger than 30 MB');
    }
    chunks.push(Buffer.from(value));
  }
  const bytes = Buffer.concat(chunks, receivedBytes);

  const cachePath = path.join(userDataPath, 'wallpapers');
  await fs.mkdir(cachePath, { recursive: true });
  const digest = crypto.createHash('sha256').update(source).digest('hex');
  const filePath = path.join(cachePath, `${digest}${extension}`);
  await fs.writeFile(filePath, bytes);
  return filePath;
}

async function materializeBundledWallpaper(sourcePath, userDataPath) {
  const extension = path.extname(sourcePath).toLowerCase();
  const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif']);
  if (!allowedExtensions.has(extension)) throw new Error('Bundled wallpaper has an unsupported image type');

  const bytes = await fs.readFile(sourcePath);
  const cachePath = path.join(userDataPath, 'wallpapers');
  await fs.mkdir(cachePath, { recursive: true });
  const digest = crypto.createHash('sha256').update(bytes).digest('hex');
  const filePath = path.join(cachePath, `${digest}${extension === '.jpeg' ? '.jpg' : extension}`);
  await fs.writeFile(filePath, bytes);
  return filePath;
}

async function resolveWallpaperSource(source, { appPath, userDataPath }) {
  if (isAllowedRemoteUrl(source)) return downloadRemoteWallpaper(source, userDataPath);

  const bundledPath = resolveBundledAsset(source, appPath);
  if (bundledPath) return materializeBundledWallpaper(bundledPath, userDataPath);

  if (typeof source === 'string' && path.isAbsolute(source)) return source;
  return null;
}

async function setWallpaper(source, paths) {
  try {
    const filePath = await resolveWallpaperSource(source, paths);
    if (!filePath) return { ok: false, supported: true, error: 'Unsupported wallpaper source' };

    const file = await fs.stat(filePath);
    if (!file.isFile()) return { ok: false, supported: true, error: 'Wallpaper file was not found' };

    const script = `on run argv
set imagePath to item 1 of argv
set imageFile to POSIX file imagePath
tell application "System Events"
  repeat with desktopItem in desktops
    set picture of desktopItem to imageFile
  end repeat
end tell
end run`;
    const result = await runAppleScript(script, [filePath], { timeout: 15_000 });
    if (!result.ok) return { ok: false, supported: true, error: result.error || 'macOS rejected the wallpaper change' };
    return { ok: true, supported: true, path: filePath };
  } catch (error) {
    return { ok: false, supported: true, error: error.message || 'Unable to set wallpaper' };
  }
}

const wallpaperService = { setWallpaper };

module.exports = {
  downloadRemoteWallpaper,
  isAllowedRemoteUrl,
  materializeBundledWallpaper,
  resolveBundledAsset,
  resolveWallpaperSource,
  setWallpaper,
  wallpaperService,
};
