const Dashboard = () => {
  return (
    <div className="min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Hello, Peter 👋</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h3 className="text-sm text-slate-500">Total Books</h3>
          <p className="text-2xl font-bold text-slate-800 mt-2">5000</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h3 className="text-sm text-slate-500">Completed</h3>
          <p className="text-2xl font-bold text-slate-800 mt-2">68</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h3 className="text-sm text-slate-500">Quiz Score</h3>
          <p className="text-2xl font-bold text-slate-800 mt-2">92%</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h3 className="text-sm text-slate-500">Lessons</h3>
          <p className="text-2xl font-bold text-slate-800 mt-2">12</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-5 mt-8">
        <div className="flex-1 bg-white p-5 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Hours Spent</h2>
          <div className="h-52 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300" />
        </div>

        <div className="flex-1 bg-white p-5 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Performance</h2>
          <div className="w-32 h-32 rounded-full bg-[#4f83cc] text-white flex items-center justify-center text-2xl font-semibold mx-auto my-4">
            75%
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
