import CommunityMessageItem from './CommunityMessageItem';

const ThreadView = ({ parent, replies, onReact, onEdit, onDelete }) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {parent && (
        <div className="border-b border-slate-200 pb-2 mb-2">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-1 px-2">Original</div>
          <CommunityMessageItem
            message={parent}
            onReact={onReact}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-1 px-2">
        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
      </div>
      {replies.length === 0 ? (
        <div className="text-sm text-slate-400 px-2 py-3">Be the first to reply.</div>
      ) : (
        replies.map((m) => (
          <CommunityMessageItem
            key={m.id}
            message={m}
            onReact={onReact}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
};

export default ThreadView;
