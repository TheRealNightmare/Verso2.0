import { useState } from 'react';
import { Edit2, Shield, X } from 'lucide-react';
import { updateProfile } from '../../api/profile';

const ProfileCard = ({ profile, onUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name ?? '');
  const [role, setRole] = useState(profile?.role ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const openEdit = () => {
    setName(profile?.name ?? '');
    setRole(profile?.role ?? '');
    setAvatarUrl(profile?.avatarUrl ?? '');
    setError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProfile({
        name,
        role,
        avatar_url: avatarUrl,
      });
      onUpdated?.(updated);
      setEditing(false);
    } catch (err) {
      setError(err?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.name || 'User';
  const displayRole = profile?.role || 'Reader';
  const displayAvatar = profile?.avatarUrl || 'https://i.pravatar.cc/150?u=default';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-[#1e3a5f]">Profile</h2>
        <button
          type="button"
          onClick={openEdit}
          className="text-slate-500 hover:text-[#1e3a5f] transition-transform"
          aria-label="Edit profile"
        >
          <Edit2 size={16} />
        </button>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative">
          <img
            src={displayAvatar}
            alt={displayName}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-100"
          />
          <div className="absolute -right-1 bottom-1 w-6 h-6 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center">
            <Shield size={12} />
          </div>
        </div>
        <p className="mt-3 font-semibold text-slate-800">{displayName}</p>
        <p className="text-xs text-slate-500">{displayRole}</p>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1e3a5f]">Edit Profile</h3>
              <button
                onClick={() => setEditing(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs">
                <span className="text-slate-500">Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-[#1e3a5f]"
                />
              </label>
              <label className="block text-xs">
                <span className="text-slate-500">Role</span>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-[#1e3a5f]"
                />
              </label>
              <label className="block text-xs">
                <span className="text-slate-500">Avatar URL</span>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="mt-1 w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-[#1e3a5f]"
                />
              </label>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setEditing(false)}
                  className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs px-3 py-1.5 rounded-md bg-[#1e3a5f] text-white hover:bg-[#16304f] disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
