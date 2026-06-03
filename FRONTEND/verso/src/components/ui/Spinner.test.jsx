import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Spinner from './Spinner';

describe('Spinner', () => {
  it('renders a polite status region with an SR-only label by default', () => {
    render(<Spinner />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('shows a visible label when provided', () => {
    render(<Spinner label="Fetching" />);
    expect(screen.getByText('Fetching')).toBeInTheDocument();
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  });
});
