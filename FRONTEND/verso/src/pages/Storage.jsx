import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Plus, BookOpen } from 'lucide-react';
import { fetchBookmarks, removeBookmark } from '../api/bookmarks';
import { fetchUploads, registerUpload, removeUpload } from '../api/uploads';
import { putFile, deleteFile, sha256Hex } from '../lib/uploadStore';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import usePageTitle from '../hooks/usePageTitle';

const ACCEPTED_EXTENSIONS = { txt: 'txt', epub: 'epub', pdf: 'pdf' };
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const Storage = () => {
  const [tab, setTab] = useState('uploads');
  usePageTitle('Storage');

  return (
    <div className="px-2">
      <h2 className="text-2xl font-bold text-slate-800 mb-4 tracking-wide">STORAGE</h2>

      <div className="flex gap-2 border-b border-slate-200 mb-6">
        <TabButton active={tab === 'uploads'} onClick={() => setTab('uploads')}>
          My Uploads
        </TabButton>
        <TabButton active={tab === 'bookmarks'} onClick={() => setTab('bookmarks')}>
          Bookmarks
        </TabButton>
      </div>

      {tab === 'uploads' ? <UploadsTab /> : <BookmarksTab />}
    </div>
  );
};

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
        active
          ? 'border-slate-800 text-slate-800'
          : 'border-transparent text-slate-400 hover:text-slate-600'
      }`}
    >
      {children}
    </button>
  );
}

function UploadsTab() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchUploads()
      .then(setUploads)
      .catch((e) => setError(e.message || 'Failed to load uploads'))
      .finally(() => setLoading(false));
  }, []);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const format = ACCEPTED_EXTENSIONS[ext];
    if (!format) {
      setError('Unsupported file type. Use .txt, .epub, or .pdf.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large (max 100 MB).');
      return;
    }

    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const hash = await sha256Hex(buf);
      await putFile(hash, file);
      const title = file.name.replace(/\.[^.]+$/, '');
      const row = await registerUpload({
        title,
        author: null,
        format,
        file_hash: hash,
        file_size: file.size,
      });
      setUploads((prev) => {
        if (prev.some((u) => u.id === row.id)) return prev;
        return [row, ...prev];
      });
      toast.success(`"${title}" added to your library`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to add book.');
      toast.error(err.message || 'Failed to add book.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (upload) => {
    const ok = await confirm({
      title: 'Delete this book?',
      message: `"${upload.title}" will be removed from your library. This can't be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await removeUpload(upload.id);
      await deleteFile(upload.file_hash);
      setUploads((prev) => prev.filter((u) => u.id !== upload.id));
      toast.success(`"${upload.title}" deleted`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete book.');
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-slate-400">
        <Spinner label="Loading uploads…" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={handlePick}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 disabled:opacity-60"
        >
          <Plus size={16} /> {busy ? 'Adding...' : 'Add book from device'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.epub,.pdf"
          className="hidden"
          onChange={handleFile}
        />
        <span className="text-xs text-slate-400">Supported: .txt, .epub, .pdf (max 100 MB)</span>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {uploads.length === 0 ? (
        <p className="text-slate-400 py-4">No uploaded books yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-5">
          {uploads.map((u) => (
            <div key={u.id} className="flex flex-col">
              <div className="relative group">
                <Link to={`/reading/upload/${u.id}`}>
                  <div className="w-full h-56 rounded-md shadow-md bg-linear-to-br from-slate-200 to-slate-400 flex items-center justify-center">
                    <BookOpen size={40} className="text-white/80" />
                    <span className="absolute bottom-2 right-2 text-[10px] uppercase font-bold text-white/90 bg-black/40 rounded px-1.5 py-0.5">
                      {u.format}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemove(u)}
                  aria-label={`Delete ${u.title}`}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center"
                >
                  <X size={14} color="#fff" />
                </button>
              </div>
              <div className="mt-2">
                <h4 className="text-sm font-medium text-slate-800 truncate">{u.title}</h4>
                <p className="text-xs text-slate-500 truncate">{u.author || 'Unknown author'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BookmarksTab() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchBookmarks()
      .then(setBooks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (book) => {
    const ok = await confirm({
      title: 'Remove bookmark?',
      message: `"${book.title}" will be removed from your bookmarks.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    try {
      await removeBookmark(book.id);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
      toast.success('Bookmark removed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove bookmark.');
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-slate-400">
        <Spinner label="Loading bookmarks…" />
      </div>
    );
  }
  if (books.length === 0) return <p className="text-slate-400 py-4">No saved books yet.</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-5">
      {books.map((book) => (
        <div key={book.id} className="flex flex-col">
          <div className="relative group">
            <Link to={`/book/${book.id}`}>
              <img
                src={book.cover_image_url || 'https://via.placeholder.com/150x225'}
                alt={book.title}
                className="w-full h-56 object-cover rounded-md shadow-md"
              />
            </Link>
            <button
              onClick={() => handleRemove(book)}
              aria-label={`Remove bookmark for ${book.title}`}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center"
            >
              <X size={14} color="#fff" />
            </button>
          </div>
          <div className="mt-2">
            <h4 className="text-sm font-medium text-slate-800 truncate">{book.title}</h4>
            <p className="text-xs text-slate-500 truncate">{book.author}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Storage;
