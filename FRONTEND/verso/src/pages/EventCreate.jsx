import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, MapPin, Camera, Video } from 'lucide-react';
import { createEvent } from '../api/events';
import { fetchEventCategories } from '../api/meta';
import { useToast } from '../context/ToastContext';
import usePageTitle from '../hooks/usePageTitle';

const Label = ({ children, required }) => (
  <label className="block text-xs text-slate-700 mb-1">
    {children}
    {required && <span className="text-red-500">*</span>}
  </label>
);

const EventCreate = () => {
  const navigate = useNavigate();
  const toast = useToast();
  usePageTitle('Create Event');
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [host, setHost] = useState('');
  const [date, setDate] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState({});

  useEffect(() => {
    fetchEventCategories()
      .then((data) => setCategories(data || {}))
      .catch(console.error);
  }, []);

  const inputCls =
    'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f83cc]/30';

  const requiredFilled = title && host && date && from && to && category && location;

  const handleCreate = async (e) => {
    e?.preventDefault?.();
    if (!requiredFilled || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('title', title);
      if (subtitle) fd.append('subtitle', subtitle);
      fd.append('host', host);
      fd.append('description', details);
      fd.append('date', date);
      fd.append('time_from', from);
      fd.append('time_to', to);
      fd.append('category', category);
      fd.append('location', location);
      if (coverImage) fd.append('cover_image', coverImage);
      await createEvent(fd);
      toast.success('Event created');
      navigate('/events');
    } catch (e) {
      setError(e?.message || 'Failed to create event');
      toast.error(e?.message || 'Failed to create event');
      setSubmitting(false);
    }
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

      <form onSubmit={handleCreate} className="px-2 sm:px-8 py-2">
        {error && (
          <div className="mb-3 px-4 py-2 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <Label required>Event Name</Label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="mb-4">
          <Label>Subtitle</Label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="mb-4">
          <Label required>Host</Label>
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
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
                {Object.values(categories).map((c) => (
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
              className="hidden"
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-1 py-6 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
              >
                <Camera size={22} className="text-[#4f83cc]" />
                <span className="text-xs text-slate-600">
                  {coverImage ? coverImage.name.slice(0, 18) : 'Photo'}
                </span>
              </button>
              <button
                type="button"
                disabled
                title="Video upload coming soon"
                className="flex flex-col items-center justify-center gap-1 py-6 bg-white border border-slate-200 rounded-md opacity-50 cursor-not-allowed"
              >
                <Video size={22} className="text-[#4f83cc]" />
                <span className="text-xs text-slate-600">Video</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="px-8 py-2 rounded-md border border-slate-300 text-slate-700 text-sm hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!requiredFilled || submitting}
            className="px-8 py-2 rounded-md bg-[#4f83cc] text-white text-sm hover:bg-[#3f6ab0] disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventCreate;
