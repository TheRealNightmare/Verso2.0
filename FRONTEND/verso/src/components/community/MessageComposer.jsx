import { useState } from 'react';
import { Paperclip, Send } from 'lucide-react';

const MessageComposer = ({ onSend }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-4 py-3 border-t border-slate-200"
    >
      <button
        type="button"
        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
        aria-label="Attach"
      >
        <Paperclip size={16} />
      </button>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message"
        className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 border border-transparent focus:outline-none focus:border-[#4f83cc]/40 text-sm text-slate-700 placeholder:text-slate-400"
      />
      <button
        type="submit"
        className="w-10 h-10 rounded-lg bg-[#4f83cc] hover:bg-[#3f6ab0] text-white flex items-center justify-center"
        aria-label="Send"
      >
        <Send size={16} />
      </button>
    </form>
  );
};

export default MessageComposer;
