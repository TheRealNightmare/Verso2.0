import { X } from 'lucide-react';
import Modal from './ui/Modal';

const FALLBACK_CAT = { bg: '#e2e8f0', text: '#1e293b', label: '' };

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const EventDetailModal = ({ event, categories = {}, onClose }) => {
  if (!event) return null;
  const cat = categories[event.category] || categories.movie || FALLBACK_CAT;

  return (
    <Modal onClose={onClose} label={event.title} panelClassName="bg-white rounded-xl shadow-lg overflow-hidden max-w-md">
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ backgroundColor: cat.bg, color: cat.text }}
        >
          <div>
            <div className="text-xs uppercase tracking-wide opacity-80">{cat.label}</div>
            <h3 className="text-lg font-semibold">{event.title}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-black/10">
            <X size={18} />
          </button>
        </div>
        {event.cover_image_url && (
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-5 space-y-3">
          <div>
            <div className="text-xs text-slate-500">Date</div>
            <div className="text-sm text-slate-800">{formatDate(event.date)}</div>
          </div>
          {(event.time_from || event.time_to) && (
            <div>
              <div className="text-xs text-slate-500">Time</div>
              <div className="text-sm text-slate-800">
                {event.time_from} – {event.time_to}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs text-slate-500">Hosted by</div>
            <div className="text-sm text-slate-800">{event.host}</div>
          </div>
          {event.location && (
            <div>
              <div className="text-xs text-slate-500">Location</div>
              <div className="text-sm text-slate-800">{event.location}</div>
            </div>
          )}
          {event.subtitle && (
            <div>
              <div className="text-xs text-slate-500">Featuring</div>
              <div className="text-sm text-slate-800">{event.subtitle}</div>
            </div>
          )}
          {event.description && (
            <div>
              <div className="text-xs text-slate-500">Details</div>
              <p className="text-sm text-slate-700 leading-relaxed">{event.description}</p>
            </div>
          )}
        </div>
    </Modal>
  );
};

export default EventDetailModal;
