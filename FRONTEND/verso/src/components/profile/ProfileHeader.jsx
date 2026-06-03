import { Clock, PenSquare } from 'lucide-react';
import Avatar from '../ui/Avatar';

const formatJoined = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

// Lighten (amount > 0) or darken (amount < 0) a #rrggbb hex toward white/black.
const shade = (hex, amount) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const mix = (c) =>
    Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  const r = mix((num >> 16) & 0xff);
  const g = mix((num >> 8) & 0xff);
  const b = mix(num & 0xff);
  return `rgb(${r}, ${g}, ${b})`;
};

// A solid banner hex becomes a gentle left-to-right gradient with the original depth.
const bannerStyle = (hex) =>
  /^#[0-9a-f]{6}$/i.test(hex || '')
    ? {
        backgroundImage: `linear-gradient(to right, ${shade(hex, 0.12)}, ${hex}, ${shade(hex, -0.28)})`,
      }
    : undefined;

/**
 * Profile banner + identity block. The `actions` node (friend buttons or an
 * Edit button) is rendered under the meta row so each page injects its own.
 */
const ProfileHeader = ({ profile, actions }) => {
  const isAuthor = profile.role === 'author';
  const joined = formatJoined(profile.createdAt);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        className={`h-32 sm:h-40 ${
          bannerStyle(profile.bannerColor)
            ? ''
            : 'bg-linear-to-r from-[#5b7c99] via-[#3f5f7e] to-[#1e3a5f]'
        }`}
        style={bannerStyle(profile.bannerColor)}
      />

      <div className="px-5 pb-5 sm:px-7 sm:pb-6">
        <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end">
          <div className="relative shrink-0">
            <Avatar
              src={profile.avatarUrl}
              name={profile.name}
              className="h-28 w-28 ring-4 ring-white shadow-md sm:h-32 sm:w-32"
              textClass="text-4xl"
            />
            {profile.online && (
              <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-green-500 ring-2 ring-white" />
            )}
          </div>

          <div className="flex-1 pb-1">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold text-slate-800">
              {profile.name}
              {isAuthor && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  <PenSquare size={12} /> Author
                </span>
              )}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-slate-400">
              {profile.online ? (
                <span className="font-medium text-green-600">● Online</span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Clock size={13} /> Offline
                </span>
              )}
              <span>·</span>
              <span>
                {profile.friendCount} {profile.friendCount === 1 ? 'friend' : 'friends'}
              </span>
              {joined && (
                <>
                  <span>·</span>
                  <span>Joined {joined}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default ProfileHeader;
