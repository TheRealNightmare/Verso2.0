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

// Visual style for a text segment covered by one or more highlights. A single
// highlight is a solid background; overlapping highlights (common in a shared
// reading room) keep the first color as the fill and stack the others as thin
// underlines so no highlight is ever silently dropped.
function segmentStyle(covering) {
  const colors = covering.map((a) => a.color || DEFAULT_HIGHLIGHT_COLOR);
  const style = { backgroundColor: colors[0], color: 'inherit' };
  if (colors.length > 1) {
    style.boxShadow = colors
      .slice(1)
      .map((c, i) => `inset 0 ${-2 * (i + 1)}px 0 0 ${c}`)
      .join(', ');
  }
  return style;
}

function segmentTitle(covering) {
  // Prefer notes/authors when present; falls back to the add-a-note hint.
  const parts = covering
    .map((a) => {
      const who = a.author?.name ? `${a.author.name}: ` : '';
      const what = a.note || (a.room ? 'highlight' : '');
      return what ? `${who}${what}` : who.trim();
    })
    .filter(Boolean);
  return parts.length ? parts.join('\n') : 'Click to add a note';
}

// Split a block of text into plain strings + <mark> spans for its annotations.
// Supports overlapping highlights via a boundary sweep: the text is cut at every
// highlight start/end, and each resulting segment is rendered once with the set
// of highlights covering it. `onClickAnn(primary, covering)` receives the topmost
// highlight (most recently created) plus the full covering list.
export function renderWithHighlights(text, anns, onClickAnn) {
  if (!anns || !anns.length) return text;

  // Normalize + clamp ranges, dropping anything outside this block.
  const ranges = anns
    .map((a) => ({
      ann: a,
      start: Math.max(0, Math.min(text.length, a.start_offset)),
      end: Math.max(0, Math.min(text.length, a.end_offset)),
    }))
    .filter((r) => r.end > r.start);

  if (!ranges.length) return text;

  // Unique sorted boundaries.
  const bounds = Array.from(
    new Set([0, text.length, ...ranges.flatMap((r) => [r.start, r.end])]),
  ).sort((a, b) => a - b);

  const out = [];
  for (let i = 0; i < bounds.length - 1; i += 1) {
    const s = bounds[i];
    const e = bounds[i + 1];
    if (e <= s) continue;
    const slice = text.slice(s, e);
    const covering = ranges.filter((r) => r.start <= s && r.end >= e).map((r) => r.ann);

    if (!covering.length) {
      out.push(slice);
      continue;
    }

    // Topmost = highest id (most recently created) for click routing.
    const primary = covering.reduce((top, a) => ((a.id ?? 0) > (top.id ?? 0) ? a : top), covering[0]);

    out.push(
      <mark
        key={`${s}-${e}`}
        onClick={() => onClickAnn(primary, covering)}
        title={segmentTitle(covering)}
        className="cursor-pointer rounded-sm"
        style={segmentStyle(covering)}
      >
        {slice}
      </mark>,
    );
  }

  return out;
}
