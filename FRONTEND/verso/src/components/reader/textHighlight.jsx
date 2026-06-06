import React from 'react';
import { DEFAULT_HIGHLIGHT_COLOR } from './annotationColors';

// Character offset of a selection boundary within an element's text content.
// Robust even when the element already contains <mark> elements (multiple text nodes).
export function getTextOffset(rootEl, node, offsetInNode) {
  if (!rootEl || !node) return 0;
  const range = document.createRange();
  range.selectNodeContents(rootEl);
  try {
    range.setEnd(node, offsetInNode);
  } catch {
    return 0;
  }
  return range.toString().length;
}

// Split a block of text into plain strings + <mark> spans for its annotations.
export function renderWithHighlights(text, anns, onClickAnn) {
  if (!anns.length) return text;
  const sorted = [...anns].sort((a, b) => a.start_offset - b.start_offset);
  const out = [];
  let cursor = 0;
  sorted.forEach((a) => {
    const s = Math.max(cursor, a.start_offset);
    const e = Math.min(text.length, a.end_offset);
    if (s > cursor) out.push(text.slice(cursor, s));
    if (e > s) {
      out.push(
        <mark
          key={a.id}
          onClick={() => onClickAnn(a)}
          title={a.note || 'Click to add a note'}
          className="cursor-pointer rounded-sm"
          style={{ backgroundColor: a.color || DEFAULT_HIGHLIGHT_COLOR, color: 'inherit' }}
        >
          {text.slice(s, e)}
        </mark>,
      );
      cursor = e;
    }
  });
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}
