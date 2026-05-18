import { useNavigate } from 'react-router-dom';

const EventCreate = () => {
  const navigate = useNavigate();

  const inputCls =
    'w-full px-4 py-3 mb-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f83cc]/30';

  return (
    <div className="min-h-full flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white p-10 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Create Event</h1>

        <input type="text" placeholder="Event Name" className={inputCls} />

        <input type="date" className={inputCls} />

        <div className="flex gap-3">
          <input type="time" className={inputCls} />

          <select className={inputCls}>
            <option>Category</option>
            <option>Workshop</option>
            <option>Seminar</option>
            <option>Contest</option>
          </select>
        </div>

        <input type="text" placeholder="Location" className={inputCls} />

        <textarea
          placeholder="Event Description"
          className="w-full px-4 py-3 mb-4 h-32 resize-none border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f83cc]/30"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={() => navigate('/events')}
            className="px-5 py-2 rounded-lg bg-slate-400 text-white hover:bg-slate-500"
          >
            Cancel
          </button>
          <button className="px-5 py-2 rounded-lg bg-[#4f83cc] text-white hover:bg-[#3f6ab0]">
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCreate;
