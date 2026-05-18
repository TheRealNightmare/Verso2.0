import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { todoItems as initialTodos } from '../../mocks/dashboard';

const TodoList = () => {
  const [items, setItems] = useState(initialTodos);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');

  const toggle = (id) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it))
    );
  };

  const remove = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const submitNew = () => {
    if (!newTitle.trim()) {
      setAdding(false);
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: `t-${Date.now()}`,
        title: newTitle.trim(),
        subtitle: '',
        time: newTime.trim(),
        done: false,
      },
    ]);
    setNewTitle('');
    setNewTime('');
    setAdding(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-[#1e3a5f]">To Do List</h2>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-slate-500 hover:text-[#1e3a5f] p-1 rounded-full hover:bg-slate-100"
          aria-label="Add task"
        >
          <Plus size={16} />
        </button>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="group flex items-start gap-2"
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                item.done
                  ? 'bg-[#1e3a5f] border-[#1e3a5f] text-white'
                  : 'border-slate-300 bg-white hover:border-[#1e3a5f]'
              }`}
              aria-label={item.done ? 'Mark incomplete' : 'Mark complete'}
            >
              {item.done && <Check size={12} strokeWidth={3} />}
            </button>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm leading-tight ${
                  item.done ? 'line-through text-slate-400' : 'text-slate-700'
                }`}
              >
                {item.title}
              </p>
              {(item.subtitle || item.time) && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {item.subtitle}
                  {item.subtitle && item.time && '  '}
                  {item.time && (
                    <span className="ml-1 text-slate-500">{item.time}</span>
                  )}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
              aria-label="Delete task"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>

      {adding && (
        <div className="mt-3 flex gap-2 items-center">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitNew();
              if (e.key === 'Escape') {
                setAdding(false);
                setNewTitle('');
                setNewTime('');
              }
            }}
            placeholder="New task"
            className="flex-1 text-sm border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-[#1e3a5f]"
          />
          <input
            type="text"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            placeholder="Time"
            className="w-20 text-xs border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-[#1e3a5f]"
          />
          <button
            type="button"
            onClick={submitNew}
            className="text-xs px-2 py-1 rounded-md bg-[#1e3a5f] text-white hover:bg-[#16304f]"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
};

export default TodoList;
