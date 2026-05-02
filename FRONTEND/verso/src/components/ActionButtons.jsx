import React, { useState } from 'react';
import { BookOpen, Bookmark, Heart, Share2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { addBookmark, removeBookmark } from '../api/bookmarks';
import { toggleFavorite } from '../api/favorites';

const ActionButtons = ({ bookId: propBookId, isBookmarked: initBookmarked = false, isFavorited: initFavorited = false }) => {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const id = propBookId ?? paramId;

  const [bookmarked, setBookmarked] = useState(initBookmarked);
  const [favorited, setFavorited] = useState(initFavorited);

  const handleReadClick = () => navigate(`/read/${id}`);

  const handleSaveClick = async () => {
    try {
      if (bookmarked) {
        await removeBookmark(id);
        setBookmarked(false);
      } else {
        await addBookmark(id);
        setBookmarked(true);
      }
    } catch (err) {
      if (err.status === 401) navigate('/login');
    }
  };

  const handleFavoriteClick = async () => {
    try {
      const data = await toggleFavorite(id);
      setFavorited(data.is_favorited);
    } catch (err) {
      if (err.status === 401) navigate('/login');
    }
  };

  return (
    <div className="action-row">
      <button className="read-btn" onClick={handleReadClick}>
        <BookOpen size={18} /> Read
      </button>

      <div className="icon-actions">
        <button className="action-icon-btn" onClick={handleSaveClick}>
          <Bookmark size={20} fill={bookmarked ? '#5b7c99' : 'none'} stroke={bookmarked ? '#5b7c99' : 'currentColor'} />
        </button>

        <button className="action-icon-btn" onClick={handleFavoriteClick}>
          <Heart size={20} fill={favorited ? '#e74c3c' : 'none'} stroke={favorited ? '#e74c3c' : 'currentColor'} />
        </button>

        <button className="action-icon-btn">
          <Share2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;
