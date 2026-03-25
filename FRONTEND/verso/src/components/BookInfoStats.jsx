import React from 'react';

// Sub-component for individual items
const StatBox = ({ label, value }) => (
  <div className="stat-box">
    <span className="stat-label">{label}</span>
    <span className="stat-value">{value}</span>
  </div>
);

const BookInfoStats = ({ author, genre, producer, status }) => {
  return (
    <div className="book-stats-container">
      <StatBox label="Author" value={author} />
      <StatBox label="Genre" value={genre} />
      <StatBox label="Producer" value={producer} />
      <StatBox label="Release status" value={status} />
    </div>
  );
};

export default BookInfoStats;