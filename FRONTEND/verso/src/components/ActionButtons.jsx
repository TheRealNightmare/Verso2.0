import React from 'react';
import { BookOpen, Bookmark, Heart, Share2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom'; // Import these

const ActionButtons = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // This grabs the book ID from the current URL

  const handleReadClick = () => {
    // Navigates to the reading page for this specific book
    navigate(`/read/${id}`);
  };

  return (
    <div className="action-row">
      {/* The main Read button now has an onClick */}
      <button className="read-btn" onClick={handleReadClick}>
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