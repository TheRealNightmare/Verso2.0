import { useEffect, useState } from 'react';
import { X, Award } from 'lucide-react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import { generateQuiz, submitQuiz } from '../../api/quizzes';

/**
 * AI quiz dialog for a completed book. On open it asks the backend to build
 * (or reuse) a 5-question quiz, lets the reader answer, then grades it.
 * Calls onCompleted(result) after a successful submit so the parent can refresh.
 */
const QuizModal = ({ bookId, title, onClose, onCompleted }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    generateQuiz(bookId)
      .then((data) => {
        if (active) setQuiz(data);
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Could not build a quiz right now.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bookId]);

  const questions = quiz?.questions ?? [];
  const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] != null);

  const submit = async () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = questions.map((_, i) => answers[i]);
      const res = await submitQuiz(quiz.quiz_id, payload);
      setResult(res);
      onCompleted?.(res);
    } catch (err) {
      setError(err?.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      label="Book quiz"
      panelClassName="bg-white rounded-2xl shadow-xl max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-base font-semibold text-[#1e3a5f] truncate pr-3">
          Quiz · {quiz?.title || title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quiz"
          className="shrink-0 text-slate-400 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-6 py-5">
        {loading && <Spinner label="Building your quiz…" />}

        {!loading && error && !quiz && (
          <p className="text-sm text-red-500 text-center py-6">{error}</p>
        )}

        {!loading && result && (
          <div className="text-center py-6">
            <Award size={40} className="mx-auto text-[#4f83cc]" />
            <p className="mt-3 text-3xl font-bold text-[#1e3a5f]">
              {result.score}
              <span className="text-base font-medium text-slate-400"> / {result.max}</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {result.correct} of {result.total} correct
              {result.bestScore > result.score ? ` · best ${result.bestScore}` : ''}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#4f83cc] px-4 py-2 text-sm font-medium text-white hover:bg-[#3f6ab0]"
            >
              Done
            </button>
          </div>
        )}

        {!loading && quiz && !result && (
          <div className="space-y-6">
            {questions.map((q, qi) => (
              <fieldset key={qi}>
                <legend className="text-sm font-semibold text-slate-800 mb-2">
                  {qi + 1}. {q.question}
                </legend>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                        answers[qi] === oi
                          ? 'border-[#4f83cc] bg-[#eef4fb] text-[#1e3a5f]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${qi}`}
                        checked={answers[qi] === oi}
                        onChange={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                        className="accent-[#4f83cc]"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="button"
              onClick={submit}
              disabled={!allAnswered || submitting}
              className="w-full rounded-lg bg-[#4f83cc] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#3f6ab0] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting…' : 'Submit answers'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default QuizModal;
