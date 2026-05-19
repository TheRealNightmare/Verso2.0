import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileMock } from '../mocks/profile';
import ProfileForm from '../components/profile/ProfileForm';
import AvatarPanel from '../components/profile/AvatarPanel';
import UploadAvatarModal from '../components/profile/UploadAvatarModal';
import SuccessToast from '../components/profile/SuccessToast';

const Profile = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(profileMock);
  const [avatarUrl, setAvatarUrl] = useState(profileMock.avatarUrl);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toastShow, setToastShow] = useState(false);

  const handleConfirm = (values) => {
    setProfile(values);
    setToastShow(true);
  };

  const handleUploadConfirm = (file) => {
    setAvatarUrl(URL.createObjectURL(file));
    setUploadOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <div className="relative w-full">
      <SuccessToast
        message="Updated successfully"
        show={toastShow}
        onDismiss={() => setToastShow(false)}
      />

      <div className="flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-24 py-10">
        <ProfileForm initialValues={profile} onConfirm={handleConfirm} />
        <AvatarPanel
          avatarUrl={avatarUrl}
          onChangePhoto={() => setUploadOpen(true)}
          onLogout={handleLogout}
        />
      </div>

      <UploadAvatarModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onConfirm={handleUploadConfirm}
      />
    </div>
  );
};

export default Profile;
