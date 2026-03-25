import React from 'react';
import { BookOpen, Bookmark, Heart, Share2 } from 'lucide-react';

const ActionButtons = () => {
  return (
    <div className="action-row">
      {/* The main Read button */}
      <button className="read-btn">
        <BookOpen size={18} /> Read
      </button>

      {/* The secondary icon buttons */}
      <div className="icon-actions">
        <button className="action-icon-btn"><Bookmark size={20} /></button>
        <button className="action-icon-btn"><Heart size={20} /></button>
        <button className="action-icon-btn"><Share2 size={20} /></button>
      </div>
    </div>
  );
};

export default ActionButtons;