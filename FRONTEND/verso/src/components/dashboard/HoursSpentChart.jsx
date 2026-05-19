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
  const maxHours = Math.max(80, ...data.map((d) => d.hours || 0));
  const rounded = Math.ceil(maxHours / 20) * 20;
  const ticks = [0, rounded / 4, rounded / 2, (3 * rounded) / 4, rounded].map((v) => Math.round(v));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-full">
      <h2 className="text-base font-semibold text-[#1e3a5f] mb-4">Hours Spent</h2>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
              label={{ value: 'Hr', angle: 0, position: 'insideTopLeft', fontSize: 10, fill: '#64748b' }}
            />
            <Bar dataKey="hours" radius={[6, 6, 0, 0]} barSize={28}>
              {data.map((_, idx) => (
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
