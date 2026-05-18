import { useState } from 'react';
import { Edit2, Shield } from 'lucide-react';
import { profileMock } from '../../mocks/dashboard';

const ProfileCard = ({ name }) => {
  const [pulse, setPulse] = useState(false);

  const handleEdit = () => {
    console.log('edit profile');
    setPulse(true);
    setTimeout(() => setPulse(false), 300);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-[#1e3a5f]">Profile</h2>
        <button
          type="button"
          onClick={handleEdit}
          className={`text-slate-500 hover:text-[#1e3a5f] transition-transform ${
            pulse ? 'scale-125' : 'scale-100'
          }`}
          aria-label="Edit profile"
        >
          <Edit2 size={16} />
        </button>
      </div>
      <div className="flex flex-col items-center">
        <div className="relative">
          <img
            src={profileMock.avatarUrl}
            alt={name || profileMock.name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-100"
          />
          <div className="absolute -right-1 bottom-1 w-6 h-6 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center">
            <Shield size={12} />
          </div>
        </div>
        <p className="mt-3 font-semibold text-slate-800">{name || profileMock.name}</p>
        <p className="text-xs text-slate-500">{profileMock.role}</p>
      </div>
    </div>
  );
};

export default ProfileCard;
