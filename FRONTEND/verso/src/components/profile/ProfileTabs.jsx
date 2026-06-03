/**
 * Accessible tab bar. `tabs` is an array of { key, label, count }. The active
 * tab key and the change handler are controlled by the parent.
 */
const ProfileTabs = ({ tabs, active, onChange }) => (
  <div role="tablist" aria-label="Profile sections" className="flex gap-1 border-b border-slate-200">
    {tabs.map((tab) => {
      const selected = tab.key === active;
      return (
        <button
          key={tab.key}
          role="tab"
          type="button"
          aria-selected={selected}
          onClick={() => onChange(tab.key)}
          className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            selected
              ? 'border-[#5b7c99] text-[#5b7c99]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab.label}
          {typeof tab.count === 'number' && (
            <span className="ml-1.5 text-xs text-slate-400">{tab.count}</span>
          )}
        </button>
      );
    })}
  </div>
);

export default ProfileTabs;
