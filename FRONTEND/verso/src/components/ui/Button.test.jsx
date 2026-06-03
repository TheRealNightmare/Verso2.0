import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('renders its children and defaults to type=button', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: 'Click me' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('fires onClick when enabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows a spinner, sets aria-busy, and is disabled while loading', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button loading loadingLabel="Saving..." onClick={onClick}>Save</Button>);

    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveTextContent('Saving...');
    // A status role from the Spinner is present.
    expect(screen.getByRole('status')).toBeInTheDocument();

    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Nope</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies variant and size classes', () => {
    render(<Button variant="danger" size="sm">Del</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-red-600');
    expect(btn.className).toContain('text-xs');
  });

  it('passes type=submit through', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
