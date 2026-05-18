import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { mockFriends, mockConversations } from '../mocks/community';
import FriendListItem from '../components/community/FriendListItem';
import MessageBubble from '../components/community/MessageBubble';
import AudioMessage from '../components/community/AudioMessage';
import ChatHeader from '../components/community/ChatHeader';
import MessageComposer from '../components/community/MessageComposer';

const formatNowTimestamp = () => {
  const d = new Date();
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `Today ${hh}:${mm}`;
};

const Community = () => {
  const [selectedFriendId, setSelectedFriendId] = useState(mockFriends[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState(mockConversations);
  const messagesEndRef = useRef(null);

  const filteredFriends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return mockFriends;
    return mockFriends.filter((f) => f.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const activeFriend = mockFriends.find((f) => f.id === selectedFriendId);
  const activeMessages = conversations[selectedFriendId] ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, selectedFriendId]);

  const handleSend = (text) => {
    const newMessage = {
      id: `${selectedFriendId}-${Date.now()}`,
      senderId: 'me',
      type: 'text',
      text,
      timestamp: formatNowTimestamp(),
    };
    setConversations((prev) => ({
      ...prev,
      [selectedFriendId]: [...(prev[selectedFriendId] ?? []), newMessage],
    }));
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-white rounded-xl overflow-hidden shadow-sm">
      <aside className="w-80 border-r border-slate-200 flex flex-col">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Friends</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Friend's Name"
              className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100 border border-transparent focus:outline-none focus:border-[#4f83cc]/40 text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {filteredFriends.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-6">No friends found</div>
          ) : (
            filteredFriends.map((friend) => (
              <FriendListItem
                key={friend.id}
                friend={friend}
                selected={friend.id === selectedFriendId}
                onSelect={setSelectedFriendId}
              />
            ))
          )}
        </div>
      </aside>

      <section className="flex-1 flex flex-col">
        <ChatHeader friend={activeFriend} />

        <div className="flex-1 overflow-y-auto px-6 py-4 bg-white">
          {activeMessages.map((m) => {
            const isMine = m.senderId === 'me';
            if (m.type === 'audio') {
              return <AudioMessage key={m.id} message={m} isMine={isMine} />;
            }
            return <MessageBubble key={m.id} message={m} isMine={isMine} />;
          })}
          <div ref={messagesEndRef} />
        </div>

        <MessageComposer onSend={handleSend} />
      </section>
    </div>
  );
};

export default Community;
