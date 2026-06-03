import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const COLORS = ['#3b5d7e', '#2c4a66', '#3b5d7e', '#1e3a5f', '#4f7aa3'];

const HoursSpentChart = ({ data = [] }) => {
  const [unit, setUnit] = useState('minutes'); // 'minutes' | 'hours'

  const chartData = data.map((d) => {
    const minutes = d.minutes ?? 0;
    const value =
      unit === 'hours' ? Math.round((minutes / 60) * 10) / 10 : minutes;
    return { month: d.month, value };
  });

  const axisLabel = unit === 'hours' ? 'Hr' : 'Min';
  const minTop = unit === 'hours' ? 4 : 20;
  const maxValue = Math.max(...chartData.map((d) => d.value || 0), 0);
  const rounded = Math.max(minTop, Math.ceil(maxValue / minTop) * minTop);
  const ticks = [0, rounded / 4, rounded / 2, (3 * rounded) / 4, rounded].map(
    (v) => Math.round(v * 10) / 10
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[#1e3a5f]">Time Spent</h2>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="text-xs text-slate-500 bg-transparent border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#1e3a5f] cursor-pointer"
        >
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
        </select>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
              domain={[0, rounded]}
              ticks={ticks}
              tickFormatter={(v) => `${v}`}
              label={{ value: axisLabel, angle: 0, position: 'insideTopLeft', fontSize: 10, fill: '#64748b' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={28}>
              {chartData.map((_, idx) => (
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
