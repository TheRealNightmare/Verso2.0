import React, { useEffect, useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { askGemini } from '../../api/readerAssistant';

// Slide-in panel that lets the reader ask Gemini a custom question about a
// highlighted passage. One-shot: asking again replaces the previous answer.
const GeminiAskPanel = ({ isOpen, onClose, selectedText, bookTitle }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset the conversation whenever the passage changes or the panel closes.
  useEffect(() => {
    setQuestion('');
    setAnswer('');
    setError(null);
    setLoading(false);
  }, [selectedText, isOpen]);

  if (!isOpen) return null;

  const submit = async (e) => {
    e?.preventDefault();
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setAnswer('');
    try {
      const res = await askGemini({ selectedText, question: q, bookTitle });
      setAnswer(res.answer || '');
    } catch (err) {
      setError(
        err?.status === 503
          ? 'The AI assistant is not available right now.'
          : err?.message || 'Could not get an answer. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#b8c5d6] flex flex-col shadow-xl lg:static lg:z-auto lg:w-80 lg:max-w-none lg:shadow-none">
        <div className="flex items-center justify-between px-6 py-5 text-[#2c3e50]">
          <span className="inline-flex items-center gap-1.5 text-lg font-semibold">
            <Sparkles size={18} /> Ask Gemini
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:text-[#5b7c99]"
            aria-label="Close Gemini panel"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-3">
          <p className="rounded-md border-l-2 border-[#5b7c99] bg-white/50 p-2 text-[13px] text-[#2c3e50] leading-snug">
            “{selectedText}”
          </p>

          <form onSubmit={submit} className="flex flex-col gap-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about this text…"
              rows={3}
              className="w-full resize-none rounded-md border border-white/60 bg-white/70 p-2 text-[13px] text-[#2c3e50] placeholder:text-[#2c3e50]/50 focus:border-[#5b7c99] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#5b7c99] px-3 py-2 text-[13px] font-medium text-white hover:bg-[#4a6884] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Asking…
                </>
              ) : (
                <>
                  <Sparkles size={15} /> Ask
                </>
              )}
            </button>
          </form>

          {error && (
            <p className="rounded-md bg-red-50 p-2 text-[13px] text-red-700">{error}</p>
          )}

          {answer && (
            <div className="rounded-md bg-white/70 p-3 text-[13px] text-[#2c3e50] leading-relaxed whitespace-pre-line">
              {answer}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default GeminiAskPanel;
