import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EventCalendar from '../components/EventCalendar';
import EventDetailModal from '../components/EventDetailModal';
import Spinner from '../components/ui/Spinner';
import { fetchEvents } from '../api/events';
import { fetchEventCategories } from '../api/meta';
import usePageTitle from '../hooks/usePageTitle';

const Event = () => {
  usePageTitle('Events');
  const [selected, setSelected] = useState(null);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchEvents();
      setEvents(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  useEffect(() => {
    fetchEventCategories()
      .then((data) => setCategories(data || {}))
      .catch(console.error);
  }, []);

  const upcoming = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    return events
      .filter((e) => e.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);
  }, [events]);

  return (
    <div className="p-2 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Events:</h1>
      </div>
      <Link
        to="/create-event"
        className="inline-block mb-4 px-5 py-2 rounded-lg bg-[#4f83cc] text-white text-sm hover:bg-[#3f6ab0]"
      >
        Create New
      </Link>

      {error && (
        <div className="mb-3 px-4 py-2 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <EventCalendar events={events} categories={categories} onEventClick={setSelected} />

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Up coming events:</h2>
        <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="text-sm text-slate-500">
              <Spinner label="Loading…" />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-sm text-slate-500">No upcoming events.</div>
          ) : (
            upcoming.map((u) => (
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
            ))
          )}
        </div>
      </div>

      <EventDetailModal event={selected} categories={categories} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Event;
