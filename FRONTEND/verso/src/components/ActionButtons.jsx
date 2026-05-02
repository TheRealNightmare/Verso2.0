import React from 'react';
import { BookOpen, Bookmark, Heart, Share2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const ActionButtons = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleReadClick = () => {
    navigate(`/read/${id}`);
  };

  // New function to handle clicking the save icon
  const handleSaveClick = () => {
    navigate('/storage');
  };

  return (
    <div className="action-row">
      <button className="read-btn" onClick={handleReadClick}>
        <BookOpen size={18} /> Read
      </button>

      <div className="icon-actions">
        {/* Added the onClick here */}
        <button className="action-icon-btn" onClick={handleSaveClick}>
          <Bookmark size={20} />
        </button>
        
        <button className="action-icon-btn"><Heart size={20} /></button>
        <button className="action-icon-btn"><Share2 size={20} /></button>
      </div>
    </div>
  );
};

export default ActionButtons;