import React from 'react';
import { X, UserPlus, CornerDownRight, UserMinus } from 'lucide-react';
import Avatar from '../ui/Avatar';

// Roster for a room: avatars color-coded by each member's highlight color, their
// current page (soft location, reading rooms only), an online dot, and a "jump to"
// that moves only THIS reader to that page (never forces others). Chat rooms pass
// showLocation={false} to hide page/jump, and owners pass canManage + onKick.
const RoomMembersPanel = ({
  members = [],
  onlineIds,
  currentUserId,
  onJumpTo,
  onInvite,
  onClose,
  showLocation = true,
  canManage = false,
  onKick,
}) => {
  const online = onlineIds || new Set();

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#b8c5d6] flex flex-col shadow-xl lg:static lg:z-auto lg:w-72 lg:max-w-none lg:shadow-none">
      <div className="flex items-center justify-between px-5 py-4 text-[#2c3e50]">
        <h3 className="text-lg font-semibold">In this room</h3>
        <button onClick={onClose} className="p-1 hover:text-[#5b7c99]" aria-label="Close members">
          <X size={22} />
        </button>
      </div>

      <button
        onClick={onInvite}
        className="mx-4 mb-3 inline-flex items-center justify-center gap-2 rounded-lg bg-[#5b7c99] px-3 py-2 text-sm font-medium text-white hover:bg-[#4a6884]"
      >
        <UserPlus size={16} /> Invite
      </button>

      <div className="flex-1 overflow-y-auto px-3 pb-6 flex flex-col gap-1.5">
        {members.map((m) => {
          const isOnline = online.has(m.userId);
          const isMe = m.userId === currentUserId;
          return (
            <div
              key={m.userId}
              className="flex items-center gap-3 rounded-lg bg-white/40 px-3 py-2"
            >
              <span className="relative shrink-0">
                <Avatar src={m.avatarUrl} name={m.name} className="w-9 h-9" />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#b8c5d6] ${
                    isOnline ? 'bg-green-500' : 'bg-slate-400'
                  }`}
                  title={isOnline ? 'Online' : 'Offline'}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm ring-1 ring-black/10"
                    style={{ backgroundColor: m.color }}
                    title="Highlight color"
                  />
                  <span className="truncate text-sm font-medium text-[#2c3e50]">
                    {m.name}{isMe ? ' (you)' : ''}{m.role === 'owner' ? ' · owner' : ''}
                  </span>
                </div>
                {showLocation && (
                  <span className="text-[12px] text-[#2c3e50]/70">Page {(m.lastPage ?? 0) + 1}</span>
                )}
              </div>
              {showLocation && !isMe && (
                <button
                  onClick={() => onJumpTo(m.lastPage ?? 0)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[12px] text-[#5b7c99] hover:bg-white/60"
                  title={`Jump to ${m.name}'s page`}
                >
                  <CornerDownRight size={13} /> Jump
                </button>
              )}
              {canManage && !isMe && m.role !== 'owner' && (
                <button
                  onClick={() => onKick?.(m.userId)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[12px] text-red-600 hover:bg-red-50"
                  title={`Remove ${m.name}`}
                >
                  <UserMinus size={13} /> Kick
                </button>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default RoomMembersPanel;
