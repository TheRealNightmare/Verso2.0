import React from 'react';

const CommentComponent = ({ user, time, text, avatar }) => {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-[#e8eef5] mb-3">
      <img src={avatar} alt={user} className="w-10 h-10 rounded-full object-cover" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-800">{user}</h4>
          <span className="text-xs text-slate-400">{time}</span>
        </div>
        <p className="text-sm text-slate-600 mt-1">{text}</p>
      </div>
    </div>
  );
};

export default CommentComponent;
