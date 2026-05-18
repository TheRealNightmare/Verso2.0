import { useState } from 'react';
import { Play, Pause } from 'lucide-react';

const BAR_HEIGHTS = [6, 10, 14, 18, 12, 8, 16, 20, 14, 10, 6, 12, 18, 14, 8, 12, 16, 10, 6, 14, 18, 12, 8, 14, 10];

const formatDuration = (sec) => {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const AudioMessage = ({ message, isMine }) => {
  const [playing, setPlaying] = useState(false);
  const duration = message.audio?.durationSec ?? 0;

  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} my-2`}>
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-full min-w-[220px] ${
          isMine ? 'bg-[#7c9dc4]' : 'bg-[#8ca5c2]'
        }`}
      >
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-[#5b7c99]"
        >
          {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
        </button>
        <div className="flex items-center gap-[2px] flex-1 h-6">
          {BAR_HEIGHTS.map((h, i) => (
            <span
              key={i}
              className="w-[2px] rounded-full bg-white/80"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
        <span className="text-xs text-white font-medium tabular-nums">
          {formatDuration(duration)}
        </span>
      </div>
      <span className="text-[11px] text-slate-400 mt-1 px-1">{message.timestamp}</span>
    </div>
  );
};

export default AudioMessage;
