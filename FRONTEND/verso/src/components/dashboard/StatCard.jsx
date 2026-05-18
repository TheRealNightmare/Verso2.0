const StatCard = ({ label, value, icon: Icon, onAction }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between min-h-[100px]">
      <h3 className="text-sm font-medium text-slate-500">{label}</h3>
      <div className="flex items-end justify-between mt-2">
        <p className="text-2xl font-bold text-[#1e3a5f]">{value}</p>
        <button
          type="button"
          onClick={() => onAction?.(label)}
          className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center hover:scale-105 transition-transform"
          aria-label={`${label} details`}
        >
          {Icon ? <Icon size={16} /> : null}
        </button>
      </div>
    </div>
  );
};

export default StatCard;
