const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');


const {
  isAllowedRemoteUrl,
  resolveBundledAsset,
  resolveWallpaperSource,
} = require('../electron/services/wallpaper.cjs');

test('only HTTP(S) URLs are accepted as remote wallpaper sources', () => {
  assert.equal(isAllowedRemoteUrl('https://images.example.test/wallpaper.jpg'), true);
  assert.equal(isAllowedRemoteUrl('http://localhost/wallpaper.png'), true);
  assert.equal(isAllowedRemoteUrl('file:///etc/passwd'), false);
  assert.equal(isAllowedRemoteUrl('data:text/html,hello'), false);
  assert.equal(isAllowedRemoteUrl('javascript:alert(1)'), false);
});

test('bundled wallpaper paths stay inside the renderer output directory', () => {
  const appPath = path.join(path.sep, 'Applications', 'End4.app', 'Contents', 'Resources', 'app.asar');
  assert.equal(
    resolveBundledAsset('/assets/images/default_wallpaper.png', appPath),
    path.join(appPath, 'dist', 'assets', 'images', 'default_wallpaper.png'),
  );
  assert.equal(resolveBundledAsset('/../electron/main.cjs', appPath), null);
  assert.equal(resolveBundledAsset('https://example.test/image.jpg', appPath), null);
});

test('bundled wallpapers are materialized outside the application archive for macOS', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'end4-wallpaper-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const appPath = path.join(root, 'app.asar');
  const userDataPath = path.join(root, 'user-data');
  const bundledPath = path.join(appPath, 'dist', 'assets', 'images', 'sample.png');
  await fs.mkdir(path.dirname(bundledPath), { recursive: true });
  await fs.writeFile(bundledPath, Buffer.from('sample-image'));

  const resolved = await resolveWallpaperSource('/assets/images/sample.png', { appPath, userDataPath });

  assert.ok(resolved.startsWith(path.join(userDataPath, 'wallpapers')));
  assert.equal(await fs.readFile(resolved, 'utf8'), 'sample-image');
});
