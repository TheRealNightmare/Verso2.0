import React from 'react';

const StatBox = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm font-bold italic text-slate-800 mt-1">{value}</span>
  </div>
);

const BookInfoStats = ({ author, genre, producer, status }) => {
  return (
    <div className="border-b border-slate-200 pb-4 my-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Author" value={author} />
        <StatBox label="Genre" value={genre} />
        <StatBox label="Producer" value={producer} />
        <StatBox label="Release status" value={status} />
      </div>
    </div>
  );
};

export default BookInfoStats;
