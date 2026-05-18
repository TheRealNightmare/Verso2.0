import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { hoursSpentData } from '../../mocks/dashboard';

const COLORS = ['#3b5d7e', '#2c4a66', '#3b5d7e', '#1e3a5f', '#4f7aa3'];

const HoursSpentChart = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-full">
      <h2 className="text-base font-semibold text-[#1e3a5f] mb-4">Hours Spent</h2>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hoursSpentData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              domain={[0, 80]}
              ticks={[0, 20, 40, 60, 80]}
              tickFormatter={(v) => `${v}`}
              label={{ value: 'Hr', angle: 0, position: 'insideTopLeft', fontSize: 10, fill: '#64748b' }}
            />
            <Bar dataKey="hours" radius={[6, 6, 0, 0]} barSize={28}>
              {hoursSpentData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HoursSpentChart;
