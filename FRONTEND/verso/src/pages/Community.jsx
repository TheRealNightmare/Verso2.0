const Community = () => {
  return (
    <div className="flex h-[calc(100vh-10rem)] bg-white rounded-xl overflow-hidden shadow-sm">
      <div className="w-72 border-r border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Friends</h2>

        <div className="p-3 my-2 bg-slate-100 rounded-lg text-slate-700">John Doe</div>
        <div className="p-3 my-2 bg-slate-100 rounded-lg text-slate-700">Sarah</div>
        <div className="p-3 my-2 bg-slate-100 rounded-lg text-slate-700">Alex</div>
        <div className="p-3 my-2 bg-slate-100 rounded-lg text-slate-700">Emma</div>
      </div>

      <div className="flex-1 flex flex-col p-5">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-xs px-3 py-2 my-2 rounded-2xl bg-slate-200 text-slate-700">
            Hello!
          </div>
          <div className="max-w-xs px-3 py-2 my-2 rounded-2xl bg-[#4f83cc] text-white ml-auto">
            Hi there 👋
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4f83cc]/30"
          />
          <button className="px-5 py-3 rounded-lg bg-[#4f83cc] text-white hover:bg-[#3f6ab0]">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Community;
