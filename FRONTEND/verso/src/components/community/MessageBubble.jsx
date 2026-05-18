const MessageBubble = ({ message, isMine }) => {
  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} my-2`}>
      <div
        className={`max-w-md px-4 py-2.5 text-sm leading-relaxed text-white ${
          isMine
            ? 'bg-[#7c9dc4] rounded-2xl rounded-br-sm'
            : 'bg-[#8ca5c2] rounded-2xl rounded-bl-sm'
        }`}
      >
        {message.text}
      </div>
      <span className="text-[11px] text-slate-400 mt-1 px-1">{message.timestamp}</span>
    </div>
  );
};

export default MessageBubble;
