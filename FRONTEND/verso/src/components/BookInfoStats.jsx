import React from 'react';

const StatBox = ({ label, value }) => (
  <div className="flex flex-col rounded-lg bg-slate-50 px-4 py-3">
    <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
    <span className="text-sm font-medium text-slate-700 mt-1">{value}</span>
  </div>
);

const BookInfoStats = ({ author, genre, producer, status }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
      <StatBox label="Author" value={author} />
      <StatBox label="Genre" value={genre} />
      <StatBox label="Producer" value={producer} />
      <StatBox label="Release status" value={status} />
    </div>
  );
};

export default BookInfoStats;
