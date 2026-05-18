import { Phone, Video, MoreVertical } from 'lucide-react';

const ChatHeader = ({ friend }) => {
  if (!friend) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
      <div className="flex items-center gap-3">
        <img
          src={friend.avatar}
          alt={friend.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <div className="text-sm font-semibold text-slate-800">{friend.name}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Online
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-slate-500">
        <button
          type="button"
          className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"
          aria-label="Call"
        >
          <Phone size={18} />
        </button>
        <button
          type="button"
          className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"
          aria-label="Video"
        >
          <Video size={18} />
        </button>
        <button
          type="button"
          className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"
          aria-label="More options"
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
