import { Users, Circle } from 'lucide-react';

const CommunityInfoCard = ({ info }) => {
  if (!info) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 animate-pulse h-24" />
    );
  }

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-[#4f83cc] to-[#3f6ab0] text-white">
      <div className="text-sm font-semibold">{info.name}</div>
      <div className="text-xs text-white/80 mt-1 leading-snug">{info.description}</div>
      <div className="flex items-center gap-3 mt-3 text-xs">
        <span className="flex items-center gap-1.5">
          <Users size={12} />
          {info.memberCount} members
        </span>
        <span className="flex items-center gap-1.5">
          <Circle size={8} className="fill-green-400 text-green-400" />
          {info.onlineCount} online
        </span>
      </div>
    </div>
  );
};

export default CommunityInfoCard;
