import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StarRating from './StarRating';

describe('StarRating', () => {
  it('renders five star buttons in a radiogroup', () => {
    render(<StarRating value={0} onChange={() => {}} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('calls onChange with the clicked star value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Rate 4 stars' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('marks the selected star with aria-pressed', () => {
    render(<StarRating value={3} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Rate 3 stars' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Rate 1 star' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('is non-interactive in readOnly mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRating value={2} onChange={onChange} readOnly />);

    const stars = screen.getAllByRole('button');
    expect(stars[0]).toBeDisabled();
    await user.click(stars[4]);
    expect(onChange).not.toHaveBeenCalled();
    // No radiogroup role when read-only.
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });
});
