import { useState } from 'react';
import { resolveFileUrl } from '../../lib/assets';

const COLORS = [
  '#5b7c99', '#1e3a5f', '#4f83cc', '#6b8e9e', '#8a6d9e',
  '#9e6d6d', '#6d9e7a', '#9e8a6d', '#7a6d9e', '#6d839e',
];

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFor(name) {
  const s = String(name || 'U');
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

/**
 * Avatar that shows the user's uploaded picture, falling back to a
 * deterministic colored circle with initials when there's no image
 * (or the image fails to load).
 *
 * `className` controls size/shape (default: small round avatar).
 * `textClass` controls the initials font size for the fallback.
 */
const Avatar = ({ src, name, className = 'w-10 h-10', textClass = 'text-sm', alt }) => {
  const resolved = resolveFileUrl(src);
  const [failed, setFailed] = useState(false);

  if (resolved && !failed) {
    return (
      <img
        src={resolved}
        alt={alt || name || 'avatar'}
        onError={() => setFailed(true)}
        className={`${className} rounded-full object-cover shrink-0 bg-slate-200`}
      />
    );
  }

  return (
    <div
      aria-label={name || 'avatar'}
      className={`${className} rounded-full shrink-0 flex items-center justify-center text-white font-semibold select-none ${textClass}`}
      style={{ backgroundColor: colorFor(name) }}
    >
      {initials(name)}
    </div>
  );
};

export default Avatar;
