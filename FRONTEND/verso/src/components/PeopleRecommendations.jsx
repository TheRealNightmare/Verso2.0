import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Check } from 'lucide-react';
import Avatar from './ui/Avatar';
import { sendFriendRequest } from '../api/friends';

const STATUS_LABEL = {
  friends: 'Friends',
  request_sent: 'Requested',
  request_received: 'Respond',
};

const PersonCard = ({ person }) => {
  const [status, setStatus] = useState(person.friendStatus || 'none');
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy || status !== 'none') return;
    setBusy(true);
    setStatus('request_sent'); // optimistic
    try {
      await sendFriendRequest(person.id);
    } catch {
      setStatus('none'); // revert on failure
    } finally {
      setBusy(false);
    }
  };

  const genres = (person.sharedGenres || []).slice(0, 3);

  return (
    <div className="w-40 shrink-0 rounded-xl border border-slate-200 p-3 flex flex-col items-center text-center">
      <Link to={`/users/${person.id}`} className="flex flex-col items-center">
        <Avatar src={person.avatarUrl} name={person.name} className="w-14 h-14" textClass="text-base" />
        <p className="mt-2 text-sm font-semibold text-slate-800 truncate max-w-[8rem]">{person.name}</p>
      </Link>
      {person.role && (
        <span className="mt-0.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{person.role}</span>
      )}
      {genres.length > 0 && (
        <p className="mt-1 text-xs text-[#5b7c99] line-clamp-2">Also loves {genres.join(', ')}</p>
      )}
      <button
        type="button"
        onClick={add}
        disabled={busy || status !== 'none'}
        className={`mt-2 w-full inline-flex items-center justify-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg ${
          status === 'none'
            ? 'bg-[#4f83cc] text-white hover:bg-[#3f6ab0]'
            : 'bg-slate-100 text-slate-500 cursor-default'
        }`}
      >
        {status === 'none' ? (
          <><UserPlus size={13} /> Add friend</>
        ) : (
          <><Check size={13} /> {STATUS_LABEL[status] || 'Added'}</>
        )}
      </button>
    </div>
  );
};

const PeopleRecommendations = ({ people }) => {
  if (!people || people.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">People you may like</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {people.map((p) => (
          <PersonCard key={p.id} person={p} />
        ))}
      </div>
    </section>
  );
};

export default PeopleRecommendations;
