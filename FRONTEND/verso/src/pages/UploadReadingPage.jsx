import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, NotebookText, Settings2 } from 'lucide-react';
import 'pdfjs-dist/web/pdf_viewer.css';
import { fetchUploads } from '../api/uploads';
import { getFile, putFile, sha256Hex } from '../lib/uploadStore';
import { saveHistory, fetchHistoryEntry } from '../api/history';
import {
  fetchUploadAnnotations,
  createUploadAnnotation,
  updateAnnotation,
  deleteAnnotation,
} from '../api/annotations';
import Spinner from '../components/ui/Spinner';
import usePageTitle from '../hooks/usePageTitle';
import useReadingSession from '../hooks/useReadingSession';
import AnnotationToolbar from '../components/reader/AnnotationToolbar';
import AnnotationSidebar from '../components/reader/AnnotationSidebar';
import NoteEditorModal from '../components/reader/NoteEditorModal';
import ReaderSettingsPanel from '../components/reader/ReaderSettingsPanel';
import GeminiAskPanel from '../components/reader/GeminiAskPanel';
import { getTextOffset, renderWithHighlights } from '../components/reader/textHighlight';
import { DEFAULT_HIGHLIGHT_COLOR } from '../components/reader/annotationColors';
import { useReaderSettings } from '../context/ReaderSettingsContext';
import { getThemeColors } from '../components/reader/readerThemes';

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

  // Track time spent reading this upload so the dashboard can report it.
  useReadingSession({ uploadId: upload?.id ?? null });

  const [error, setError] = useState(null);
  const [needsReupload, setNeedsReupload] = useState(false);
  usePageTitle(upload?.title || 'Reading');

  const [textPages, setTextPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const txtTextRef = useRef(null);

  const [epubRendition, setEpubRendition] = useState(null);
  const [epubLoc, setEpubLoc] = useState({ current: 1, total: 1 });
  const [epubBlob, setEpubBlob] = useState(null);
  const epubViewerRef = useRef(null);
  const epubBootStartedRef = useRef(false);
  const epubAppliedAnnsRef = useRef(new Map());

  const [pdfDoc, setPdfDoc] = useState(null);
  const pdfCanvasRef = useRef(null);
  const pdfTextLayerRef = useRef(null);
  const pdfHighlightsRef = useRef(null);
  const pdfPageWrapRef = useRef(null);
  const pdfjsModuleRef = useRef(null);

  const fileInputRef = useRef(null);
  const lastProgressRef = useRef(-1);
  const saveTimerRef = useRef(null);
  const restoredRef = useRef(false);
  const pendingResumeRef = useRef(null);

  // Annotation state
  const [annotations, setAnnotations] = useState([]);
  const [selectionInfo, setSelectionInfo] = useState(null); // { rect, payload }
  const [editingAnn, setEditingAnn] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [geminiText, setGeminiText] = useState(null); // highlighted text being asked about

  // Reader appearance + ambient audio settings (font size, theme, ASMR).
  const { fontScale, theme, bgColor, textColor } = useReaderSettings();
  const { bg, text } = getThemeColors({ theme, bgColor, textColor });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNeedsReupload(false);
    setEpubBlob(null);
    setEpubRendition(null);
    epubBootStartedRef.current = false;
    restoredRef.current = false;
    pendingResumeRef.current = null;

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

        const historyEntry = await fetchHistoryEntry({ uploadId: meta.id }).catch(() => null);
        if (cancelled) return;
        const savedPage = Number(historyEntry?.current_page);
        if (Number.isFinite(savedPage) && savedPage > 0) {
          pendingResumeRef.current = savedPage;
        } else {
          restoredRef.current = true;
        }

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

  // Load annotations once upload is known
  useEffect(() => {
    if (!upload?.id) return;
    let cancelled = false;
    fetchUploadAnnotations(upload.id)
      .then((rows) => { if (!cancelled) setAnnotations(rows || []); })
      .catch((err) => console.error('Failed to load annotations', err));
    return () => { cancelled = true; };
  }, [upload?.id]);

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (epubRendition) {
      try { epubRendition.destroy(); } catch { /* ignore */ }
      epubBootStartedRef.current = false;
      epubAppliedAnnsRef.current = new Map();
    }
  }, [epubRendition]);

  const renderForFormat = async (meta, blob) => {
    if (meta.format === 'txt') {
      const text = await blob.text();
      const pages = paginateText(text);
      setTextPages(pages);
      const resumeAt = pendingResumeRef.current;
      const startPage = (resumeAt != null)
        ? Math.max(0, Math.min(resumeAt, pages.length - 1))
        : 0;
      setCurrentPage(startPage);
      restoredRef.current = true;
      pendingResumeRef.current = null;
    } else if (meta.format === 'epub') {
      setEpubBlob(blob);
      // EPUB navigates by CFI, not page index — skip resume for this format.
      restoredRef.current = true;
      pendingResumeRef.current = null;
    } else if (meta.format === 'pdf') {
      const pdfjs = await import('pdfjs-dist');
      const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      pdfjsModuleRef.current = pdfjs;
      const buf = await blob.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buf }).promise;
      setPdfDoc(doc);
      const resumeAt = pendingResumeRef.current;
      const startPage = (resumeAt != null)
        ? Math.max(0, Math.min(resumeAt, doc.numPages - 1))
        : 0;
      setCurrentPage(startPage);
      restoredRef.current = true;
      pendingResumeRef.current = null;
    }
  };

  // ---------------- EPUB ----------------

  useEffect(() => {
    if (upload?.format !== 'epub' || !epubBlob || !epubViewerRef.current) return;
    if (epubBootStartedRef.current) return;
    epubBootStartedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const ePub = (await import('epubjs')).default;
        const buf = await epubBlob.arrayBuffer();
        if (cancelled) return;
        const book = ePub(buf);
        const rendition = book.renderTo(epubViewerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none',
        });
        await rendition.display();
        if (cancelled) return;
        rendition.on('relocated', (loc) => {
          const cfi = loc?.start?.cfi;
          const total = book.locations.length() || 0;
          let cur = 1;
          if (cfi && total > 0) {
            const pct = book.locations.percentageFromCfi(cfi);
            cur = Math.max(1, Math.min(total, Math.round(pct * total) || 1));
          }
          setEpubLoc((prev) => ({
            current: cur,
            total: total > 0 ? total : prev.total,
          }));
          const denom = Math.max(1, (total || 1) - 1);
          const progress = Math.max(0, Math.min(100, Math.round(((cur - 1) / denom) * 100)));
          queueProgress(upload.id, progress);
        });
        rendition.book = book;
        setEpubRendition(rendition);

        // Generate locations in the background so first paint isn't blocked.
        book.locations.generate(1600).then(() => {
          if (cancelled) return;
          const total = book.locations.length() || 1;
          setEpubLoc((prev) => ({ ...prev, total }));
        }).catch((err) => {
          console.warn('EPUB locations.generate failed', err);
        });
      } catch (err) {
        if (!cancelled) {
          epubBootStartedRef.current = false;
          setError(err?.message || 'Failed to render EPUB.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [upload?.format, upload?.id, epubBlob]);

  // Hook up EPUB selection -> toolbar
  useEffect(() => {
    if (!epubRendition) return;
    const onSelected = (cfiRange, contents) => {
      try {
        const sel = contents.window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const text = range.toString().trim();
        if (!text) return;
        const innerRect = range.getBoundingClientRect();
        const iframeEl = contents.window.frameElement;
        const iframeRect = iframeEl?.getBoundingClientRect() || { top: 0, left: 0 };
        const rect = {
          top: innerRect.top + iframeRect.top,
          left: innerRect.left + iframeRect.left,
          width: innerRect.width,
          height: innerRect.height,
        };
        setSelectionInfo({
          rect,
          payload: {
            selected_text: text,
            location: { type: 'epub', cfiRange },
          },
          source: 'epub',
          contents,
        });
      } catch (err) {
        console.error('EPUB selection error', err);
      }
    };
    epubRendition.on('selected', onSelected);
    return () => {
      try { epubRendition.off('selected', onSelected); } catch { /* ignore */ }
    };
  }, [epubRendition]);

  // Render existing EPUB highlights (idempotent diff against currently-applied set)
  useEffect(() => {
    if (!epubRendition) return;
    const applied = epubAppliedAnnsRef.current;
    const wanted = new Map(
      annotations
        .filter((a) => a.location?.type === 'epub' && a.location.cfiRange)
        .map((a) => [a.id, a])
    );

    for (const [id, cfi] of applied) {
      if (!wanted.has(id)) {
        try { epubRendition.annotations.remove(cfi, 'highlight'); } catch { /* ignore */ }
        applied.delete(id);
      }
    }

    for (const [id, a] of wanted) {
      if (applied.has(id)) continue;
      try {
        epubRendition.annotations.add(
          'highlight',
          a.location.cfiRange,
          { id },
          () => openEditor(a),
          `hl-${id}`,
          { fill: a.color || DEFAULT_HIGHLIGHT_COLOR, 'fill-opacity': '0.4', 'mix-blend-mode': 'multiply' }
        );
        applied.set(id, a.location.cfiRange);
      } catch (err) {
        console.error('EPUB highlight add failed', err);
      }
    }
  }, [epubRendition, annotations]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply font size + theme colours to the EPUB rendition.
  useEffect(() => {
    if (!epubRendition) return;
    try {
      epubRendition.themes.fontSize(`${Math.round(fontScale * 100)}%`);
      epubRendition.themes.override('color', text);
      epubRendition.themes.override('background', bg);
    } catch (err) {
      console.warn('Failed to apply EPUB theme', err);
    }
  }, [epubRendition, fontScale, bg, text]);

  // ---------------- PDF ----------------

  useEffect(() => {
    if (!pdfDoc || !pdfCanvasRef.current) return;
    let cancelled = false;
    (async () => {
      const pdfjs = pdfjsModuleRef.current;
      const page = await pdfDoc.getPage(currentPage + 1);
      if (cancelled) return;
      const viewport = page.getViewport({ scale: 1.4 * fontScale });
      const canvas = pdfCanvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      if (cancelled) return;

      // Size the page wrapper to match the canvas
      if (pdfPageWrapRef.current) {
        pdfPageWrapRef.current.style.width = viewport.width + 'px';
        pdfPageWrapRef.current.style.height = viewport.height + 'px';
      }

      // Render text layer for selection
      const textLayerDiv = pdfTextLayerRef.current;
      if (textLayerDiv && pdfjs?.TextLayer) {
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.setProperty('--scale-factor', String(viewport.scale));
        textLayerDiv.style.width = viewport.width + 'px';
        textLayerDiv.style.height = viewport.height + 'px';
        try {
          const textContent = await page.getTextContent();
          if (cancelled) return;
          const textLayer = new pdfjs.TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport,
          });
          await textLayer.render();
        } catch (err) {
          console.error('Text layer render failed', err);
        }
      }

      const denom = Math.max(1, pdfDoc.numPages - 1);
      const progress = Math.max(0, Math.min(100, Math.round((currentPage / denom) * 100)));
      queueProgress(upload?.id, progress, currentPage);
    })().catch(console.error);
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, upload?.id, fontScale]);

  // PDF text-selection handler
  const handlePdfMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setSelectionInfo(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const text = range.toString().trim();
    if (!text) {
      setSelectionInfo(null);
      return;
    }
    const container = pdfTextLayerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const w = containerRect.width;
    const h = containerRect.height;
    const rects = Array.from(range.getClientRects())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({
        x: (r.left - containerRect.left) / w,
        y: (r.top - containerRect.top) / h,
        w: r.width / w,
        h: r.height / h,
      }));
    if (rects.length === 0) {
      setSelectionInfo(null);
      return;
    }
    const bRect = range.getBoundingClientRect();
    setSelectionInfo({
      rect: { top: bRect.top, left: bRect.left, width: bRect.width, height: bRect.height },
      payload: {
        selected_text: text,
        location: {
          type: 'pdf',
          page: currentPage + 1,
          quads: rects,
        },
      },
      source: 'pdf',
    });
  }, [currentPage]);

  // TXT text-selection handler (offset-based, single column, per page)
  const handleTxtMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setSelectionInfo(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rootEl = txtTextRef.current;
    if (!rootEl || !rootEl.contains(range.commonAncestorContainer)) {
      setSelectionInfo(null);
      return;
    }
    let start = getTextOffset(rootEl, range.startContainer, range.startOffset);
    let end = getTextOffset(rootEl, range.endContainer, range.endOffset);
    if (start > end) [start, end] = [end, start];
    const fullText = (textPages && textPages[currentPage]) || '';
    const text = fullText.slice(start, end).trim();
    if (!text || end <= start) {
      setSelectionInfo(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    setSelectionInfo({
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      payload: {
        selected_text: text,
        location: { type: 'txt', page: currentPage, start, end },
      },
      source: 'txt',
    });
  };

  // ---------------- Save / edit / delete ----------------

  const persistCreate = async (payload, openNote = false) => {
    const cfiBefore =
      payload.location?.type === 'epub'
        ? epubRendition?.currentLocation()?.start?.cfi
        : null;
    try {
      const created = await createUploadAnnotation(upload.id, payload);
      setAnnotations((prev) => [...prev, created]);
      // Clear selection
      try { window.getSelection()?.removeAllRanges(); } catch { /* ignore */ }
      setSelectionInfo(null);
      if (cfiBefore && epubRendition) {
        requestAnimationFrame(() => {
          try { epubRendition.display(cfiBefore); } catch { /* ignore */ }
        });
      }
      if (openNote) openEditor(created);
    } catch (err) {
      console.error('Failed to save annotation', err);
      setError(err?.message || 'Failed to save annotation');
    }
  };

  const createHighlight = (color, openNote = false) => {
    if (!selectionInfo) return;
    persistCreate({ ...selectionInfo.payload, color }, openNote);
  };

  const openEditor = (ann) => {
    setEditingAnn(ann);
    setNoteDraft(ann.note || '');
  };

  const saveNote = async () => {
    if (!editingAnn) return;
    try {
      const updated = await updateAnnotation(editingAnn.id, { note: noteDraft });
      setAnnotations((prev) => prev.map((a) => (a.id === editingAnn.id ? { ...a, ...updated } : a)));
      setEditingAnn(null);
      setNoteDraft('');
    } catch (err) {
      console.error('Failed to save note', err);
    }
  };

  const removeAnnotation = async (annId) => {
    const target = annotations.find((a) => a.id === annId);
    try {
      await deleteAnnotation(annId);
    } catch (err) {
      console.error('Failed to delete annotation', err);
    }
    setAnnotations((prev) => prev.filter((a) => a.id !== annId));
    if (editingAnn?.id === annId) setEditingAnn(null);
    // Remove EPUB visual highlight
    if (target && target.location?.type === 'epub' && epubRendition) {
      try { epubRendition.annotations.remove(target.location.cfiRange, 'highlight'); } catch { /* ignore */ }
    }
  };

  const jumpToAnnotation = (ann) => {
    const loc = ann.location;
    if (!loc) return;
    if (loc.type === 'pdf' && pdfDoc) {
      setCurrentPage(Math.max(0, Math.min(pdfDoc.numPages - 1, loc.page - 1)));
    } else if (loc.type === 'epub' && epubRendition && loc.cfiRange) {
      try { epubRendition.display(loc.cfiRange); } catch { /* ignore */ }
    } else if (loc.type === 'txt' && textPages) {
      setCurrentPage(Math.max(0, Math.min(textPages.length - 1, loc.page)));
    }
    setIsSidebarOpen(false);
  };

  const locationLabel = (ann) => {
    if (ann.location?.type === 'pdf') return `Page ${ann.location.page}`;
    if (ann.location?.type === 'epub') return 'EPUB';
    if (ann.location?.type === 'txt') return `Page ${ann.location.page + 1}`;
    return '';
  };

  // ---------------- Misc ----------------

  useEffect(() => {
    if (!textPages || !upload) return;
    const denom = Math.max(1, textPages.length - 1);
    const progress = Math.max(0, Math.min(100, Math.round((currentPage / denom) * 100)));
    queueProgress(upload.id, progress, currentPage);
  }, [textPages, currentPage, upload]);

  const queueProgress = (id, progress, pageIndex = null) => {
    if (!id || progress === lastProgressRef.current) return;
    if (!restoredRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      lastProgressRef.current = progress;
      saveHistory({ uploadId: id, progress, currentPage: pageIndex }).catch(console.error);
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

  const supportsAnnotations =
    upload?.format === 'pdf' || upload?.format === 'epub' || upload?.format === 'txt';

  const renderHeader = (centerLabel, footerLabel) => (
    <>
      <header className="grid grid-cols-3 items-center px-4 sm:px-8 py-3 sm:py-5">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-current hover:text-[#5b7c99] justify-self-start"
        >
          <ChevronLeft size={18} /> <span className="hidden sm:inline">Back</span>
        </button>
        <div className="text-center min-w-0 px-2">
          <h2 className="text-sm sm:text-lg font-semibold text-current truncate">{upload?.title}</h2>
          <h3 className="text-[10px] sm:text-xs uppercase tracking-wider text-current opacity-60">{centerLabel}</h3>
        </div>
        <div className="justify-self-end flex items-center gap-3">
          {supportsAnnotations && (
            <button
              onClick={() => setIsSidebarOpen((o) => !o)}
              className={`inline-flex items-center gap-1 text-sm ${isSidebarOpen ? 'text-[#5b7c99]' : 'text-current hover:text-[#5b7c99]'}`}
              aria-label="Toggle annotations"
            >
              <NotebookText size={20} />
            </button>
          )}
          <button
            onClick={() => setIsSettingsOpen((o) => !o)}
            className={`inline-flex items-center gap-1 text-sm ${isSettingsOpen ? 'text-[#5b7c99]' : 'text-current hover:text-[#5b7c99]'}`}
            aria-label="Reading settings"
          >
            <Settings2 size={20} />
          </button>
        </div>
      </header>
      <footer className="flex items-center justify-center py-3 sm:py-4 text-sm font-semibold text-current">
        {footerLabel}
      </footer>
    </>
  );

  const annotationChrome = (
    <>
      <AnnotationToolbar
        rect={selectionInfo?.rect}
        onColor={(c) => createHighlight(c)}
        onNote={(c) => createHighlight(c, true)}
        onAskGemini={() => {
          setGeminiText(selectionInfo.payload.selected_text);
          try { window.getSelection()?.removeAllRanges(); } catch { /* ignore */ }
          setSelectionInfo(null);
        }}
      />
      <AnnotationSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        annotations={annotations}
        getLocationLabel={locationLabel}
        onJump={jumpToAnnotation}
        onEdit={openEditor}
        onDelete={removeAnnotation}
      />
      <NoteEditorModal
        ann={editingAnn}
        draft={noteDraft}
        onDraftChange={setNoteDraft}
        onSave={saveNote}
        onDelete={removeAnnotation}
        onClose={() => setEditingAnn(null)}
      />
      <ReaderSettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <GeminiAskPanel
        isOpen={!!geminiText}
        selectedText={geminiText}
        bookTitle={upload?.title}
        onClose={() => setGeminiText(null)}
      />
    </>
  );

  if (upload?.format === 'txt' && textPages) {
    const pageText = textPages[currentPage] || '';
    const txtAnns = annotations.filter(
      (a) => a.location?.type === 'txt' && a.location.page === currentPage
    );
    return (
      <div
        className="flex h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] -m-3 sm:-m-4 lg:-m-6"
        style={{ backgroundColor: bg, color: text }}
      >
        <div className="flex flex-col flex-1 min-w-0">
          {renderHeader(`Plain text (${upload.format})`, `${currentPage + 1}/${textPages.length}`)}
          <main className="relative flex-1 flex items-center px-3 sm:px-12 lg:px-16 py-4 sm:py-6 overflow-hidden">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage <= 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-current hover:text-[#5b7c99] bg-black/5 rounded-full z-10 disabled:opacity-30"
            >
              <ChevronLeft size={32} strokeWidth={1.5} />
            </button>
            <div className="flex-1 h-full overflow-y-auto px-2 sm:px-4">
              <p
                ref={txtTextRef}
                onMouseUp={handleTxtMouseUp}
                className="whitespace-pre-line text-current"
                style={{ fontSize: `${15 * fontScale}px`, lineHeight: 1.8 }}
              >
                {renderWithHighlights(pageText, txtAnns, openEditor)}
              </p>
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(textPages.length - 1, p + 1))}
              disabled={currentPage >= textPages.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-current hover:text-[#5b7c99] bg-black/5 rounded-full z-10 disabled:opacity-30"
            >
              <ChevronRight size={32} strokeWidth={1.5} />
            </button>
          </main>
        </div>
        {annotationChrome}
      </div>
    );
  }

  if (upload?.format === 'epub') {
    return (
      <div
        className="flex h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] -m-3 sm:-m-4 lg:-m-6"
        style={{ backgroundColor: bg, color: text }}
      >
        <div className="flex flex-col flex-1 min-w-0">
          {renderHeader('EPUB', `${epubLoc.current}/${epubLoc.total}`)}
          <main className="relative flex-1 flex items-stretch justify-center px-3 sm:px-8 lg:px-12 py-4 sm:py-6 overflow-hidden">
            <button
              onClick={() => epubRendition?.prev()}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-current hover:text-[#5b7c99] bg-black/5 rounded-full z-10"
            >
              <ChevronLeft size={32} strokeWidth={1.5} />
            </button>
            <div className="w-full max-w-205 h-full">
              <div ref={epubViewerRef} className="w-full h-full" />
            </div>
            <button
              onClick={() => epubRendition?.next()}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-current hover:text-[#5b7c99] bg-black/5 rounded-full z-10"
            >
              <ChevronRight size={32} strokeWidth={1.5} />
            </button>
          </main>
        </div>
        {annotationChrome}
      </div>
    );
  }

  if (upload?.format === 'pdf' && pdfDoc) {
    const currentPageHighlights = annotations.filter(
      (a) => a.location?.type === 'pdf' && a.location.page === currentPage + 1
    );
    return (
      <div
        className="flex h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] -m-3 sm:-m-4 lg:-m-6"
        style={{ backgroundColor: bg, color: text }}
      >
        <div className="flex flex-col flex-1 min-w-0">
          {renderHeader('PDF', `${currentPage + 1}/${pdfDoc.numPages}`)}
          <main className="relative flex-1 flex items-center justify-center px-3 sm:px-12 lg:px-16 py-4 sm:py-6 overflow-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage <= 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-current hover:text-[#5b7c99] bg-black/5 rounded-full z-10 disabled:opacity-30"
            >
              <ChevronLeft size={32} strokeWidth={1.5} />
            </button>
            <div
              ref={pdfPageWrapRef}
              className="relative shadow-md bg-white"
              style={{ maxWidth: '100%' }}
              onMouseUp={handlePdfMouseUp}
            >
              <canvas ref={pdfCanvasRef} className="block bg-white max-w-full h-auto" />
              <div
                ref={pdfHighlightsRef}
                className="absolute inset-0 pointer-events-none"
              >
                {currentPageHighlights.map((a) =>
                  (a.location.quads || []).map((q, i) => (
                    <div
                      key={`${a.id}-${i}`}
                      className="absolute"
                      style={{
                        left: `${q.x * 100}%`,
                        top: `${q.y * 100}%`,
                        width: `${q.w * 100}%`,
                        height: `${q.h * 100}%`,
                        backgroundColor: a.color || DEFAULT_HIGHLIGHT_COLOR,
                        opacity: 0.4,
                        mixBlendMode: 'multiply',
                      }}
                      title={a.note || ''}
                    />
                  ))
                )}
              </div>
              <div
                ref={pdfTextLayerRef}
                className="textLayer absolute inset-0"
              />
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pdfDoc.numPages - 1, p + 1))}
              disabled={currentPage >= pdfDoc.numPages - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-current hover:text-[#5b7c99] bg-black/5 rounded-full z-10 disabled:opacity-30"
            >
              <ChevronRight size={32} strokeWidth={1.5} />
            </button>
          </main>
        </div>
        {annotationChrome}
      </div>
    );
  }

  return <p className="px-6 py-6 text-sm text-gray-500">Preparing reader...</p>;
};

export default UploadReadingPage;
