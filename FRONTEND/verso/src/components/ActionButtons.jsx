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
    <div className="flex items-center gap-3 my-4">
      <button
        onClick={handleReadClick}
        className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#5b7c99] text-white hover:bg-[#4a6a85] transition-colors"
      >
        <BookOpen size={18} /> Read
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSaveClick}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <Bookmark size={20} fill={bookmarked ? '#5b7c99' : 'none'} stroke={bookmarked ? '#5b7c99' : 'currentColor'} />
        </button>

        <button
          onClick={handleFavoriteClick}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <Heart size={20} fill={favorited ? '#e74c3c' : 'none'} stroke={favorited ? '#e74c3c' : 'currentColor'} />
        </button>

        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
          <Share2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;
