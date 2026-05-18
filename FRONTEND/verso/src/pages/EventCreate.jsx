import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, MapPin, Camera, Video } from 'lucide-react';
import { EVENT_CATEGORIES } from '../mocks/events';

const Label = ({ children, required }) => (
  <label className="block text-xs text-slate-700 mb-1">
    {children}
    {required && <span className="text-red-500">*</span>}
  </label>
);

const EventCreate = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');

  const inputCls =
    'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f83cc]/30';

  const requiredFilled = name && date && from && to && category && location;

  const handleCreate = () => {
    if (!requiredFilled) return;
    const payload = { name, date, from, to, category, location, details };
    console.log('Create event payload:', payload);
    navigate('/events');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/events"
        className="inline-flex items-center gap-1 text-slate-700 hover:text-[#4f83cc] text-sm font-semibold mb-6"
      >
        <ChevronLeft size={18} />
        Back
      </Link>

      <div className="px-2 sm:px-8 py-2">
        <div className="mb-4">
          <Label required>Event Name</Label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="mb-4">
          <Label required>Event Date</Label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${inputCls} pr-10`}
            />
            <Calendar
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={16}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label required>Event Time</Label>
            <div className="space-y-2">
              <div>
                <div className="text-[11px] text-slate-500 mb-1">From</div>
                <input
                  type="time"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 mb-1">To</div>
                <input
                  type="time"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label required>Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
              >
                <option value="">Select a category</option>
                {Object.values(EVENT_CATEGORIES).map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label required>Location</Label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`${inputCls} pr-10`}
                />
                <MapPin
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <Label>Event Details</Label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Enter the event details."
              className={`${inputCls} h-32 resize-none`}
            />
          </div>

          <div>
            <Label>Upload Media</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex flex-col items-center justify-center gap-1 py-6 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
              >
                <Camera size={22} className="text-[#4f83cc]" />
                <span className="text-xs text-slate-600">Photo</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center justify-center gap-1 py-6 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
              >
                <Video size={22} className="text-[#4f83cc]" />
                <span className="text-xs text-slate-600">Video</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/events')}
            className="px-8 py-2 rounded-md border border-slate-300 text-slate-700 text-sm hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!requiredFilled}
            className="px-8 py-2 rounded-md bg-[#4f83cc] text-white text-sm hover:bg-[#3f6ab0] disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCreate;
