import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

// Promise-based confirmation dialog (Rules 4, 5, 6, 7). Replaces native confirm() and
// guards destructive actions: `const ok = await confirm({ ... })`.
const ConfirmContext = createContext(null);

const DEFAULTS = {
  title: 'Are you sure?',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
};

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState(null); // { ...options } | null
  const resolver = useRef(null);

  const confirm = useCallback((options = {}) => {
    setState({ ...DEFAULTS, ...options });
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((result) => {
    setState(null);
    resolver.current?.(result);
    resolver.current = null;
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <Modal onClose={() => close(false)} label={state.title} panelClassName="bg-white rounded-xl shadow-lg max-w-sm">
          <div className="p-5">
            <h3 className="text-base font-semibold text-slate-800">{state.title}</h3>
            {state.message && (
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{state.message}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => close(false)}>
                {state.cancelLabel}
              </Button>
              <Button
                variant={state.danger ? 'danger' : 'primary'}
                size="sm"
                onClick={() => close(true)}
              >
                {state.confirmLabel}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
};
