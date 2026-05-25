import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, UserX, MessageCircle, Clock, BookOpen, Heart, Star, Timer } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import { getUserProfile } from '../api/users';
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

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="flex flex-col items-center justify-center rounded-xl bg-white border border-slate-200 px-4 py-5">
    <Icon size={20} className="text-[#5b7c99]" />
    <span className="mt-2 text-xl font-semibold text-slate-800">{value}</span>
    <span className="text-xs text-slate-400">{label}</span>
  </div>
);

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { refreshRequests } = useNotifications();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  usePageTitle(profile?.name || 'Profile');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUserProfile(id);
      if (data.isSelf) {
        navigate('/profile', { replace: true });
        return;
      }
      setProfile(data);
    } catch {
      setError('Could not load this profile.');
    } finally {
      setLoading(false);
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
    return <p className="text-center text-slate-500 py-20">{error || 'Profile not found.'}</p>;
  }

  const { stats } = profile;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#5b7c99] to-[#1e3a5f]" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4">
            <div className="relative">
              <Avatar
                src={profile.avatarUrl}
                name={profile.name}
                className="w-24 h-24 ring-4 ring-white shadow"
                textClass="text-2xl"
              />
              {profile.online && (
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 ring-2 ring-white" />
              )}
            </div>
            <div className="flex-1 pb-1">
              <h1 className="text-xl font-semibold text-slate-800">{profile.name}</h1>
              <p className="text-sm text-slate-400 flex items-center gap-1">
                {profile.online ? (
                  <span className="text-green-600">● Online</span>
                ) : (
                  <>
                    <Clock size={13} /> Offline
                  </>
                )}
                <span className="mx-1">·</span>
                {profile.friendCount} {profile.friendCount === 1 ? 'friend' : 'friends'}
                <span className="mx-1">·</span>
                {profile.points} pts
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.friendStatus === 'none' && (
              <button
                type="button"
                disabled={busy}
                onClick={handleAdd}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5b7c99] text-white text-sm hover:bg-[#4a6a85] disabled:opacity-60"
              >
                <UserPlus size={16} /> Add friend
              </button>
            )}

            {profile.friendStatus === 'request_sent' && (
              <button
                type="button"
                disabled={busy}
                onClick={handleRemove}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 disabled:opacity-60"
              >
                <Clock size={16} /> Request sent · Cancel
              </button>
            )}

            {profile.friendStatus === 'request_received' && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleAccept}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5b7c99] text-white text-sm hover:bg-[#4a6a85] disabled:opacity-60"
                >
                  <UserCheck size={16} /> Accept request
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDecline}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 disabled:opacity-60"
                >
                  <UserX size={16} /> Decline
                </button>
              </>
            )}

            {profile.friendStatus === 'friends' && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/messages/${profile.id}`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5b7c99] text-white text-sm hover:bg-[#4a6a85]"
                >
                  <MessageCircle size={16} /> Message
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleRemove}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 disabled:opacity-60"
                >
                  <UserX size={16} /> Unfriend
                </button>
              </>
            )}
          </div>

          {/* Reading stats */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={BookOpen} label="Books read" value={stats.booksCompleted} />
            <StatCard icon={Heart} label="Favorites" value={stats.favorites} />
            <StatCard icon={Star} label="Reviews" value={stats.reviews} />
            <StatCard icon={Timer} label="Hours read" value={stats.hoursRead} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
