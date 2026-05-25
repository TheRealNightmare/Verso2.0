import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchUploads } from '../api/uploads';
import { getFile, putFile, sha256Hex } from '../lib/uploadStore';
import { saveHistory } from '../api/history';
import Spinner from '../components/ui/Spinner';
import usePageTitle from '../hooks/usePageTitle';

const CHARS_PER_PAGE = 1800;

function paginateText(text) {
  const cleaned = (text || '').replace(/\r\n/g, '\n').trim();
  const pages = [];
  for (let i = 0; i < cleaned.length; i += CHARS_PER_PAGE) {
    pages.push(cleaned.slice(i, i + CHARS_PER_PAGE));
  }
  return pages.length ? pages : [''];
}

const UploadReadingPage = () => {
  const navigate = useNavigate();
  const { uploadId } = useParams();

  const [upload, setUpload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsReupload, setNeedsReupload] = useState(false);
  usePageTitle(upload?.title || 'Reading');

  const [textPages, setTextPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  const [epubRendition, setEpubRendition] = useState(null);
  const [epubLoc, setEpubLoc] = useState({ current: 1, total: 1 });
  const epubViewerRef = useRef(null);

  const [pdfDoc, setPdfDoc] = useState(null);
  const pdfCanvasRef = useRef(null);

  const fileInputRef = useRef(null);
  const lastProgressRef = useRef(-1);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNeedsReupload(false);

    (async () => {
      try {
        const uploads = await fetchUploads();
        if (cancelled) return;
        const meta = uploads.find((u) => String(u.id) === String(uploadId));
        if (!meta) {
          setError('Upload not found.');
          setLoading(false);
          return;
        }
        setUpload(meta);

        const blob = await getFile(meta.file_hash);
        if (cancelled) return;

        if (!blob) {
          setNeedsReupload(true);
          setLoading(false);
          return;
        }

        await renderForFormat(meta, blob);
      } catch (err) {
        if (cancelled) return;
        if (err?.status === 401) {
          navigate('/login');
          return;
        }
        setError(err?.message || 'Failed to load book.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [uploadId, navigate]);

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (epubRendition) {
      try { epubRendition.destroy(); } catch { /* ignore */ }
    }
  }, [epubRendition]);

  const renderForFormat = async (meta, blob) => {
    if (meta.format === 'txt') {
      const text = await blob.text();
      setTextPages(paginateText(text));
      setCurrentPage(0);
    } else if (meta.format === 'epub') {
      const ePub = (await import('epubjs')).default;
      const buf = await blob.arrayBuffer();
      const book = ePub(buf);
      const rendition = book.renderTo(epubViewerRef.current, {
        width: '100%',
        height: '100%',
        spread: 'auto', // single page on narrow screens, two-page spread when wide
      });
      await rendition.display();
      await book.locations.generate(1600);
      rendition.on('relocated', (loc) => {
        const cur = loc?.start?.location ?? 1;
        const total = book.locations.length() || 1;
        setEpubLoc({ current: cur, total });
        const progress = Math.max(0, Math.min(100, Math.round((cur / total) * 100)));
        queueProgress(meta.id, progress);
      });
      setEpubRendition(rendition);
    } else if (meta.format === 'pdf') {
      const pdfjs = await import('pdfjs-dist');
      const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      const buf = await blob.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buf }).promise;
      setPdfDoc(doc);
      setCurrentPage(0);
    }
  };

  useEffect(() => {
    if (!pdfDoc || !pdfCanvasRef.current) return;
    let cancelled = false;
    (async () => {
      const page = await pdfDoc.getPage(currentPage + 1);
      if (cancelled) return;
      const viewport = page.getViewport({ scale: 1.4 });
      const canvas = pdfCanvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const progress = Math.max(0, Math.min(100, Math.round(((currentPage + 1) / pdfDoc.numPages) * 100)));
      queueProgress(upload?.id, progress);
    })().catch(console.error);
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, upload?.id]);

  useEffect(() => {
    if (!textPages || !upload) return;
    const progress = Math.max(0, Math.min(100, Math.round(((currentPage + 1) / textPages.length) * 100)));
    queueProgress(upload.id, progress);
  }, [textPages, currentPage, upload]);

  const queueProgress = (id, progress) => {
    if (!id || progress === lastProgressRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      lastProgressRef.current = progress;
      saveHistory({ uploadId: id, progress }).catch(console.error);
    }, 800);
  };

  const handleReupload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !upload) return;

    const buf = await file.arrayBuffer();
    const hash = await sha256Hex(buf);
    if (hash !== upload.file_hash) {
      setError('That file does not match this upload (hash differs).');
      return;
    }
    await putFile(hash, file);
    setNeedsReupload(false);
    setLoading(true);
    try {
      await renderForFormat(upload, file);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-6 text-sm text-gray-500">
        <Spinner label="Loading book…" />
      </div>
    );
  }
  if (error) return <p className="px-6 py-6 text-sm text-red-600">{error}</p>;

  if (needsReupload) {
    return (
      <div className="px-6 py-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-[#2c3e50] hover:text-[#5b7c99] mb-4"
        >
          <ChevronLeft size={18} /> Back
        </button>
        <h2 className="text-lg font-semibold text-[#2c3e50] mb-2">{upload?.title}</h2>
        <p className="text-sm text-slate-600 mb-4">
          This book isn't on this device. Pick the same file again to read it here.
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700"
        >
          Re-add file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={`.${upload?.format || ''}`}
          className="hidden"
          onChange={handleReupload}
        />
      </div>
    );
  }

  const renderHeader = (centerLabel, footerLabel) => (
    <>
      <header className="grid grid-cols-3 items-center px-4 sm:px-8 py-3 sm:py-5 bg-[#f8f6f2]">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-[#2c3e50] hover:text-[#5b7c99] justify-self-start"
        >
          <ChevronLeft size={18} /> <span className="hidden sm:inline">Back</span>
        </button>
        <div className="text-center min-w-0 px-2">
          <h2 className="text-sm sm:text-lg font-semibold text-[#2c3e50] truncate">{upload?.title}</h2>
          <h3 className="text-[10px] sm:text-xs uppercase tracking-wider text-[#2c3e50]/60">{centerLabel}</h3>
        </div>
        <div />
      </header>
      <footer className="flex items-center justify-center py-3 sm:py-4 text-sm font-semibold text-[#2c3e50] bg-[#f8f6f2]">
        {footerLabel}
      </footer>
    </>
  );

  if (upload?.format === 'txt' && textPages) {
    const pageText = textPages[currentPage] || '';
    return (
      <div className="flex flex-col h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] -m-3 sm:-m-4 lg:-m-6 bg-[#f8f6f2]">
        {renderHeader(`Plain text (${upload.format})`, `${currentPage + 1}/${textPages.length}`)}
        <main className="relative flex-1 flex items-center px-3 sm:px-12 lg:px-16 py-4 sm:py-6 overflow-hidden">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage <= 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-[#2c3e50] hover:text-[#5b7c99] bg-[#f8f6f2]/80 rounded-full z-10 disabled:opacity-30"
          >
            <ChevronLeft size={32} strokeWidth={1.5} />
          </button>
          <div className="flex-1 h-full overflow-y-auto px-2 sm:px-4">
            <p className="whitespace-pre-line text-[15px] leading-7 sm:text-[13px] sm:leading-relaxed text-[#2c3e50]/80">
              {pageText}
            </p>
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(textPages.length - 1, p + 1))}
            disabled={currentPage >= textPages.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#2c3e50] hover:text-[#5b7c99] bg-[#f8f6f2]/80 rounded-full z-10 disabled:opacity-30"
          >
            <ChevronRight size={32} strokeWidth={1.5} />
          </button>
        </main>
      </div>
    );
  }

  if (upload?.format === 'epub') {
    return (
      <div className="flex flex-col h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] -m-3 sm:-m-4 lg:-m-6 bg-[#f8f6f2]">
        {renderHeader('EPUB', `${epubLoc.current}/${epubLoc.total}`)}
        <main className="relative flex-1 flex items-center px-3 sm:px-12 lg:px-16 py-4 sm:py-6 overflow-hidden">
          <button
            onClick={() => epubRendition?.prev()}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-[#2c3e50] hover:text-[#5b7c99] bg-[#f8f6f2]/80 rounded-full z-10"
          >
            <ChevronLeft size={32} strokeWidth={1.5} />
          </button>
          <div ref={epubViewerRef} className="flex-1 h-full" />
          <button
            onClick={() => epubRendition?.next()}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#2c3e50] hover:text-[#5b7c99] bg-[#f8f6f2]/80 rounded-full z-10"
          >
            <ChevronRight size={32} strokeWidth={1.5} />
          </button>
        </main>
      </div>
    );
  }

  if (upload?.format === 'pdf' && pdfDoc) {
    return (
      <div className="flex flex-col h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] -m-3 sm:-m-4 lg:-m-6 bg-[#f8f6f2]">
        {renderHeader('PDF', `${currentPage + 1}/${pdfDoc.numPages}`)}
        <main className="relative flex-1 flex items-center justify-center px-3 sm:px-12 lg:px-16 py-4 sm:py-6 overflow-auto">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage <= 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-[#2c3e50] hover:text-[#5b7c99] bg-[#f8f6f2]/80 rounded-full z-10 disabled:opacity-30"
          >
            <ChevronLeft size={32} strokeWidth={1.5} />
          </button>
          <canvas ref={pdfCanvasRef} className="shadow-md bg-white max-w-full h-auto" />
          <button
            onClick={() => setCurrentPage((p) => Math.min(pdfDoc.numPages - 1, p + 1))}
            disabled={currentPage >= pdfDoc.numPages - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#2c3e50] hover:text-[#5b7c99] bg-[#f8f6f2]/80 rounded-full z-10 disabled:opacity-30"
          >
            <ChevronRight size={32} strokeWidth={1.5} />
          </button>
        </main>
      </div>
    );
  }

  return <p className="px-6 py-6 text-sm text-gray-500">Preparing reader...</p>;
};

export default UploadReadingPage;
