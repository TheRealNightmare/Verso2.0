import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../api/readingSessions', () => ({
  startSession: vi.fn(),
  endSession: vi.fn(),
}));

import useReadingSession from './useReadingSession';
import { startSession, endSession } from '../api/readingSessions';

beforeEach(() => {
  vi.clearAllMocks();
  startSession.mockResolvedValue({ id: 99 });
  endSession.mockResolvedValue({});
});

describe('useReadingSession', () => {
  it('does nothing while both ids are null', () => {
    renderHook(() => useReadingSession({ bookId: null, uploadId: null }));
    expect(startSession).not.toHaveBeenCalled();
  });

  it('starts a session for a catalog book on mount', async () => {
    renderHook(() => useReadingSession({ bookId: 7 }));
    await waitFor(() => expect(startSession).toHaveBeenCalledWith({ bookId: 7, uploadId: null }));
  });

  it('starts a session for a personal upload on mount', async () => {
    renderHook(() => useReadingSession({ uploadId: 12 }));
    await waitFor(() =>
      expect(startSession).toHaveBeenCalledWith({ bookId: null, uploadId: 12 })
    );
  });

  it('ends the session on unmount', async () => {
    const { unmount } = renderHook(() => useReadingSession({ bookId: 7 }));
    await waitFor(() => expect(startSession).toHaveBeenCalled());

    unmount();
    await waitFor(() => expect(endSession).toHaveBeenCalledWith(99));
  });

  it('closes a session that resolves after the reader already unmounted', async () => {
    let resolveStart;
    startSession.mockReturnValue(new Promise((r) => { resolveStart = r; }));

    const { unmount } = renderHook(() => useReadingSession({ bookId: 7 }));
    // Unmount before startSession resolves.
    unmount();
    resolveStart({ id: 123 });

    await waitFor(() => expect(endSession).toHaveBeenCalledWith(123));
  });
});
