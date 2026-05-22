import Avatar from '../ui/Avatar';

const AvatarPanel = ({ avatarUrl, name, onChangePhoto, onLogout }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar
        src={avatarUrl}
        name={name}
        className="w-44 h-44 shadow-sm"
        textClass="text-6xl"
      />
      <button
        type="button"
        onClick={onChangePhoto}
        className="px-6 py-2 rounded-lg bg-[#5b7c99] text-white text-sm font-medium hover:bg-[#4a6a85]"
      >
        Change Photo
      </button>
      <button
        type="button"
        onClick={onLogout}
        className="px-8 py-2 rounded-lg bg-[#5b7c99] text-white text-sm font-medium hover:bg-[#4a6a85]"
      >
        log out
      </button>
    </div>
  );
};

export default AvatarPanel;
