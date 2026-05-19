import { useEffect } from 'react';

const SuccessToast = ({ message, show, onDismiss, duration = 2500 }) => {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [show, onDismiss, duration]);

  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-6 py-2 rounded-lg bg-[#cdd9e3] text-[#2a3b4d] text-sm font-medium shadow">
      {message}
    </div>
  );
};

export default SuccessToast;
