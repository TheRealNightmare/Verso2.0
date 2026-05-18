import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="p-2 text-slate-700">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Profile</h1>
      <p className="mb-2">
        <strong>Name:</strong> {user?.name ?? '—'}
      </p>
      <p>
        <strong>Email:</strong> {user?.email ?? '—'}
      </p>
    </div>
  );
};

export default Profile;
