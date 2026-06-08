import React, { useState } from 'react';
import { X, Trash2, Send } from 'lucide-react';
import Avatar from '../ui/Avatar';

// Margin discussion for a single shared highlight: shows the passage, the
// author's optional note, and a threaded list of comments with a composer.
const HighlightThread = ({
  highlight,
  comments = [],
  currentUserId,
  isOwner,
  onAddComment,
  onDeleteComment,
  onDeleteHighlight,
  onClose,
}) => {
  const [draft, setDraft] = useState('');
  if (!highlight) return null;

  const canDeleteHighlight = isOwner || highlight.author?.id === currentUserId;

  const submit = (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    onAddComment(body);
    setDraft('');
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white flex flex-col shadow-xl lg:static lg:z-auto lg:w-80 lg:max-w-none lg:shadow-none lg:border-l lg:border-slate-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h3 className="text-base font-semibold text-[#2c3e50]">Discussion</h3>
        <button onClick={onClose} className="p-1 text-slate-500 hover:text-[#5b7c99]" aria-label="Close discussion">
          <X size={20} />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-slate-100">
        <p
          className="rounded-md border-l-4 bg-[#f8f6f2] p-2 text-[13px] leading-snug text-[#2c3e50]"
          style={{ borderColor: highlight.color || '#fde68a' }}
        >
          “{highlight.selectedText || highlight.selected_text}”
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">by {highlight.author?.name || 'Unknown'}</span>
          {canDeleteHighlight && (
            <button
              onClick={onDeleteHighlight}
              className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700"
            >
              <Trash2 size={12} /> Delete highlight
            </button>
          )}
        </div>
        {highlight.note && (
          <p className="mt-2 text-[12px] italic text-[#2c3e50]/70">{highlight.note}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {comments.length === 0 ? (
          <p className="text-[13px] text-slate-400 text-center py-6">
            No comments yet — start the discussion.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="group flex items-start gap-2">
              <Avatar src={c.author?.avatarUrl} name={c.author?.name} className="w-7 h-7" textClass="text-[11px]" />
              <div className="min-w-0 flex-1 rounded-lg bg-slate-100 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold text-[#2c3e50]">{c.author?.name}</span>
                  {(isOwner || c.author?.id === currentUserId) && (
                    <button
                      onClick={() => onDeleteComment(c.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-600"
                      aria-label="Delete comment"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <p className="text-[13px] text-[#2c3e50] whitespace-pre-wrap break-words">{c.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-slate-200 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-[#5b7c99] focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-[#5b7c99] p-2 text-white hover:bg-[#4a6884] disabled:opacity-40"
          disabled={!draft.trim()}
          aria-label="Send comment"
        >
          <Send size={16} />
        </button>
      </form>
    </aside>
  );
};

export default HighlightThread;
