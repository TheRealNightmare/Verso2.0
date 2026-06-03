import { useEffect, useState, useCallback } from 'react';
import { Eye, BookOpen, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/dashboard/StatCard';
import HoursSpentChart from '../components/dashboard/HoursSpentChart';
import PerformanceGauge from '../components/dashboard/PerformanceGauge';
import WormProgress from '../components/dashboard/WormProgress';
import QuizzesCard from '../components/dashboard/QuizzesCard';
import LeaderBoard from '../components/dashboard/LeaderBoard';
import ProfileCard from '../components/dashboard/ProfileCard';
import MiniCalendar from '../components/dashboard/MiniCalendar';
import TodoList from '../components/dashboard/TodoList';
import Spinner from '../components/ui/Spinner';
import { getDashboardSummary, dashboardKey } from '../api/dashboard';
import { readCache, invalidatePrefix } from '../lib/cache';
import usePageTitle from '../hooks/usePageTitle';

const Dashboard = () => {
  const { user } = useAuth();
  usePageTitle('Dashboard');
  const [summary, setSummary] = useState(() => readCache(dashboardKey('monthly'))?.data ?? null);
  const [range, setRange] = useState('monthly');
  const [loading, setLoading] = useState(() => !readCache(dashboardKey('monthly')));
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async (r) => {
    // Show a cached copy of this range immediately (no spinner) and revalidate.
    const cached = readCache(dashboardKey(r))?.data ?? null;
    setSummary(cached);
    setLoading(!cached);
    setError(null);
    try {
      const data = await getDashboardSummary({ range: r });
      setSummary(data);
    } catch (err) {
      if (!cached) setError(err?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary(range);
  }, [range, fetchSummary]);

  const displayName = summary?.profile?.name || user?.name || 'Reader';

  const handleStatAction = (label) => {
    console.log('stat card clicked:', label);
  };

  const handleProfileUpdated = (updated) => {
    setSummary((prev) =>
      prev
        ? {
            ...prev,
            profile: {
              ...prev.profile,
              name: updated.name,
              role: updated.role,
              avatarUrl: updated.avatarUrl,
            },
          }
        : prev,
    );
  };

  if (loading && !summary) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        <Spinner label="Loading dashboard…" />
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="p-8 text-center text-red-500 text-sm">{error}</div>
    );
  }

  const stats = summary?.stats ?? { reading: 0, completed: 0, quizScore: 0 };

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

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Reading Now" value={stats.reading} icon={Eye} onAction={handleStatAction} />
          <StatCard label="Completed" value={stats.completed} icon={BookOpen} onAction={handleStatAction} />
          <StatCard label="Quiz Score" value={stats.quizScore} icon={Award} onAction={handleStatAction} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <HoursSpentChart data={summary?.hoursSpent ?? []} />
          </div>
          <div className="space-y-4">
            <PerformanceGauge
              data={summary?.performance}
              range={range}
              onRangeChange={setRange}
            />
          </div>
        </div>

        <WormProgress
          value={summary?.worm?.value ?? 0}
          max={summary?.worm?.max ?? 100}
        />

        <QuizzesCard onQuizCompleted={() => { invalidatePrefix('dashboard:'); fetchSummary(range); }} />

        <LeaderBoard rows={summary?.leaderboard ?? []} />
      </section>

      <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-4">
        <ProfileCard profile={summary?.profile} onUpdated={handleProfileUpdated} />
        <MiniCalendar marks={summary?.calendarMarks ?? []} />
        <TodoList initialItems={summary?.todos ?? []} />
      </aside>
    </div>
  );
};

export default Dashboard;
