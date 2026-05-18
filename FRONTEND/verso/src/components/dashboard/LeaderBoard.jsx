import { TrendingUp, TrendingDown } from 'lucide-react';
import { leaderboard } from '../../mocks/dashboard';

const LeaderBoard = () => {
  const handleRowClick = (row) => {
    console.log('leaderboard row clicked', row);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="text-base font-semibold text-[#1e3a5f] mb-4">Leader Board</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-400">
              <th className="text-left py-2 font-medium">Rank</th>
              <th className="text-left py-2 font-medium">Name</th>
              <th className="text-left py-2 font-medium">Course</th>
              <th className="text-left py-2 font-medium">Hour</th>
              <th className="text-left py-2 font-medium">Point</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row) => (
              <tr
                key={row.id}
                onClick={() => handleRowClick(row)}
                className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="py-3">
                  <div className="flex items-center gap-1 text-slate-700">
                    <span>{row.rank}</span>
                    {row.trend === 'up' ? (
                      <TrendingUp size={14} className="text-green-500" />
                    ) : (
                      <TrendingDown size={14} className="text-red-500" />
                    )}
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={row.avatar}
                      alt={row.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-slate-700">{row.name}</span>
                  </div>
                </td>
                <td className="py-3 text-slate-600">{row.course}</td>
                <td className="py-3 text-slate-600">{row.hour}</td>
                <td className="py-3 font-semibold text-[#1e3a5f]">
                  {row.point.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderBoard;
