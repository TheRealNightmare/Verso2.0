import './Community.css';

const Community = () => {
  return (
    <div className="community-container">
      <div className="friends-list">
        <h2>Friends</h2>

        <div className="friend">John Doe</div>
        <div className="friend">Sarah</div>
        <div className="friend">Alex</div>
        <div className="friend">Emma</div>
      </div>

      <div className="chat-section">
        <div className="messages">
          <div className="message received">Hello!</div>
          <div className="message sent">Hi there 👋</div>
        </div>

        <div className="chat-input">
          <input type="text" placeholder="Type a message..." />
          <button>Send</button>
        </div>
      </div>
    </div>
  );
};

export default Community;
