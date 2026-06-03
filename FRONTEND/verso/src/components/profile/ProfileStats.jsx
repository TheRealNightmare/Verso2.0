import { BookOpen, Heart, Star, Timer } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-5 transition-shadow hover:shadow-sm">
    <Icon size={20} className="text-[#5b7c99]" />
    <span className="mt-2 text-xl font-semibold text-slate-800">{value}</span>
    <span className="text-xs text-slate-400">{label}</span>
  </div>
);

const ProfileStats = ({ stats }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <StatCard icon={BookOpen} label="Books read" value={stats?.booksCompleted ?? 0} />
    <StatCard icon={Heart} label="Favorites" value={stats?.favorites ?? 0} />
    <StatCard icon={Star} label="Reviews" value={stats?.reviews ?? 0} />
    <StatCard icon={Timer} label="Hours read" value={stats?.hoursRead ?? 0} />
  </div>
);

export default ProfileStats;
