import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Avatar from './Avatar';

describe('Avatar', () => {
  it('renders an <img> when given an absolute src', () => {
    render(<Avatar src="https://cdn.test/a.png" name="Ada Lovelace" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://cdn.test/a.png');
    expect(img).toHaveAttribute('alt', 'Ada Lovelace');
  });

  it('falls back to two-letter initials for a full name when no src', () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('uses the first two letters for a single-word name', () => {
    render(<Avatar name="Madonna" />);
    expect(screen.getByText('MA')).toBeInTheDocument();
  });

  it('falls back to "U" when there is no name', () => {
    render(<Avatar />);
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('switches to the initials fallback when the image fails to load', () => {
    render(<Avatar src="https://cdn.test/broken.png" name="Bob Smith" />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(screen.getByText('BS')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
