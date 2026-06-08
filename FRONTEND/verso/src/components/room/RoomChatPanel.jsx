import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import CommunityMessageItem from '../community/CommunityMessageItem';
import MessageComposer from '../community/MessageComposer';

// Presentational room chat. The reader owns the Echo subscription + feed state
// (one channel for the whole room) and passes the feed + handlers down. Reuses
// the community chat components verbatim since the message shape is identical.
const RoomChatPanel = ({
  feed = [],
  onSendText,
  onSendAudio,
  onSendImage,
  onReact,
  onEdit,
  onDelete,
  onClose,
  error,
}) => {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed.length]);

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white flex flex-col shadow-xl lg:static lg:z-auto lg:w-80 lg:max-w-none lg:shadow-none lg:border-l lg:border-slate-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h3 className="text-base font-semibold text-[#2c3e50]">Room chat</h3>
        <button onClick={onClose} className="p-1 text-slate-500 hover:text-[#5b7c99]" aria-label="Close chat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {feed.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-10">No messages yet — say hi 👋</div>
        ) : (
          feed.map((m) => (
            <CommunityMessageItem
              key={m.id}
              message={m}
              onReact={onReact}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
        <div ref={endRef} />
      </div>

      <MessageComposer
        onSendText={onSendText}
        onSendAudio={onSendAudio}
        onSendImage={onSendImage}
        placeholder="Message the room"
      />

      {error && (
        <div className="px-4 py-2 text-xs text-red-600 border-t border-red-100 bg-red-50">{error}</div>
      )}
    </aside>
  );
};

export default RoomChatPanel;
