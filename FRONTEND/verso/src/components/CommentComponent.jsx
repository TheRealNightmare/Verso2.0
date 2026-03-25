import React from 'react';

const CommentComponent = ({ user, time, text, avatar }) => {
  return (
    <div className="comment-card">
      <img src={avatar} alt={user} className="comment-avatar" />
      <div className="comment-body">
        <div className="comment-meta">
          <h4 className="comment-user">{user}</h4>
          <span className="comment-timestamp">{time}</span>
        </div>
        <p className="comment-content">{text}</p>
      </div>
    </div>
  );
};

export default CommentComponent;