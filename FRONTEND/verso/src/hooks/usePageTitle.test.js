import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import usePageTitle from './usePageTitle';

beforeEach(() => {
  document.title = 'original';
});

describe('usePageTitle', () => {
  it('prefixes the title with "Verso ·"', () => {
    renderHook(() => usePageTitle('Dashboard'));
    expect(document.title).toBe('Verso · Dashboard');
  });

  it('falls back to plain "Verso" with no title', () => {
    renderHook(() => usePageTitle());
    expect(document.title).toBe('Verso');
  });

  it('restores the previous title on unmount', () => {
    const { unmount } = renderHook(() => usePageTitle('Profile'));
    expect(document.title).toBe('Verso · Profile');
    unmount();
    expect(document.title).toBe('original');
  });

  it('updates the title when the argument changes', () => {
    const { rerender } = renderHook(({ t }) => usePageTitle(t), {
      initialProps: { t: 'A' },
    });
    expect(document.title).toBe('Verso · A');
    rerender({ t: 'B' });
    expect(document.title).toBe('Verso · B');
  });
});
