import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getReadingPreferences, updateReadingPreferences } from '../api/readingPreferences';
import { ASMR_TRACKS, getTrack } from '../components/reader/asmrTracks';

const STORAGE_KEY = 'verso:reader_settings';
const SYNC_DEBOUNCE_MS = 700;

// Font size beyond this collapses the catalog two-column layout to one column.
export const SINGLE_COLUMN_SCALE = 1.4;

const DEFAULTS = {
  fontScale: 1,
  theme: 'light',
  bgColor: null,
  textColor: null,
  asmrTrack: null,
  asmrVolume: 60,
};

// Only these keys are persisted/synced; isPlaying is session-local.
const SYNC_KEYS = ['fontScale', 'theme', 'bgColor', 'textColor', 'asmrTrack', 'asmrVolume'];

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function isReaderPath(pathname) {
  return pathname.startsWith('/read/') || pathname.startsWith('/reading/');
}

const ReaderSettingsContext = createContext(null);

export function ReaderSettingsProvider({ children }) {
  const { token } = useAuth();
  const location = useLocation();

  const [settings, setSettings] = useState(loadLocal);
  const [isPlaying, setIsPlaying] = useState(false);
  // Track ids whose audio file actually exists; unavailable ones are hidden.
  const [availableTracks, setAvailableTracks] = useState([]);

  const audioRef = useRef(null);
  const syncTimerRef = useRef(null);
  const pendingRef = useRef({});

  // Hydrate from the backend once authenticated, merging over the local cache.
  useEffect(() => {
    if (!token) return;
    let active = true;
    getReadingPreferences()
      .then((data) => {
        if (!active || !data) return;
        const merged = {};
        for (const key of SYNC_KEYS) {
          if (data[key] !== undefined) merged[key] = data[key];
        }
        setSettings((prev) => {
          const next = { ...prev, ...merged };
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
          return next;
        });
      })
      .catch(() => { /* keep local cache */ });
    return () => { active = false; };
  }, [token]);

  // Probe which track files are actually present (the .mp3s are fetched via
  // `npm run fetch:audio`, not committed). Missing ones are hidden from the UI.
  useEffect(() => {
    let active = true;
    Promise.all(
      ASMR_TRACKS.map((t) =>
        fetch(t.src, { method: 'HEAD' })
          .then((res) => (res.ok ? t.id : null))
          .catch(() => null)
      )
    ).then((ids) => {
      if (active) setAvailableTracks(ids.filter(Boolean));
    });
    return () => { active = false; };
  }, []);

  // Merge a change, persist locally now, and debounce a sync to the backend.
  const update = useCallback((partial) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    pendingRef.current = { ...pendingRef.current, ...partial };
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const payload = pendingRef.current;
      pendingRef.current = {};
      if (Object.keys(payload).length) {
        updateReadingPreferences(payload).catch(() => { /* local cache stands */ });
      }
    }, SYNC_DEBOUNCE_MS);
  }, []);

  useEffect(() => () => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
  }, []);

  // Keep the <audio> element's source in sync with the selected track.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const track = getTrack(settings.asmrTrack);
    const nextSrc = track?.src || '';
    // Compare against the resolved absolute URL the element reports.
    if (track && !audio.src.endsWith(nextSrc)) {
      audio.src = nextSrc;
    } else if (!track) {
      audio.removeAttribute('src');
      audio.load();
    }
  }, [settings.asmrTrack]);

  // Volume.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.min(1, Math.max(0, settings.asmrVolume / 100));
  }, [settings.asmrVolume]);

  // Play / pause.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying && settings.asmrTrack) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, settings.asmrTrack]);

  // Audio plays only while reading; leaving the reader stops it.
  useEffect(() => {
    if (!isReaderPath(location.pathname)) {
      setIsPlaying(false);
    }
  }, [location.pathname]);

  // Choosing a track selects it and starts playback.
  const selectTrack = useCallback((trackId) => {
    if (!availableTracks.includes(trackId)) return;
    update({ asmrTrack: trackId });
    setIsPlaying(true);
  }, [update, availableTracks]);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => (settings.asmrTrack ? !p : false));
  }, [settings.asmrTrack]);

  const value = {
    ...settings,
    isPlaying,
    availableTracks,
    setFontScale: (v) => update({ fontScale: v }),
    setTheme: (theme) => update({ theme }),
    setCustomColors: ({ bgColor, textColor }) =>
      update({ theme: 'custom', ...(bgColor != null ? { bgColor } : {}), ...(textColor != null ? { textColor } : {}) }),
    setAsmrVolume: (v) => update({ asmrVolume: v }),
    selectTrack,
    togglePlay,
  };

  return (
    <ReaderSettingsContext.Provider value={value}>
      {children}
      <audio ref={audioRef} loop preload="none" />
    </ReaderSettingsContext.Provider>
  );
}

export function useReaderSettings() {
  const ctx = useContext(ReaderSettingsContext);
  if (!ctx) throw new Error('useReaderSettings must be used inside a ReaderSettingsProvider');
  return ctx;
}
