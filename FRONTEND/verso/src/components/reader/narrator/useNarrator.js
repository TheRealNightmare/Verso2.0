import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSpeechProvider } from './speechProviders';

// Drives narration of a single reader page. The page is split into sentences
// (across the left then right column, in reading order); each sentence is spoken
// as one utterance so playback is resumable, skippable, and reports word
// boundaries for the karaoke highlight.
//
// Returns:
//   supported            - whether a speech engine is available
//   voices               - selectable NarratorVoice[]
//   status               - 'idle' | 'playing' | 'paused'
//   currentWord          - { column, start, end } | null  (for the highlight)
//   play(fromUnit?) / pause() / resume() / next() / prev() / stop()
//   playFromOffset(column, charOffset)  - "click to start here"

// Split `text` into sentence units with char offsets relative to the column.
function splitSentences(text, column) {
  const units = [];
  if (!text) return units;
  const re = /[^.!?]*[.!?]+[)"'\]]*\s*|[^.!?]+$/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m[0] === '') { re.lastIndex += 1; continue; }
    const raw = m[0];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const lead = raw.length - raw.trimStart().length;
    const start = m.index + lead;
    units.push({ column, start, end: start + trimmed.length, text: trimmed });
  }
  return units;
}

// Resolve the word range covering/just after `charIndex` within `text`.
function wordRangeAt(text, charIndex, charLength) {
  let start = Math.max(0, Math.min(charIndex, text.length));
  while (start < text.length && /\s/.test(text[start])) start += 1;
  let end;
  if (charLength && charLength > 0) {
    end = Math.min(text.length, start + charLength);
  } else {
    end = start;
    while (end < text.length && !/\s/.test(text[end])) end += 1;
  }
  if (end <= start) return null;
  return { start, end };
}

export default function useNarrator({ pageLeft, pageRight, voiceId, rate }) {
  const provider = useMemo(() => getSpeechProvider(), []);
  const supported = provider.isSupported();

  const [voices, setVoices] = useState([]);
  const [status, setStatus] = useState('idle');
  const [currentWord, setCurrentWord] = useState(null);
  const voicesRef = useRef([]);

  // Ordered sentence units for the current page (left column then right).
  const units = useMemo(
    () => [...splitSentences(pageLeft || '', 'left'), ...splitSentences(pageRight || '', 'right')],
    [pageLeft, pageRight],
  );

  // Refs mirror state for use inside async speech callbacks.
  const unitsRef = useRef(units);
  const idxRef = useRef(0);
  const statusRef = useRef('idle');
  const voiceRef = useRef(voiceId);
  const rateRef = useRef(rate);
  // Token invalidates callbacks from a cancelled/superseded run.
  const runRef = useRef(0);

  useEffect(() => { unitsRef.current = units; }, [units]);
  useEffect(() => { voiceRef.current = voiceId; }, [voiceId]);
  useEffect(() => { rateRef.current = rate; }, [rate]);
  const setStatusBoth = useCallback((s) => { statusRef.current = s; setStatus(s); }, []);

  // Load available voices once.
  useEffect(() => {
    let active = true;
    provider.getVoices().then((v) => { if (active) { voicesRef.current = v; setVoices(v); } });
    return () => { active = false; };
  }, [provider]);

  const speakUnit = useCallback((index, token) => {
    const list = unitsRef.current;
    if (index < 0 || index >= list.length) {
      setStatusBoth('idle');
      setCurrentWord(null);
      return;
    }
    idxRef.current = index;
    const unit = list[index];
    provider.speak(unit.text, {
      voiceId: voiceRef.current || voicesRef.current[0]?.id,
      rate: rateRef.current,
      onBoundary: ({ charIndex, charLength }) => {
        if (token !== runRef.current) return;
        const w = wordRangeAt(unit.text, charIndex, charLength);
        if (w) setCurrentWord({ column: unit.column, start: unit.start + w.start, end: unit.start + w.end });
      },
      onEnd: () => {
        if (token !== runRef.current) return;
        speakUnit(index + 1, token);
      },
      onError: () => {
        if (token !== runRef.current) return;
        setStatusBoth('idle');
        setCurrentWord(null);
      },
    });
  }, [provider, setStatusBoth]);

  const stop = useCallback(() => {
    runRef.current += 1;
    provider.cancel();
    setStatusBoth('idle');
    setCurrentWord(null);
  }, [provider, setStatusBoth]);

  const play = useCallback((fromUnit = 0) => {
    if (!supported || !unitsRef.current.length) return;
    runRef.current += 1;
    const token = runRef.current;
    provider.cancel();
    setStatusBoth('playing');
    speakUnit(Math.max(0, Math.min(fromUnit, unitsRef.current.length - 1)), token);
  }, [supported, provider, speakUnit, setStatusBoth]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    provider.pause();
    setStatusBoth('paused');
  }, [provider, setStatusBoth]);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    provider.resume();
    setStatusBoth('playing');
  }, [provider, setStatusBoth]);

  const next = useCallback(() => {
    if (statusRef.current === 'idle') return;
    play(idxRef.current + 1);
  }, [play]);

  const prev = useCallback(() => {
    if (statusRef.current === 'idle') return;
    play(idxRef.current - 1);
  }, [play]);

  // Begin narration from the sentence containing (or following) a char offset.
  const playFromOffset = useCallback((column, offset) => {
    const list = unitsRef.current;
    let idx = list.findIndex((u) => u.column === column && offset >= u.start && offset < u.end);
    if (idx === -1) idx = list.findIndex((u) => u.column === column && u.start >= offset);
    if (idx === -1) return;
    play(idx);
  }, [play]);

  // Restart the current sentence when the voice changes mid-playback so the new
  // voice is heard immediately (Web Speech can't retune an in-flight utterance).
  useEffect(() => {
    if (statusRef.current === 'playing') play(idxRef.current);
  }, [voiceId, play]);

  // Any page change stops narration (scope is the current page only).
  useEffect(() => { stop(); }, [units, stop]);

  // Chrome silently halts long continuous speech (~15s); a periodic
  // pause/resume nudge keeps it alive while genuinely playing.
  useEffect(() => {
    if (!supported) return undefined;
    const id = setInterval(() => {
      if (statusRef.current === 'playing') {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 12000);
    return () => clearInterval(id);
  }, [supported]);

  // Stop on unmount.
  useEffect(() => () => { runRef.current += 1; provider.cancel(); }, [provider]);

  return { supported, voices, status, currentWord, play, pause, resume, next, prev, stop, playFromOffset };
}
