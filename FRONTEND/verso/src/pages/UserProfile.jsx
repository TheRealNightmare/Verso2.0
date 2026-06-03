import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, UserX, MessageCircle, Clock } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import ProfileView from '../components/profile/ProfileView';
import { getUserProfile, getUserFavorites } from '../api/users';
import { getBooksByAuthor } from '../api/authorBooks';
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from '../api/friends';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useNotifications } from '../context/NotificationsContext';
import usePageTitle from '../hooks/usePageTitle';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { refreshRequests } = useNotifications();

  const [profile, setProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [authorBooks, setAuthorBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  usePageTitle(profile?.name || 'Profile');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadingExtras(true);
    setError('');
    try {
      const data = await getUserProfile(id);
      if (data.isSelf) {
        navigate('/profile', { replace: true });
        return;
      }
      setProfile(data);
      setLoading(false);

      // Favorites (public) + author books load in the background for the tabs.
      const tasks = [getUserFavorites(data.id).then(setFavorites).catch(() => setFavorites([]))];
      if (data.role === 'author') {
        tasks.push(getBooksByAuthor(data.id).then(setAuthorBooks).catch(() => setAuthorBooks([])));
      }
      await Promise.all(tasks);
    } catch {
      setError('Could not load this profile.');
      setLoading(false);
    } finally {
      setLoadingExtras(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const patchStatus = (friendStatus) =>
    setProfile((p) => (p ? { ...p, friendStatus } : p));

  const handleAdd = async () => {
    setBusy(true);
    try {
      const res = await sendFriendRequest(profile.id);
      patchStatus(res.status || 'request_sent');
      toast.success('Friend request sent');
    } catch {
      toast.error('Could not send request.');
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async () => {
    setBusy(true);
    try {
      await acceptFriendRequest(profile.pendingRequestId);
      patchStatus('friends');
      refreshRequests();
      toast.success(`You are now friends with ${profile.name}`);
    } catch {
      toast.error('Could not accept request.');
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    setBusy(true);
    try {
      await declineFriendRequest(profile.pendingRequestId);
      patchStatus('none');
      refreshRequests();
    } catch {
      toast.error('Could not decline request.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    const isFriend = profile.friendStatus === 'friends';
    const ok = await confirm({
      title: isFriend ? `Unfriend ${profile.name}?` : 'Cancel request?',
      message: isFriend
        ? 'You will no longer be able to message each other.'
        : 'Your friend request will be withdrawn.',
      confirmLabel: isFriend ? 'Unfriend' : 'Cancel request',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await removeFriend(profile.id);
      patchStatus('none');
    } catch {
      toast.error('Could not update.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error || !profile) {
    return <p className="py-20 text-center text-slate-500">{error || 'Profile not found.'}</p>;
  }

  const primaryBtn =
    'inline-flex items-center gap-2 rounded-lg bg-[#5b7c99] px-4 py-2 text-sm text-white hover:bg-[#4a6a85] disabled:opacity-60';
  const subtleBtn =
    'inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 disabled:opacity-60';

  const actions = (
    <>
      {profile.friendStatus === 'none' && (
        <button type="button" disabled={busy} onClick={handleAdd} className={primaryBtn}>
          <UserPlus size={16} /> Add friend
        </button>
      )}

      {profile.friendStatus === 'request_sent' && (
        <button type="button" disabled={busy} onClick={handleRemove} className={subtleBtn}>
          <Clock size={16} /> Request sent · Cancel
        </button>
      )}

      {profile.friendStatus === 'request_received' && (
        <>
          <button type="button" disabled={busy} onClick={handleAccept} className={primaryBtn}>
            <UserCheck size={16} /> Accept request
          </button>
          <button type="button" disabled={busy} onClick={handleDecline} className={subtleBtn}>
            <UserX size={16} /> Decline
          </button>
        </>
      )}

      {profile.friendStatus === 'friends' && (
        <>
          <button
            type="button"
            onClick={() => navigate(`/messages/${profile.id}`)}
            className={primaryBtn}
          >
            <MessageCircle size={16} /> Message
          </button>
          <button type="button" disabled={busy} onClick={handleRemove} className={subtleBtn}>
            <UserX size={16} /> Unfriend
          </button>
        </>
      )}
    </>
  );

  return (
    <ProfileView
      profile={profile}
      favorites={favorites}
      authorBooks={authorBooks}
      actions={actions}
      loadingExtras={loadingExtras}
    />
  );
};

export default UserProfile;
