import React, { useState } from 'react';
import { BookOpen, Bookmark, Heart, Share2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { addBookmark, removeBookmark } from '../api/bookmarks';
import { toggleFavorite } from '../api/favorites';
import { useToast } from '../context/ToastContext';
import Button from './ui/Button';

const ActionButtons = ({ bookId: propBookId, isBookmarked: initBookmarked = false, isFavorited: initFavorited = false }) => {
  const navigate = useNavigate();
  const toast = useToast();
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
        toast.success('Removed from bookmarks');
      } else {
        await addBookmark(id);
        setBookmarked(true);
        toast.success('Saved to bookmarks');
      }
    } catch (err) {
      if (err.status === 401) navigate('/login');
      else toast.error('Could not update bookmark.');
    }
  };

  const handleFavoriteClick = async () => {
    try {
      const data = await toggleFavorite(id);
      setFavorited(data.is_favorited);
      toast.success(data.is_favorited ? 'Added to favorites' : 'Removed from favorites');
    } catch (err) {
      if (err.status === 401) navigate('/login');
      else toast.error('Could not update favorite.');
    }
  };

  const handleShareClick = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy link.');
    }
  };

  return (
    <div className="flex items-center gap-3 my-4">
      <Button onClick={handleReadClick}>
        <BookOpen size={18} /> Read
      </Button>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSaveClick}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? 'Remove bookmark' : 'Save bookmark'}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <Bookmark size={20} fill={bookmarked ? '#5b7c99' : 'none'} stroke={bookmarked ? '#5b7c99' : 'currentColor'} />
        </button>

        <button
          onClick={handleFavoriteClick}
          aria-pressed={favorited}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <Heart size={20} fill={favorited ? '#e74c3c' : 'none'} stroke={favorited ? '#e74c3c' : 'currentColor'} />
        </button>

        <button
          onClick={handleShareClick}
          aria-label="Copy link to this book"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <Share2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;
