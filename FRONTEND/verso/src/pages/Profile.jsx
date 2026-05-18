import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '2rem', color: '#eee' }}>
      <h1>Profile</h1>
      <p>
        <strong>Name:</strong> {user?.name ?? '—'}
      </p>
      <p>
        <strong>Email:</strong> {user?.email ?? '—'}
      </p>
    </div>
  );
};

export default Profile;
