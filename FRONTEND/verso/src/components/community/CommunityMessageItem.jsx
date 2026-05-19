import { useState } from 'react';
import { Smile, Reply, Pencil, Trash2, MessageCircle, Check, X } from 'lucide-react';
import AudioMessage from './AudioMessage';
import ReactionPicker from './ReactionPicker';

const placeholderAvatar = (seed = 'U') => {
  const text = encodeURIComponent(String(seed).slice(0, 2).toUpperCase());
  return `https://via.placeholder.com/40?text=${text}`;
};

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return sameDay ? `Today ${hh}:${mm}` : `${d.toLocaleDateString()} ${hh}:${mm}`;
};

const CommunityMessageItem = ({
  message,
  showReplyCount = false,
  onReply,
  onOpenThread,
  onReact,
  onEdit,
  onDelete,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body || '');

  const author = message.author || {};
  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions);

  const submitEdit = () => {
    const v = draft.trim();
    if (!v || v === message.body) { setEditing(false); return; }
    onEdit?.(message.id, v);
    setEditing(false);
  };

  return (
    <div className="group relative flex gap-3 px-2 py-3 hover:bg-slate-50 rounded-lg">
      <img
        src={author.avatarUrl || placeholderAvatar(author.name)}
        alt={author.name || 'user'}
        className="w-9 h-9 rounded-full object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-slate-800">{author.name || 'Unknown'}</span>
          {author.role && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">{author.role}</span>
          )}
          <span className="text-[11px] text-slate-400">{formatTime(message.createdAt)}</span>
          {message.editedAt && (
            <span className="text-[11px] text-slate-400 italic">(edited)</span>
          )}
        </div>

        <div className="mt-0.5 text-sm text-slate-700">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitEdit(); if (e.key === 'Escape') setEditing(false); }}
                className="flex-1 px-3 py-1.5 rounded-md border border-slate-300 text-sm focus:outline-none focus:border-[#4f83cc]"
                autoFocus
              />
              <button type="button" onClick={submitEdit} className="text-green-600 hover:text-green-700"><Check size={16} /></button>
              <button type="button" onClick={() => setEditing(false)} className="text-slate-500 hover:text-slate-700"><X size={16} /></button>
            </div>
          ) : (
            <>
              {message.type === 'text' && (
                <div className="whitespace-pre-wrap break-words">{message.body}</div>
              )}
              {message.type === 'audio' && (
                <AudioMessage message={{ audio: message.audio, timestamp: '' }} isMine={message.mine} />
              )}
              {message.type === 'image' && message.image?.url && (
                <div>
                  {message.body && <div className="mb-1 whitespace-pre-wrap break-words">{message.body}</div>}
                  <img
                    src={message.image.url}
                    alt="attachment"
                    className="max-w-sm max-h-80 rounded-lg border border-slate-200 object-cover"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {reactionEntries.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {reactionEntries.map(([emoji, data]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact?.(message.id, emoji)}
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  data.mine ? 'bg-[#4f83cc]/10 border-[#4f83cc]/40 text-[#3f6ab0]' : 'bg-slate-100 border-slate-200 text-slate-700'
                } hover:border-[#4f83cc]/60`}
              >
                {emoji} {data.count}
              </button>
            ))}
          </div>
        )}

        {showReplyCount && message.replyCount > 0 && (
          <button
            type="button"
            onClick={() => onOpenThread?.(message.id)}
            className="mt-1 inline-flex items-center gap-1 text-xs text-[#4f83cc] hover:underline"
          >
            <MessageCircle size={12} />
            {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white border border-slate-200 rounded-md px-1 py-0.5 shadow-sm">
        <button type="button" onClick={() => setShowPicker((p) => !p)} className="p-1 text-slate-500 hover:text-slate-700" title="React">
          <Smile size={14} />
        </button>
        {onReply && (
          <button type="button" onClick={() => onReply(message.id)} className="p-1 text-slate-500 hover:text-slate-700" title="Reply">
            <Reply size={14} />
          </button>
        )}
        {message.mine && message.type === 'text' && !editing && (
          <button type="button" onClick={() => { setDraft(message.body || ''); setEditing(true); }} className="p-1 text-slate-500 hover:text-slate-700" title="Edit">
            <Pencil size={14} />
          </button>
        )}
        {message.mine && (
          <button type="button" onClick={() => onDelete?.(message.id)} className="p-1 text-slate-500 hover:text-red-600" title="Delete">
            <Trash2 size={14} />
          </button>
        )}
        {showPicker && (
          <ReactionPicker
            onPick={(emoji) => onReact?.(message.id, emoji)}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CommunityMessageItem;
