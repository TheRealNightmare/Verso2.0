import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, updateProfilePhoto } from '../api/profile';
import { getUserProfile, getUserFavorites } from '../api/users';
import { getMyUploadedBooks } from '../api/authorBooks';
import ProfileView from '../components/profile/ProfileView';
import EditProfileModal from '../components/profile/EditProfileModal';
import UploadAvatarModal from '../components/profile/UploadAvatarModal';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import usePageTitle from '../hooks/usePageTitle';

const emptyForm = {
  email: '',
  fullName: '',
  dateOfBirth: '',
  gender: 'Male',
  bio: '',
  bannerColor: '',
  currentPassword: '',
  password: '',
};

const Profile = () => {
  const { logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  usePageTitle('Profile');

  const [view, setView] = useState(null); // rich public-shape profile (stats, etc.)
  const [form, setForm] = useState(emptyForm); // editable fields
  const [favorites, setFavorites] = useState([]);
  const [authorBooks, setAuthorBooks] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [editOpen, setEditOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadingExtras(true);
    setLoadError('');
    try {
      const base = await getProfile();
      setForm({
        email: base.email || '',
        fullName: base.name || '',
        dateOfBirth: base.dateOfBirth || '',
        gender: base.gender || 'Male',
        bio: base.bio || '',
        bannerColor: base.bannerColor || '',
        currentPassword: '',
        password: '',
      });
      setAvatarUrl(base.avatarUrl || '');

      const profile = await getUserProfile(base.id);
      setView(profile);
      setLoading(false);

      const tasks = [getUserFavorites(base.id).then(setFavorites).catch(() => setFavorites([]))];
      if (profile.role === 'author') {
        tasks.push(getMyUploadedBooks().then(setAuthorBooks).catch(() => setAuthorBooks([])));
      }
      await Promise.all(tasks);
    } catch {
      setLoadError('Could not load your profile. Please try again.');
      setLoading(false);
    } finally {
      setLoadingExtras(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async (values) => {
    setSubmitting(true);
    setErrors({});

    const payload = {
      name: values.fullName,
      email: values.email,
      date_of_birth: values.dateOfBirth || null,
      gender: values.gender,
      bio: values.bio || null,
      banner_color: values.bannerColor || null,
    };
    if (values.password) {
      payload.current_password = values.currentPassword;
      payload.password = values.password;
    }

    try {
      const data = await updateProfile(payload);
      setForm((p) => ({ ...p, currentPassword: '', password: '' }));
      updateUser({ name: data.name });
      setView((v) =>
        v ? { ...v, name: data.name, bio: data.bio, bannerColor: data.bannerColor } : v
      );
      setEditOpen(false);
      toast.success('Updated successfully');
    } catch (err) {
      setErrors(err?.errors || {});
      toast.error(err?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadConfirm = async (file) => {
    setUploading(true);
    try {
      const data = await updateProfilePhoto(file);
      setAvatarUrl(data.avatarUrl);
      updateUser({ avatarUrl: data.avatarUrl });
      setView((v) => (v ? { ...v, avatarUrl: data.avatarUrl } : v));
      setUploadOpen(false);
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err?.message || 'Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Log out?',
      message: 'You will need to sign in again to access your library.',
      confirmLabel: 'Log out',
    });
    if (!ok) return;
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <Spinner label="Loading profile…" />
      </div>
    );
  }

  if (loadError || !view) {
    return <div className="py-20 text-center text-red-500">{loadError || 'Profile not found.'}</div>;
  }

  const actions = (
    <button
      type="button"
      onClick={() => setEditOpen(true)}
      className="inline-flex items-center gap-2 rounded-lg bg-[#5b7c99] px-4 py-2 text-sm text-white hover:bg-[#4a6a85]"
    >
      <PenSquare size={16} /> Edit profile
    </button>
  );

  return (
    <>
      <ProfileView
        profile={view}
        favorites={favorites}
        authorBooks={authorBooks}
        actions={actions}
        loadingExtras={loadingExtras}
      />

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialValues={form}
        onSave={handleConfirm}
        submitting={submitting}
        errors={errors}
        avatarUrl={avatarUrl}
        name={form.fullName}
        onChangePhoto={() => setUploadOpen(true)}
        onLogout={handleLogout}
      />

      <UploadAvatarModal
        open={uploadOpen}
        uploading={uploading}
        onClose={() => setUploadOpen(false)}
        onConfirm={handleUploadConfirm}
      />
    </>
  );
};

export default Profile;
