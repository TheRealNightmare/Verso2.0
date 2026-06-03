import { describe, it, expect, vi } from 'vitest';
import { render, screen, renderHook, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmProvider, useConfirm } from './ConfirmContext';

// Probe that opens a confirm dialog and reports the resolved result.
function Probe({ onResult, options }) {
  const confirm = useConfirm();
  return (
    <button onClick={async () => onResult(await confirm(options))}>open</button>
  );
}

const renderWithConfirm = (ui) => render(<ConfirmProvider>{ui}</ConfirmProvider>);

describe('useConfirm', () => {
  it('throws outside a ConfirmProvider', () => {
    expect(() => renderHook(() => useConfirm())).toThrow(/ConfirmProvider/);
  });
});

describe('ConfirmProvider', () => {
  it('renders title/message and resolves true on confirm', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    renderWithConfirm(
      <Probe onResult={onResult} options={{ title: 'Delete?', message: 'Really?', confirmLabel: 'Yes' }} />
    );

    await user.click(screen.getByText('open'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.getByText('Really?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
    // Dialog closes after resolving.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('resolves false on cancel', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    renderWithConfirm(<Probe onResult={onResult} options={{ title: 'Sure?' }} />);

    await user.click(screen.getByText('open'));
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false));
  });

  it('uses default labels when none are provided', async () => {
    const user = userEvent.setup();
    renderWithConfirm(<Probe onResult={() => {}} options={{}} />);

    await user.click(screen.getByText('open'));
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});
