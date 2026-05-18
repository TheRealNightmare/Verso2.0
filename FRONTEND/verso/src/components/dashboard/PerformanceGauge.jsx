import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { performance as perfMock } from '../../mocks/dashboard';

const RANGES = ['Weekly', 'Monthly', 'Yearly'];

const PerformanceGauge = () => {
  const [range, setRange] = useState('Monthly');
  const [open, setOpen] = useState(false);

  const filled = (perfMock.point / perfMock.max) * 100;
  const data = [
    { name: 'progress', value: filled },
    { name: 'rest', value: 100 - filled },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-full flex flex-col">
      <h2 className="text-base font-semibold text-[#1e3a5f] mb-3">Performance</h2>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-slate-100">
          <span className="w-2 h-2 rounded-full bg-[#1e3a5f]" />
          <span className="text-xs text-slate-600">Point Progress</span>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-slate-600 px-2 py-1 rounded-md hover:bg-slate-100"
          >
            {range}
            <ChevronDown size={14} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-md z-10 w-24">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRange(r);
                    setOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 ${
                    range === r ? 'text-[#1e3a5f] font-semibold' : 'text-slate-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex-1 min-h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="80%"
              innerRadius={55}
              outerRadius={80}
              startAngle={180}
              endAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="#1e3a5f" />
              <Cell fill="#e2e8f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-x-0 bottom-2 text-center">
          <p className="text-xs text-slate-500">Your Point:</p>
          <p className="text-lg font-bold text-[#1e3a5f]">{perfMock.point.toFixed(3)}</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceGauge;
