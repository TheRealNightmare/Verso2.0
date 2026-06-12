import { useEffect, useMemo, useState } from 'react';
import { X, Check, Copy, Users, Link2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { listFriends } from '../../api/friends';
import { inviteFriend } from '../../api/readingRooms';
import { useToast } from '../../context/ToastContext';

// Shared invite modal for reading + chat rooms. Two ways in:
//  1) pick friends from your friend list (multi-select) and send invites,
//  2) copy the room's invite code/link to share anywhere.
const InviteFriendsModal = ({ roomId, joinCode, roomType = 'reading', onClose }) => {
  const toast = useToast();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(() => new Set());
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    listFriends()
      .then((res) => alive && setFriends(res.data || []))
      .catch(() => alive && setFriends([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const inviteUrl = useMemo(() => {
    const path = roomType === 'chat' ? '/community' : `/rooms/${roomId}/read`;
    return `${window.location.origin}${path}`;
  }, [roomId, roomType]);

  const handleSend = async () => {
    if (selected.size === 0) return;
    setSending(true);
    const ids = [...selected];
    const results = await Promise.allSettled(ids.map((id) => inviteFriend(roomId, id)));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    setSending(false);
    if (ok > 0) {
      toast.success(`Invited ${ok} friend${ok === 1 ? '' : 's'}`);
      onClose?.();
    } else {
      toast.error('Could not send invites.');
    }
  };

  const handleCopy = async () => {
    const text = joinCode ? `${inviteUrl}\nInvite code: ${joinCode}` : inviteUrl;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Invite copied to clipboard');
    } catch {
      toast.error('Could not copy invite.');
    }
  };

  return (
    <Modal
      onClose={onClose}
      label="Invite to room"
      panelClassName="bg-white rounded-xl shadow-lg max-w-md max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800">Invite to room</h3>
        <button onClick={onClose} aria-label="Close" className="p-1 text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>

      {/* Option 1: invite from friends list */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-2 text-sm font-medium text-slate-700">
        <Users size={16} /> Invite friends
      </div>
      <div className="px-3 flex-1 overflow-y-auto min-h-[80px]">
        {loading ? (
          <p className="px-2 py-6 text-center text-xs text-slate-400">Loading friends…</p>
        ) : friends.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-slate-400">
            You have no friends to invite yet.
          </p>
        ) : (
          <ul>
            {friends.map((f) => {
              const checked = selected.has(f.id);
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => toggle(f.id)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 text-left"
                  >
                    <Avatar src={f.avatarUrl} name={f.name} className="w-9 h-9 shrink-0" textClass="text-xs" />
                    <span className="flex-1 min-w-0 text-sm text-slate-700 truncate">{f.name}</span>
                    <span
                      className={`flex items-center justify-center w-5 h-5 rounded border ${
                        checked ? 'bg-[#5b7c99] border-[#5b7c99] text-white' : 'border-slate-300'
                      }`}
                    >
                      {checked && <Check size={14} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="px-5 py-3 border-t border-slate-100">
        <Button
          variant="primary"
          size="md"
          className="w-full"
          disabled={selected.size === 0}
          loading={sending}
          loadingLabel="Sending…"
          onClick={handleSend}
        >
          {selected.size > 0 ? `Send ${selected.size} invite${selected.size === 1 ? '' : 's'}` : 'Send invites'}
        </Button>
      </div>

      {/* Option 2: copy invite code/link */}
      {joinCode && (
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Link2 size={16} /> Or share an invite code
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-mono tracking-wider text-slate-700">
              {joinCode}
            </code>
            <Button variant="secondary" size="md" onClick={handleCopy}>
              <Copy size={15} /> Copy
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default InviteFriendsModal;
