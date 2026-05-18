import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

const MiniCalendar = () => {
  const today = new Date();
  const [anchor, setAnchor] = useState(() => startOfWeek(today));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() + i);
    return d;
  });

  const monthLabel = `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;

  const shift = (delta) => {
    const next = new Date(anchor);
    next.setDate(anchor.getDate() + delta);
    setAnchor(next);
  };

  const isToday = (d) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => shift(-7)}
          className="text-slate-500 hover:text-[#1e3a5f] p-1 rounded-full hover:bg-slate-100"
          aria-label="Previous week"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-slate-700">{monthLabel}</span>
        <button
          type="button"
          onClick={() => shift(7)}
          className="text-slate-500 hover:text-[#1e3a5f] p-1 rounded-full hover:bg-slate-100"
          aria-label="Next week"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d, i) => (
          <div key={`l-${i}`} className="text-[10px] text-slate-400">
            {DAY_LETTERS[d.getDay()]}
          </div>
        ))}
        {days.map((d) => {
          const active = isToday(d);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => console.log('calendar day clicked', d.toISOString())}
              className={`w-7 h-7 mx-auto rounded-full text-xs flex items-center justify-center transition-colors ${
                active
                  ? 'bg-[#1e3a5f] text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
