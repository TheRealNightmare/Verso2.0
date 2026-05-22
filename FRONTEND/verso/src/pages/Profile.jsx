import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, updateProfilePhoto } from '../api/profile';
import ProfileForm from '../components/profile/ProfileForm';
import AvatarPanel from '../components/profile/AvatarPanel';
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
  currentPassword: '',
  password: '',
};

const Profile = () => {
  const { logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  usePageTitle('Profile');

  const [profile, setProfile] = useState(emptyForm);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((data) => {
        if (!active) return;
        setProfile({
          email: data.email || '',
          fullName: data.name || '',
          dateOfBirth: data.dateOfBirth || '',
          gender: data.gender || 'Male',
          currentPassword: '',
          password: '',
        });
        setAvatarUrl(data.avatarUrl || '');
      })
      .catch(() => {
        if (active) setLoadError('Could not load your profile. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleConfirm = async (values) => {
    setSubmitting(true);
    setErrors({});

    const payload = {
      name: values.fullName,
      email: values.email,
      date_of_birth: values.dateOfBirth || null,
      gender: values.gender,
    };
    if (values.password) {
      payload.current_password = values.currentPassword;
      payload.password = values.password;
    }

    try {
      const data = await updateProfile(payload);
      setProfile((p) => ({ ...p, currentPassword: '', password: '' }));
      updateUser({ name: data.name });
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

  if (loadError) {
    return <div className="py-20 text-center text-red-500">{loadError}</div>;
  }

  return (
    <div className="relative w-full">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-24 py-10">
        <ProfileForm
          initialValues={profile}
          onConfirm={handleConfirm}
          submitting={submitting}
          errors={errors}
        />
        <AvatarPanel
          avatarUrl={avatarUrl}
          onChangePhoto={() => setUploadOpen(true)}
          onLogout={handleLogout}
        />
      </div>

      <UploadAvatarModal
        open={uploadOpen}
        uploading={uploading}
        onClose={() => setUploadOpen(false)}
        onConfirm={handleUploadConfirm}
      />
    </div>
  );
};

export default Profile;
