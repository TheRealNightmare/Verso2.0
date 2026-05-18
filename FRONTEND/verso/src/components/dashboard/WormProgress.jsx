import { wormProgress } from '../../mocks/dashboard';

const WormProgress = () => {
  const pct = Math.min(100, Math.max(0, (wormProgress.value / wormProgress.max) * 100));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="text-base font-semibold text-[#1e3a5f] mb-4">Worm progress</h2>
      <div className="relative h-3 rounded-full bg-slate-100 overflow-visible">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#4f7aa3] to-[#bcd2e8] transition-all"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute -top-3 -translate-x-1/2 text-lg select-none"
          style={{ left: `${pct}%` }}
          aria-hidden
        >
          🐌
        </div>
      </div>
    </div>
  );
};

export default WormProgress;
