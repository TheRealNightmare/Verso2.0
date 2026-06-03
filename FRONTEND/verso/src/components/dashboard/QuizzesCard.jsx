import { useEffect, useState, useCallback } from 'react';
import { GraduationCap, RotateCcw } from 'lucide-react';
import Spinner from '../ui/Spinner';
import { fetchAvailableQuizzes } from '../../api/quizzes';
import QuizModal from './QuizModal';

/**
 * Dashboard card listing AI quizzes available for the books a reader has finished.
 * Each row launches the quiz; completed ones show the best score and a Retake action.
 * Calls onQuizCompleted() after a successful attempt so the parent can refresh stats.
 */
const QuizzesCard = ({ onQuizCompleted }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // { bookId, title }

  const load = useCallback(() => {
    setLoading(true);
    fetchAvailableQuizzes()
      .then((d) => setItems(d?.quizzes || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCompleted = () => {
    load();
    onQuizCompleted?.();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="text-base font-semibold text-[#1e3a5f] mb-4 flex items-center gap-2">
        <GraduationCap size={18} /> Quizzes
      </h2>

      {loading ? (
        <div className="py-4">
          <Spinner label="Loading quizzes…" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400 py-2">
          Finish a book to unlock an AI quiz on it.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((q) => (
            <li key={q.book_id} className="flex items-center gap-3">
              {q.cover_image_url ? (
                <img
                  src={q.cover_image_url}
                  alt={q.title}
                  className="w-9 h-12 rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-12 rounded bg-slate-100 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 line-clamp-1">{q.title}</p>
                {q.attempted && (
                  <p className="text-xs text-[#5b7c99]">Best score: {q.bestScore} / 100</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActive({ bookId: q.book_id, title: q.title })}
                className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg ${
                  q.attempted
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-[#4f83cc] text-white hover:bg-[#3f6ab0]'
                }`}
              >
                {q.attempted ? (
                  <><RotateCcw size={13} /> Retake</>
                ) : (
                  'Take Quiz'
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {active && (
        <QuizModal
          bookId={active.bookId}
          title={active.title}
          onClose={() => setActive(null)}
          onCompleted={handleCompleted}
        />
      )}
    </div>
  );
};

export default QuizzesCard;
