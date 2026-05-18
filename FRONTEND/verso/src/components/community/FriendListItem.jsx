import { Check, CheckCheck } from 'lucide-react';

const FriendListItem = ({ friend, selected, onSelect }) => {
  const handleClick = () => onSelect(friend.id);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
        selected
          ? 'bg-[#5b7c99] text-white'
          : 'hover:bg-slate-100 text-slate-700'
      }`}
    >
      <div className="relative shrink-0">
        <img
          src={friend.avatar}
          alt={friend.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        {friend.online && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-sm font-semibold truncate ${selected ? 'text-white' : 'text-slate-800'}`}>
              {friend.name}
            </span>
            {friend.role && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${selected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {friend.role}
              </span>
            )}
          </div>
          {friend.lastSeen && (
            <span className={`text-[11px] shrink-0 ${selected ? 'text-white/70' : 'text-slate-400'}`}>
              {friend.lastSeen}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-xs truncate ${selected ? 'text-white/80' : 'text-slate-500'}`}>
            {friend.lastMessage}
          </p>
          <span className="shrink-0">
            {friend.unread ? (
              <span className="block w-2 h-2 rounded-full bg-red-500" />
            ) : selected ? (
              <Check size={14} className="text-white/80" />
            ) : (
              <CheckCheck size={14} className="text-[#4f83cc]" />
            )}
          </span>
        </div>
      </div>
    </button>
  );
};

export default FriendListItem;
