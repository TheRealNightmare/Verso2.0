import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getEcho } from '../lib/echo';
import { listFriendRequests } from '../api/friends';
import { getInbox } from '../api/messages';
import { listRoomInvitations } from '../api/roomInvitations';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [invitations, setInvitations] = useState([]);
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

  const refreshInvitations = useCallback(async () => {
    try {
      const res = await listRoomInvitations();
      setInvitations(res.data || []);
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

  // Locally remove an invitation once joined or dismissed.
  const removeInvitation = useCallback((id) => {
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Initial load + live subscription, tied to the logged-in user.
  useEffect(() => {
    if (!user?.id) {
      setRequests([]);
      setInvitations([]);
      setUnreadTotal(0);
      return;
    }

    refreshRequests();
    refreshUnread();
    refreshInvitations();

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
      const room = payload.name || 'a room';
      // Surface as a persistent, clickable invitation in the bell (de-duped).
      if (payload.invitationId) {
        setInvitations((prev) => {
          if (prev.some((i) => i.id === payload.invitationId)) return prev;
          return [
            {
              id: payload.invitationId,
              room: { id: payload.roomId, name: payload.name, type: payload.type },
              from: payload.from,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ];
        });
      }
      toast.show(`${who} invited you to “${room}” — open notifications to join`);
    });

    return () => {
      echo.leave(`user.${user.id}`);
    };
  }, [user?.id, refreshRequests, refreshUnread, refreshInvitations, toast]);

  const value = {
    requests,
    requestCount: requests.length,
    invitations,
    invitationCount: invitations.length,
    unreadTotal,
    setUnreadTotal,
    refreshRequests,
    refreshUnread,
    refreshInvitations,
    removeRequest,
    removeInvitation,
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
