// Pluggable text-to-speech providers for the reader narrator.
//
// The narrator engine (`useNarrator`) talks to a provider through this small
// interface so the voice backend can be swapped without touching the UI:
//
//   isSupported()                      -> boolean
//   getVoices()                        -> Promise<NarratorVoice[]>
//   speak(text, opts)                  -> starts speaking one chunk
//   pause() / resume() / cancel()      -> playback control
//
// `NarratorVoice` is { id, label, lang }. `speak` opts:
//   { voiceId, rate, onBoundary({ charIndex, charLength }), onEnd(), onError() }
//
// Today the only provider is the browser's free Web Speech API. A future
// `AzureSpeechProvider` (server-synthesized neural voices) can implement the
// same shape and be selected here without changes elsewhere.

// --- Web Speech API ---------------------------------------------------------

function webSpeechSupported() {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof window.SpeechSynthesisUtterance === 'function';
}

// getVoices() is populated asynchronously on some browsers; wait for the
// `voiceschanged` event (with a timeout fallback) before resolving.
function loadWebVoices() {
  return new Promise((resolve) => {
    if (!webSpeechSupported()) {
      resolve([]);
      return;
    }
    const synth = window.speechSynthesis;
    const collect = () => synth.getVoices();

    const initial = collect();
    if (initial.length) {
      resolve(initial);
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synth.removeEventListener('voiceschanged', onChange);
      resolve(collect());
    };
    const onChange = () => finish();
    synth.addEventListener('voiceschanged', onChange);
    // Safety net: some engines never fire the event.
    setTimeout(finish, 1500);
  });
}

// Rate how natural a voice is likely to sound from its name. Modern neural voices
// (Edge's "… Online (Natural)", Google's web voices) sound human; legacy local
// SAPI/eSpeak voices sound robotic. Used to order the picker and pick the default.
function voiceQuality(name = '') {
  if (/microsoft (david|mark|zira|hazel|george|susan)|espeak|sapi/i.test(name)) return 'basic';
  if (/natural|neural|online|wavenet|google/i.test(name)) return 'natural';
  return 'standard';
}

const QUALITY_RANK = { natural: 0, standard: 1, basic: 2 };

function toNarratorVoice(v) {
  return { id: v.voiceURI, label: v.name, lang: v.lang, quality: voiceQuality(v.name), _native: v };
}

const WebSpeechProvider = {
  id: 'web-speech',
  isSupported: webSpeechSupported,

  async getVoices() {
    const voices = await loadWebVoices();
    // English voices only for now; keep them de-duplicated by URI.
    const seen = new Set();
    const list = voices
      .filter((v) => /^en(-|_|$)/i.test(v.lang))
      .filter((v) => (seen.has(v.voiceURI) ? false : (seen.add(v.voiceURI), true)))
      .map(toNarratorVoice);

    // Natural voices first, then standard, then robotic legacy ones; within a
    // group prefer en-US / en-GB. Stable sort preserves the engine's order.
    const langRank = (lang) => (/^en[-_](us|gb)/i.test(lang) ? 0 : 1);
    return list
      .map((v, i) => ({ v, i }))
      .sort((a, b) =>
        (QUALITY_RANK[a.v.quality] - QUALITY_RANK[b.v.quality])
        || (langRank(a.v.lang) - langRank(b.v.lang))
        || (a.i - b.i))
      .map(({ v }) => v);
  },

  speak(text, { voiceId, rate = 1, onBoundary, onEnd, onError } = {}) {
    if (!webSpeechSupported()) {
      onError?.(new Error('Speech synthesis not supported'));
      return;
    }
    const synth = window.speechSynthesis;
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.rate = Math.min(2, Math.max(0.5, rate));

    if (voiceId) {
      const match = synth.getVoices().find((v) => v.voiceURI === voiceId);
      if (match) {
        utter.voice = match;
        utter.lang = match.lang;
      }
    }

    utter.onboundary = (e) => {
      // Word boundaries carry a charIndex into `text`; some engines also report
      // charLength. Sentence/other boundaries are ignored by the engine.
      if (e.name && e.name !== 'word') return;
      onBoundary?.({ charIndex: e.charIndex ?? 0, charLength: e.charLength ?? 0 });
    };
    utter.onend = () => onEnd?.();
    utter.onerror = (e) => {
      // A programmatic cancel() surfaces as an 'interrupted'/'canceled' error;
      // that is expected control flow, not a failure.
      if (e?.error === 'interrupted' || e?.error === 'canceled') return;
      onError?.(e);
    };

    // Chrome can leave the queue in a stuck paused state; clear before speaking.
    synth.resume();
    synth.speak(utter);
  },

  pause() {
    if (webSpeechSupported()) window.speechSynthesis.pause();
  },
  resume() {
    if (webSpeechSupported()) window.speechSynthesis.resume();
  },
  cancel() {
    if (webSpeechSupported()) window.speechSynthesis.cancel();
  },
};

// --- Selection --------------------------------------------------------------

// Returns the active provider. When more providers exist this will branch on a
// user/preference setting; for now it is always the free Web Speech provider.
export function getSpeechProvider() {
  return WebSpeechProvider;
}
