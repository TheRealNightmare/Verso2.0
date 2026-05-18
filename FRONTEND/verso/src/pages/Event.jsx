import { useState } from 'react';
import { Link } from 'react-router-dom';
import EventCalendar from '../components/EventCalendar';
import EventDetailModal from '../components/EventDetailModal';
import { mockEvents, mockUpcoming } from '../mocks/events';

const Event = () => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="p-2 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Events:</h1>
      </div>
      <Link to="/create-event">
        <button className="mb-4 px-5 py-2 rounded-lg bg-[#4f83cc] text-white text-sm hover:bg-[#3f6ab0]">
          Create New
        </button>
      </Link>

      <EventCalendar events={mockEvents} onEventClick={setSelected} />

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Up coming events:</h2>
        <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
          {mockUpcoming.map((u) => (
            <div
              key={u.id}
              className="bg-[#dde7f0] border border-[#c7d4e0] rounded-lg px-5 py-4 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="text-xs text-slate-500 mb-1">Hosted by {u.host}</div>
                <div className="text-sm font-semibold text-slate-800">{u.title}</div>
                <div className="text-xs text-slate-600 mt-1">{u.description}</div>
              </div>
              <div className="text-xs text-slate-600 whitespace-nowrap pt-1">{u.date}</div>
            </div>
          ))}
        </div>
      </div>

      <EventDetailModal event={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Event;
