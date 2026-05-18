import { Link } from 'react-router-dom';

const Event = () => {
  return (
    <div style={{ padding: '2rem', color: '#eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Events</h1>
        <Link to="/create-event">
          <button
            style={{
              padding: '10px 20px',
              border: 'none',
              background: '#4f83cc',
              color: 'white',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Create Event
          </button>
        </Link>
      </div>
      <p style={{ color: '#aaa' }}>No events yet.</p>
    </div>
  );
};

export default Event;
