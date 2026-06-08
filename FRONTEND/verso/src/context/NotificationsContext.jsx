import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getEcho } from '../lib/echo';
import { listFriendRequests } from '../api/friends';
import { getInbox } from '../api/messages';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Listeners that want raw incoming direct messages (e.g. the open chat thread).
  const dmListeners = useRef(new Set());

  const refreshRequests = useCallback(async () => {
    try {
      const res = await listFriendRequests();
      setRequests(res.data || []);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await getInbox();
      setUnreadTotal(res.unreadTotal || 0);
    } catch {
      /* ignore */
    }
  }, []);

  const subscribeDM = useCallback((fn) => {
    dmListeners.current.add(fn);
    return () => dmListeners.current.delete(fn);
  }, []);

  // Locally remove a request once acted upon (accept/decline).
  const removeRequest = useCallback((requestId) => {
    setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  }, []);

  // Initial load + live subscription, tied to the logged-in user.
  useEffect(() => {
    if (!user?.id) {
      setRequests([]);
      setUnreadTotal(0);
      return;
    }

    refreshRequests();
    refreshUnread();

    const echo = getEcho();
    const channel = echo.private(`user.${user.id}`);

    channel.listen('.friend.request.received', (payload) => {
      setRequests((prev) => {
        if (prev.some((r) => r.requestId === payload.requestId)) return prev;
        return [
          { requestId: payload.requestId, user: payload.from, createdAt: new Date().toISOString() },
          ...prev,
        ];
      });
      toast.show(`${payload.from?.name || 'Someone'} sent you a friend request`);
    });

    channel.listen('.friend.request.accepted', (payload) => {
      toast.success(`${payload.by?.name || 'Someone'} accepted your friend request`);
    });

    channel.listen('.dm.sent', (payload) => {
      let handled = false;
      dmListeners.current.forEach((fn) => {
        if (fn(payload) === true) handled = true;
      });
      // If no open thread consumed it (marking it read), bump the unread badge.
      if (!handled) {
        setUnreadTotal((n) => n + 1);
        toast.show(`New message from ${payload.sender?.name || 'a friend'}`);
      }
    });

    channel.listen('.room.invite', (payload) => {
      const who = payload.from?.name || 'A friend';
      const room = payload.name || 'a reading room';
      const code = payload.joinCode ? ` (code: ${payload.joinCode})` : '';
      toast.show(`${who} invited you to “${room}”${code} — open Reading Rooms to join`);
    });

    return () => {
      echo.leave(`user.${user.id}`);
    };
  }, [user?.id, refreshRequests, refreshUnread, toast]);

  const value = {
    requests,
    requestCount: requests.length,
    unreadTotal,
    setUnreadTotal,
    refreshRequests,
    refreshUnread,
    removeRequest,
    subscribeDM,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside a NotificationsProvider');
  }
  return ctx;
}
