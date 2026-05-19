import { MessageCircle } from 'lucide-react';

const placeholderAvatar = (seed = 'U') => {
  const text = encodeURIComponent(String(seed).slice(0, 2).toUpperCase());
  return `https://via.placeholder.com/40?text=${text}`;
};

const previewText = (m) => {
  if (m.type === 'text') return m.body || '';
  if (m.type === 'audio') return '🎙️ Voice message';
  if (m.type === 'image') return '🖼️ Image';
  return '';
};

const RecentThreads = ({ threads, activeThreadId, onSelect, onClear }) => {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent threads</h3>
        {activeThreadId && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] text-[#4f83cc] hover:underline"
          >
            Back to feed
          </button>
        )}
      </div>
      <div className="space-y-1">
        {(!threads || threads.length === 0) ? (
          <div className="text-xs text-slate-400 px-2 py-3">No threads yet.</div>
        ) : (
          threads.map((t) => {
            const isActive = activeThreadId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                className={`w-full text-left flex items-start gap-2 px-2 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-[#5b7c99] text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <img
                  src={t.author?.avatarUrl || placeholderAvatar(t.author?.name)}
                  alt={t.author?.name || 'user'}
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                    {t.author?.name || 'Unknown'}
                  </div>
                  <div className={`text-[11px] truncate ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                    {previewText(t)}
                  </div>
                </div>
                {t.replyCount > 0 && (
                  <span className={`flex items-center gap-0.5 text-[10px] shrink-0 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                    <MessageCircle size={10} />
                    {t.replyCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentThreads;
