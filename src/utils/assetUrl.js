/**
 * Resolve public assets in both Vite dev mode (http://) and Electron's
 * packaged file:// renderer. Vite's base is './', so root-relative paths
 * must be made relative before they are handed to the browser.
 */
export function resolveAssetUrl(assetPath) {
  if (!assetPath || !assetPath.startsWith('/')) return assetPath;
  return `${import.meta.env.BASE_URL}${assetPath.slice(1)}`;
}
