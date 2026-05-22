import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

// Global feedback channel (Rule 3). Reuses the look of the old profile SuccessToast
// (#cdd9e3 pill, top-center, auto-dismiss) and adds a red error variant.
const ToastContext = createContext(null);

let nextId = 0;

const VARIANT_STYLE = {
  success: 'bg-[#cdd9e3] text-[#2a3b4d]',
  error: 'bg-red-100 text-red-700',
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, variant = 'success', duration = 2800) => {
      const id = ++nextId;
      setToasts((list) => [...list, { id, message, variant }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (msg, duration) => push(msg, 'success', duration),
      error: (msg, duration) => push(msg, 'error', duration),
      show: push,
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2">
        {toasts.map((t) => {
          const Icon = t.variant === 'error' ? AlertCircle : CheckCircle2;
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium shadow ${VARIANT_STYLE[t.variant]}`}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="ml-1 rounded p-0.5 hover:bg-black/10"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
