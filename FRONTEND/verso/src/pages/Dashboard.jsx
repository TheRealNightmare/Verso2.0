import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <div className="top-bar">
          <h1>Hello, Peter 👋</h1>
        </div>

        <div className="stats-container">
          <div className="card">
            <h3>Total Books</h3>
            <p>5000</p>
          </div>

          <div className="card">
            <h3>Completed</h3>
            <p>68</p>
          </div>

          <div className="card">
            <h3>Quiz Score</h3>
            <p>92%</p>
          </div>

          <div className="card">
            <h3>Lessons</h3>
            <p>12</p>
          </div>
        </div>

        <div className="performance-section">
          <div className="chart-box">
            <h2>Hours Spent</h2>
            <div className="fake-chart"></div>
          </div>

          <div className="progress-box">
            <h2>Performance</h2>
            <div className="circle">75%</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
