import { useNavigate } from 'react-router-dom';
import './EventCreate.css';

const EventCreate = () => {
  const navigate = useNavigate();

  return (
    <div className="event-create-container">
      <div className="event-form">
        <h1>Create Event</h1>

        <input type="text" placeholder="Event Name" />

        <input type="date" />

        <div className="row">
          <input type="time" />

          <select>
            <option>Category</option>
            <option>Workshop</option>
            <option>Seminar</option>
            <option>Contest</option>
          </select>
        </div>

        <input type="text" placeholder="Location" />

        <textarea placeholder="Event Description"></textarea>

        <div className="buttons">
          <button className="cancel-btn" onClick={() => navigate('/events')}>
            Cancel
          </button>
          <button>Create Event</button>
        </div>
      </div>
    </div>
  );
};

export default EventCreate;
