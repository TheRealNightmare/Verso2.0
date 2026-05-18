import { Link } from 'react-router-dom';

const Event = () => {
  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Events</h1>
        <Link to="/create-event">
          <button className="px-5 py-2 rounded-lg bg-[#4f83cc] text-white hover:bg-[#3f6ab0]">
            Create Event
          </button>
        </Link>
      </div>
      <p className="text-slate-400">No events yet.</p>
    </div>
  );
};

export default Event;
