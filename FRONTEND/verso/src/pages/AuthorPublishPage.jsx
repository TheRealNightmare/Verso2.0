import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { publishBookWithProgress } from '../api/authorBooks';

const MAX_BOOK_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_COVER_BYTES = 5 * 1024 * 1024;  // 5 MB
const formatMB = (b) => (b / 1024 / 1024).toFixed(1);
import { Upload, ImagePlus } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

export default function AuthorPublishPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  usePageTitle('Publish a Book');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [format, setFormat] = useState('txt');
  const [isExclusive, setIsExclusive] = useState(false);
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const coverRef = useRef(null);
  const fileRef = useRef(null);

  if (user && user.role !== 'author') {
    return (
      <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Author access required</h1>
        <p className="text-slate-600">Only author accounts can publish books.</p>
      </div>
    );
  }

  const onCover = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_COVER_BYTES) {
      toast.error(`Cover too large: ${formatMB(f.size)} MB (max 5 MB).`);
      e.target.value = '';
      return;
    }
    setCover(f);
    setCoverPreview(URL.createObjectURL(f));
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_BOOK_BYTES) {
      toast.error(`File too large: ${formatMB(f.size)} MB (max 100 MB).`);
      e.target.value = '';
      return;
    }
    setFile(f);
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (['txt', 'epub', 'pdf'].includes(ext)) setFormat(ext);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!cover || !file) {
      toast.error('Please choose a cover image and a book file.');
      return;
    }
    setSubmitting(true);
    setProgress(0);
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('description', description);
      form.append('genre', genre);
      form.append('format', format);
      form.append('is_exclusive', isExclusive ? '1' : '0');
      form.append('cover', cover);
      form.append('file', file);
      const book = await publishBookWithProgress(form, setProgress);
      toast.success('Book published!');
      navigate(`/book/${book.id}`);
    } catch (err) {
      const msg = err?.errors ? Object.values(err.errors)[0]?.[0] : err?.message;
      toast.error(msg || 'Could not publish book.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5b7c99]/30';

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Publish a Book</h1>
      <p className="text-sm text-slate-500 mb-6">Upload your manuscript (TXT, EPUB, or PDF). We&apos;ll parse it into chapters for readers.</p>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            className="w-44 h-60 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center text-slate-400 hover:border-[#5b7c99]"
          >
            {coverPreview ? (
              <img src={coverPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImagePlus size={32} />
            )}
          </button>
          <input ref={coverRef} type="file" accept="image/*" onChange={onCover} className="hidden" />
          <span className="text-xs text-slate-500">Cover image (required)</span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputCls} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600">Genre</label>
            <input value={genre} onChange={(e) => setGenre(e.target.value)} required placeholder="e.g. Fantasy, Memoir" className={inputCls} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} className={inputCls} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600">Book file</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg hover:border-[#5b7c99] text-slate-700"
            >
              <Upload size={18} />
              <span className="truncate">{file ? file.name : 'Choose TXT, EPUB, or PDF'}</span>
            </button>
            <input ref={fileRef} type="file" accept=".txt,.epub,.pdf" onChange={onFile} className="hidden" />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-600">Format</label>
            {['txt', 'epub', 'pdf'].map((f) => (
              <label key={f} className="flex items-center gap-1 text-sm text-slate-700">
                <input type="radio" name="format" value={f} checked={format === f} onChange={() => setFormat(f)} />
                <span className="uppercase">{f}</span>
              </label>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isExclusive} onChange={(e) => setIsExclusive(e.target.checked)} />
            Mark as exclusive
          </label>

          {submitting && (
            <div className="flex flex-col gap-1">
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#5b7c99] transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">
                {progress < 100 ? `Uploading… ${progress}%` : 'Parsing on server…'}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto px-6 py-3 rounded-lg bg-[#5b7c99] text-white font-medium hover:bg-[#4a6a85] disabled:opacity-60"
          >
            {submitting ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}
