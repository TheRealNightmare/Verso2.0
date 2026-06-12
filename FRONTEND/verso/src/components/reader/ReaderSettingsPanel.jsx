import React from 'react';
import { X, Minus, Plus, Play, Pause, Type, Palette, Music, AudioLines, SkipBack, SkipForward, Square } from 'lucide-react';
import { useReaderSettings } from '../../context/ReaderSettingsContext';
import { READER_THEMES, DEFAULT_CUSTOM_BG, DEFAULT_CUSTOM_TEXT } from './readerThemes';
import { ASMR_TRACKS } from './asmrTracks';

const FONT_MIN = 0.8;
const FONT_MAX = 2.0;
const FONT_STEP = 0.1;

const clampFont = (v) => Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(v * 10) / 10));

const ReaderSettingsPanel = ({ isOpen, onClose, narrator }) => {
  const {
    fontScale, theme, bgColor, textColor,
    asmrTrack, asmrVolume, isPlaying, availableTracks,
    setFontScale, setTheme, setCustomColors, setAsmrVolume, selectTrack, togglePlay,
  } = useReaderSettings();

  if (!isOpen) return null;

  const tracks = ASMR_TRACKS.filter((t) => availableTracks.includes(t.id));

  // Split narrator voices into natural (neural) vs everything else for the picker.
  const narratorVoices = narrator?.voices ?? [];
  const naturalVoices = narratorVoices.filter((v) => v.quality === 'natural');
  const standardVoices = narratorVoices.filter((v) => v.quality !== 'natural');

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#f8f6f2] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 text-[#2c3e50]">
          <h3 className="text-lg font-semibold">Reading settings</h3>
          <button onClick={onClose} className="p-1 hover:text-[#5b7c99]" aria-label="Close settings">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col gap-7">
          {/* Font size */}
          <section>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-[#2c3e50] mb-3">
              <Type size={16} /> Font size
            </h4>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFontScale(clampFont(fontScale - FONT_STEP))}
                disabled={fontScale <= FONT_MIN}
                className="p-2 rounded-md bg-white text-[#2c3e50] shadow-sm hover:text-[#5b7c99] disabled:opacity-30"
                aria-label="Decrease font size"
              >
                <Minus size={16} />
              </button>
              <input
                type="range"
                min={FONT_MIN}
                max={FONT_MAX}
                step={FONT_STEP}
                value={fontScale}
                onChange={(e) => setFontScale(clampFont(Number(e.target.value)))}
                className="flex-1 accent-[#5b7c99]"
                aria-label="Font size"
              />
              <button
                onClick={() => setFontScale(clampFont(fontScale + FONT_STEP))}
                disabled={fontScale >= FONT_MAX}
                className="p-2 rounded-md bg-white text-[#2c3e50] shadow-sm hover:text-[#5b7c99] disabled:opacity-30"
                aria-label="Increase font size"
              >
                <Plus size={16} />
              </button>
              <span className="w-12 text-right text-sm font-semibold text-[#2c3e50] tabular-nums">
                {Math.round(fontScale * 100)}%
              </span>
            </div>
          </section>

          {/* Background theme */}
          <section>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-[#2c3e50] mb-3">
              <Palette size={16} /> Background
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {READER_THEMES.map((t) => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors ${
                      active ? 'ring-2 ring-[#5b7c99]' : 'ring-1 ring-black/10 hover:ring-black/20'
                    }`}
                    aria-label={`${t.label} theme`}
                    aria-pressed={active}
                  >
                    <span
                      className="h-9 w-full rounded-md flex items-center justify-center text-xs font-semibold"
                      style={{ backgroundColor: t.bg, color: t.text }}
                    >
                      Aa
                    </span>
                    <span className="text-[11px] text-[#2c3e50]">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom colours */}
            <div className={`mt-3 rounded-lg p-3 ${theme === 'custom' ? 'ring-2 ring-[#5b7c99]' : 'ring-1 ring-black/10'}`}>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] font-medium text-[#2c3e50]">Custom</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-[11px] text-[#2c3e50]/70">
                    Page
                    <input
                      type="color"
                      value={bgColor || DEFAULT_CUSTOM_BG}
                      onChange={(e) => setCustomColors({ bgColor: e.target.value })}
                      className="h-7 w-7 cursor-pointer rounded border border-black/10 bg-transparent p-0"
                      aria-label="Custom background colour"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-[#2c3e50]/70">
                    Text
                    <input
                      type="color"
                      value={textColor || DEFAULT_CUSTOM_TEXT}
                      onChange={(e) => setCustomColors({ textColor: e.target.value })}
                      className="h-7 w-7 cursor-pointer rounded border border-black/10 bg-transparent p-0"
                      aria-label="Custom text colour"
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Narrator (text-to-speech) */}
          {narrator?.supported && (
            <section>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-[#2c3e50] mb-3">
                <AudioLines size={16} /> Narrator
              </h4>
              {narrator.voices.length === 0 ? (
                <p className="text-[12px] text-[#2c3e50]/60">
                  No voices available in this browser. Open in Chrome or Edge for natural-sounding voices.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={narrator.onToggle}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#5b7c99] px-3 py-2 text-sm font-medium text-white hover:bg-[#4a6884]"
                    >
                      {narrator.status === 'playing' ? <Pause size={16} /> : <Play size={16} />}
                      {narrator.status === 'playing' ? 'Pause' : narrator.status === 'paused' ? 'Resume' : 'Play'}
                    </button>
                    <button
                      onClick={narrator.onPrev}
                      disabled={narrator.status === 'idle'}
                      className="p-2 rounded-md bg-white text-[#2c3e50] shadow-sm hover:text-[#5b7c99] disabled:opacity-30"
                      aria-label="Previous sentence"
                    >
                      <SkipBack size={16} />
                    </button>
                    <button
                      onClick={narrator.onNext}
                      disabled={narrator.status === 'idle'}
                      className="p-2 rounded-md bg-white text-[#2c3e50] shadow-sm hover:text-[#5b7c99] disabled:opacity-30"
                      aria-label="Next sentence"
                    >
                      <SkipForward size={16} />
                    </button>
                    <button
                      onClick={narrator.onStop}
                      disabled={narrator.status === 'idle'}
                      className="p-2 rounded-md bg-white text-[#2c3e50] shadow-sm hover:text-[#5b7c99] disabled:opacity-30"
                      aria-label="Stop narration"
                    >
                      <Square size={16} />
                    </button>
                  </div>

                  <label className="mt-3 block">
                    <span className="text-[11px] text-[#2c3e50]/70">Voice</span>
                    <select
                      value={narrator.voiceId || ''}
                      onChange={(e) => narrator.onVoiceChange(e.target.value)}
                      className="mt-1 w-full rounded-md bg-white px-2 py-2 text-sm text-[#2c3e50] shadow-sm ring-1 ring-black/10"
                      aria-label="Narrator voice"
                    >
                      {naturalVoices.length > 0 && (
                        <optgroup label="Natural">
                          {naturalVoices.map((v) => (
                            <option key={v.id} value={v.id}>{v.label}</option>
                          ))}
                        </optgroup>
                      )}
                      {standardVoices.length > 0 && (
                        <optgroup label="Standard">
                          {standardVoices.map((v) => (
                            <option key={v.id} value={v.id}>{v.label}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </label>
                  {naturalVoices.length === 0 && (
                    <p className="mt-1.5 text-[11px] text-[#2c3e50]/60">
                      Tip: open the app in Microsoft Edge for natural-sounding voices.
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-[11px] text-[#2c3e50]/70">Speed</span>
                    <input
                      type="range"
                      min={0.5}
                      max={2}
                      step={0.25}
                      value={narrator.rate}
                      onChange={(e) => narrator.onRateChange(Number(e.target.value))}
                      className="flex-1 accent-[#5b7c99]"
                      aria-label="Reading speed"
                    />
                    <span className="w-9 text-right text-sm font-semibold text-[#2c3e50] tabular-nums">
                      {narrator.rate}×
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] text-[#2c3e50]/60">
                    Reads the current page aloud and highlights each word. While playing, click any word to start from there.
                  </p>
                </>
              )}
            </section>
          )}

          {/* ASMR ambient audio */}
          <section>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-[#2c3e50] mb-3">
              <Music size={16} /> Ambient sound
            </h4>
            {tracks.length === 0 ? (
              <p className="text-[12px] text-[#2c3e50]/60">
                No ambient sounds installed. Run <code className="rounded bg-black/5 px-1">npm run fetch:audio</code> to add them.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {tracks.map(({ id, label, Icon }) => {
                    const active = asmrTrack === id;
                    return (
                      <button
                        key={id}
                        onClick={() => selectTrack(id)}
                        className={`flex flex-col items-center gap-1.5 rounded-lg p-2.5 transition-colors ${
                          active ? 'bg-[#5b7c99] text-white' : 'bg-white text-[#2c3e50] ring-1 ring-black/10 hover:ring-black/20'
                        }`}
                        aria-pressed={active}
                      >
                        <Icon size={20} />
                        <span className="text-[11px] leading-tight text-center">{label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    disabled={!asmrTrack}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#5b7c99] px-3 py-2 text-sm font-medium text-white hover:bg-[#4a6884] disabled:opacity-40"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={asmrVolume}
                    onChange={(e) => setAsmrVolume(Number(e.target.value))}
                    className="flex-1 accent-[#5b7c99]"
                    aria-label="Ambient volume"
                  />
                  <span className="w-9 text-right text-sm font-semibold text-[#2c3e50] tabular-nums">
                    {asmrVolume}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-[#2c3e50]/60">
                  Plays on a loop while you read.
                </p>
              </>
            )}
          </section>
        </div>
      </aside>
    </>
  );
};

export default ReaderSettingsPanel;
