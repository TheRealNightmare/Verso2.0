const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const ReactionPicker = ({ onPick, onClose }) => {
  return (
    <div
      className="absolute z-20 -top-10 left-0 flex items-center gap-1 px-2 py-1 rounded-full bg-white shadow-lg border border-slate-200"
      onMouseLeave={onClose}
    >
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => { onPick(e); onClose?.(); }}
          className="text-lg hover:scale-125 transition-transform"
        >
          {e}
        </button>
      ))}
    </div>
  );
};

export default ReactionPicker;
