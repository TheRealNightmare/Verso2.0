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

const PersonRow = ({ person }) => {
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
  const label = STATUS_LABEL[status];

  return (
    <li className="flex items-center gap-3">
      <Link to={`/users/${person.id}`} className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar src={person.avatarUrl} name={person.name} className="w-10 h-10 shrink-0" textClass="text-sm" />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-800 truncate">{person.name}</span>
            {person.role && (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{person.role}</span>
            )}
          </span>
          {person.promoted ? (
            <span className="mt-0.5 inline-block text-[11px] font-medium text-[#4f83cc]">
              ✨ {person.tag || 'New author'}
            </span>
          ) : (
            genres.length > 0 && (
              <span className="block text-xs text-[#5b7c99] line-clamp-1">Also loves {genres.join(', ')}</span>
            )
          )}
        </span>
      </Link>
      <button
        type="button"
        onClick={add}
        disabled={busy || status !== 'none'}
        aria-label={status === 'none' ? `Add ${person.name} as friend` : label}
        className={`shrink-0 inline-flex items-center justify-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg ${
          status === 'none'
            ? 'bg-[#4f83cc] text-white hover:bg-[#3f6ab0]'
            : 'bg-slate-100 text-slate-500 cursor-default'
        }`}
      >
        {status === 'none' ? (
          <><UserPlus size={13} /> Add</>
        ) : (
          <><Check size={13} /> {label || 'Added'}</>
        )}
      </button>
    </li>
  );
};

const PeopleRecommendations = ({ people }) => {
  if (!people || people.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">People you may like</h2>
      <ul className="flex flex-col gap-4">
        {people.slice(0, 5).map((p) => (
          <PersonRow key={p.id} person={p} />
        ))}
      </ul>
    </section>
  );
};

export default PeopleRecommendations;
