import { useEffect, useRef } from 'react';
import { startSession, endSession } from '../api/readingSessions';

// Records a reading session for the lifetime of a reader. Pass { bookId } for
// catalog books or { uploadId } for personal uploads. Pass null/undefined while
// the id is still loading — the session starts on the first render with an id and
// ends when the reader unmounts (or the id changes), which is what gives the
// dashboard its Hours Spent / Performance / leaderboard numbers.
export default function useReadingSession({ bookId = null, uploadId = null } = {}) {
  const sessionIdRef = useRef(null);

  useEffect(() => {
    if (bookId == null && uploadId == null) return undefined;

    let cancelled = false;
    startSession({ bookId, uploadId })
      .then((session) => {
        const id = session?.id ?? null;
        // If the reader already unmounted before the session was created, close
        // it out immediately so it isn't left dangling.
        if (cancelled) {
          if (id != null) endSession(id).catch(() => {});
        } else {
          sessionIdRef.current = id;
        }
      })
      .catch((err) => console.error('Failed to start reading session', err));

    return () => {
      cancelled = true;
      const id = sessionIdRef.current;
      sessionIdRef.current = null;
      if (id != null) endSession(id).catch(() => {});
    };
  }, [bookId, uploadId]);
}
