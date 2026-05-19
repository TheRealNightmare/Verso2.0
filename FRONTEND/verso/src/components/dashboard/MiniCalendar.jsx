import { useState, useMemo } from 'react';
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

function toISODate(d) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
}

const MiniCalendar = ({ marks = [] }) => {
  const today = new Date();
  const [anchor, setAnchor] = useState(() => startOfWeek(today));
  const markSet = useMemo(() => new Set(marks), [marks]);

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
          const marked = markSet.has(toISODate(d));
          return (
            <div key={d.toISOString()} className="flex flex-col items-center">
              <button
                type="button"
                className={`w-7 h-7 rounded-full text-xs flex items-center justify-center transition-colors ${
                  active
                    ? 'bg-[#1e3a5f] text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {d.getDate()}
              </button>
              <span
                className={`mt-0.5 w-1 h-1 rounded-full ${
                  marked ? 'bg-[#4f7aa3]' : 'bg-transparent'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
