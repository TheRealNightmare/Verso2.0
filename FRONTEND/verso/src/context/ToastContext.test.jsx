import { describe, it, expect, vi } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './ToastContext';

// Small probe that exposes the toast API as buttons.
function Probe() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success('Saved!')}>ok</button>
      <button onClick={() => toast.error('Failed!')}>bad</button>
    </div>
  );
}

const renderWithToast = (ui) => render(<ToastProvider>{ui}</ToastProvider>);

describe('useToast', () => {
  it('throws outside a ToastProvider', () => {
    expect(() => renderHook(() => useToast())).toThrow(/ToastProvider/);
  });
});

describe('ToastProvider', () => {
  it('shows a success toast with a polite status role', async () => {
    const user = userEvent.setup();
    renderWithToast(<Probe />);

    await user.click(screen.getByText('ok'));

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Saved!');
  });

  it('shows an error toast', async () => {
    const user = userEvent.setup();
    renderWithToast(<Probe />);

    await user.click(screen.getByText('bad'));
    expect(screen.getByRole('status')).toHaveTextContent('Failed!');
  });

  it('dismisses a toast when the close button is clicked', async () => {
    const user = userEvent.setup();
    renderWithToast(<Probe />);

    await user.click(screen.getByText('ok'));
    expect(screen.getByText('Saved!')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /dismiss notification/i }));
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });

  it('auto-dismisses after the duration elapses', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useToast(), {
        wrapper: ({ children }) => <ToastProvider>{children}</ToastProvider>,
      });

      act(() => {
        result.current.show('temp', 'success', 1000);
      });
      expect(screen.getByText('temp')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.queryByText('temp')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
