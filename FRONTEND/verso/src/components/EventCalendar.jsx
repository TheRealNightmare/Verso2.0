import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FALLBACK_CAT = { bg: '#e2e8f0', text: '#1e293b' };

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n) => String(n).padStart(2, '0');
const ymd = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const buildGrid = (viewDate) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startWeekday);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return {
      date: d,
      inMonth: d.getMonth() === month,
      iso: ymd(d),
    };
  });
};

const EventCalendar = ({ events = [], categories = {}, onEventClick }) => {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const todayIso = ymd(new Date());

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const e of events) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => buildGrid(viewDate), [viewDate]);

  const goPrev = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const goNext = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <button
          onClick={goPrev}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-sm font-semibold text-slate-700">
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h3>
        <button
          onClick={goNext}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell, idx) => {
          const dayEvents = eventsByDate[cell.iso] || [];
          return (
            <div
              key={idx}
              className={`relative border-r border-b border-slate-200 min-h-[90px] p-1.5 ${
                cell.inMonth ? 'bg-white' : 'bg-slate-50'
              } ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''} ${
                cell.iso === todayIso ? 'ring-2 ring-inset ring-[#4f83cc]' : ''
              }`}
            >
              <span
                className={`text-xs ${
                  cell.inMonth ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {cell.date.getDate()}
              </span>

              {dayEvents.map((ev) => {
                const cat = categories[ev.category] || categories.movie || FALLBACK_CAT;
                return (
                  <button
                    key={ev.id}
                    onClick={() => onEventClick?.(ev)}
                    className="mt-1 w-full text-left rounded px-1.5 py-1 leading-tight hover:opacity-90"
                    style={{ backgroundColor: cat.bg, color: cat.text }}
                  >
                    <div className="text-[11px] font-semibold truncate">{ev.title}</div>
                    <div className="text-[9px] opacity-80 truncate">{ev.subtitle}</div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7 bg-slate-50 border-t border-slate-200">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-[10px] tracking-wider text-slate-500 text-center py-1.5"
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventCalendar;
