import { Eye, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/dashboard/StatCard';
import HoursSpentChart from '../components/dashboard/HoursSpentChart';
import PerformanceGauge from '../components/dashboard/PerformanceGauge';
import WormProgress from '../components/dashboard/WormProgress';
import LeaderBoard from '../components/dashboard/LeaderBoard';
import ProfileCard from '../components/dashboard/ProfileCard';
import MiniCalendar from '../components/dashboard/MiniCalendar';
import TodoList from '../components/dashboard/TodoList';
import { dashboardStats } from '../mocks/dashboard';

const Dashboard = () => {
  const { user } = useAuth();
  const displayName = user?.name || 'Peter';

  const handleStatAction = (label) => {
    console.log('stat card clicked:', label);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <section className="flex-1 min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">
            Hello, {displayName} <span aria-hidden>👋</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Let's read something new today!
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Book"
            value={dashboardStats.totalBooks}
            icon={Eye}
            onAction={handleStatAction}
          />
          <StatCard
            label="Completed"
            value={dashboardStats.completed}
            icon={Clock}
            onAction={handleStatAction}
          />
          <StatCard
            label="Quiz Score"
            value={dashboardStats.quizScore}
            icon={Clock}
            onAction={handleStatAction}
          />
          <StatCard
            label="Lesson"
            value={dashboardStats.lessons}
            icon={Clock}
            onAction={handleStatAction}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <HoursSpentChart />
          </div>
          <div className="space-y-4">
            <PerformanceGauge />
          </div>
        </div>

        <WormProgress />

        <LeaderBoard />
      </section>

      <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-4">
        <ProfileCard name={displayName} />
        <MiniCalendar />
        <TodoList />
      </aside>
    </div>
  );
};

export default Dashboard;
