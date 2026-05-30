import React from 'react';
import { Edit3 } from 'lucide-react';
import { HIGHLIGHT_COLORS, DEFAULT_HIGHLIGHT_COLOR } from './annotationColors';

const AnnotationToolbar = ({ rect, onColor, onNote }) => {
  if (!rect) return null;
  return (
    <div
      className="fixed z-50 flex items-center gap-1 rounded-lg bg-white px-2 py-1.5 shadow-lg ring-1 ring-black/10"
      style={{
        top: Math.max(8, rect.top - 46),
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 220)),
      }}
    >
      {HIGHLIGHT_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onColor(c)}
          className="h-5 w-5 rounded-full ring-1 ring-black/10 hover:scale-110 transition-transform"
          style={{ backgroundColor: c }}
          aria-label={`Highlight ${c}`}
        />
      ))}
      <button
        onClick={() => onNote(DEFAULT_HIGHLIGHT_COLOR)}
        className="ml-1 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-[#2c3e50] hover:bg-[#f0ece3]"
      >
        <Edit3 size={13} /> Note
      </button>
    </div>
  );
};

export default AnnotationToolbar;
