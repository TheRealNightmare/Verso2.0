// Origin that serves uploaded files (avatars, chat images/audio).
// Derived from the API URL by stripping the trailing "/api".
const FILE_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

/**
 * Resolve a file URL coming from the backend.
 * - Absolute URLs (http/https), blob: and data: previews are returned unchanged.
 * - Relative paths (e.g. "/storage/avatars/x.jpg") are prefixed with the file origin.
 * - Falsy values return null so callers can fall back to a placeholder.
 */
export function resolveFileUrl(url) {
  if (!url) return null;
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  return `${FILE_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}
