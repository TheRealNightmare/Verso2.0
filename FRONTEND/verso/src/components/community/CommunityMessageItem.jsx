import { useState } from 'react';
import { Smile, Pencil, Trash2, Check, X } from 'lucide-react';
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

const CommunityMessageItem = ({ message, onReact, onEdit, onDelete }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body || '');

  const mine = !!message.mine;
  const author = message.author || {};
  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions);

  const submitEdit = () => {
    const v = draft.trim();
    if (!v || v === message.body) { setEditing(false); return; }
    onEdit?.(message.id, v);
    setEditing(false);
  };

  const bubbleColor = mine
    ? 'bg-[#4f83cc] text-white rounded-br-md'
    : 'bg-slate-100 text-slate-800 rounded-bl-md';

  const renderBody = () => {
    if (editing) {
      return (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitEdit(); if (e.key === 'Escape') setEditing(false); }}
            className="flex-1 px-3 py-1.5 rounded-md border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-[#4f83cc]"
            autoFocus
          />
          <button type="button" onClick={submitEdit} className="text-green-600 hover:text-green-700"><Check size={16} /></button>
          <button type="button" onClick={() => setEditing(false)} className="text-slate-500 hover:text-slate-700"><X size={16} /></button>
        </div>
      );
    }

    if (message.type === 'audio') {
      return <AudioMessage message={{ audio: message.audio, timestamp: '' }} isMine={mine} />;
    }

    if (message.type === 'image' && message.image?.url) {
      return (
        <div className="flex flex-col gap-1">
          <img
            src={message.image.url}
            alt="attachment"
            className="max-w-[260px] max-h-80 rounded-xl border border-slate-200 object-cover"
          />
          {message.body && (
            <div className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${bubbleColor}`}>{message.body}</div>
          )}
        </div>
      );
    }

    return (
      <div className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${bubbleColor}`}>
        {message.body}
      </div>
    );
  };

  return (
    <div className={`group flex gap-2 px-2 py-1.5 ${mine ? 'justify-end' : 'justify-start'}`}>
      {!mine && (
        <img
          src={author.avatarUrl || placeholderAvatar(author.name)}
          alt={author.name || 'user'}
          className="w-8 h-8 rounded-full object-cover shrink-0 mt-5"
        />
      )}

      <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'} max-w-[75%] min-w-0`}>
        {!mine && (
          <div className="flex items-baseline gap-2 mb-0.5 px-1">
            <span className="text-xs font-semibold text-slate-700">{author.name || 'Unknown'}</span>
            {author.role && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">{author.role}</span>
            )}
          </div>
        )}

        <div className={`relative flex items-center gap-1 ${mine ? 'flex-row' : 'flex-row-reverse'}`}>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
            <button type="button" onClick={() => setShowPicker((p) => !p)} className="p-1 text-slate-400 hover:text-slate-700" title="React">
              <Smile size={14} />
            </button>
            {mine && message.type === 'text' && !editing && (
              <button type="button" onClick={() => { setDraft(message.body || ''); setEditing(true); }} className="p-1 text-slate-400 hover:text-slate-700" title="Edit">
                <Pencil size={14} />
              </button>
            )}
            {mine && (
              <button type="button" onClick={() => onDelete?.(message.id)} className="p-1 text-slate-400 hover:text-red-600" title="Delete">
                <Trash2 size={14} />
              </button>
            )}
            {showPicker && (
              <ReactionPicker
                onPick={(emoji) => { onReact?.(message.id, emoji); setShowPicker(false); }}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>

          <div className="min-w-0">
            {renderBody()}
          </div>
        </div>

        {reactionEntries.length > 0 && (
          <div className={`mt-1 flex flex-wrap gap-1 ${mine ? 'justify-end' : 'justify-start'}`}>
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

        <div className={`mt-0.5 flex items-center gap-1 px-1 ${mine ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[11px] text-slate-400">{formatTime(message.createdAt)}</span>
          {message.editedAt && <span className="text-[11px] text-slate-400 italic">(edited)</span>}
        </div>
      </div>
    </div>
  );
};

export default CommunityMessageItem;
