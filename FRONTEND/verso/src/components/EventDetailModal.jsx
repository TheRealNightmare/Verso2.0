import { X } from 'lucide-react';
import { EVENT_CATEGORIES } from '../mocks/events';

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const EventDetailModal = ({ event, onClose }) => {
  if (!event) return null;
  const cat = EVENT_CATEGORIES[event.category] || EVENT_CATEGORIES.movie;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ backgroundColor: cat.bg, color: cat.text }}
        >
          <div>
            <div className="text-xs uppercase tracking-wide opacity-80">{cat.label}</div>
            <h3 className="text-lg font-semibold">{event.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/10">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <div className="text-xs text-slate-500">Date</div>
            <div className="text-sm text-slate-800">{formatDate(event.date)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Hosted by</div>
            <div className="text-sm text-slate-800">{event.host}</div>
          </div>
          {event.subtitle && (
            <div>
              <div className="text-xs text-slate-500">Featuring</div>
              <div className="text-sm text-slate-800">{event.subtitle}</div>
            </div>
          )}
          <div>
            <div className="text-xs text-slate-500">Details</div>
            <p className="text-sm text-slate-700 leading-relaxed">{event.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
