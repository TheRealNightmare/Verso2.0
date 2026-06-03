import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Field from './Field';

describe('Field', () => {
  it('wires the label to a render-prop control via id', () => {
    render(
      <Field label="Email">
        {(props) => <input {...props} aria-label="email-input" />}
      </Field>
    );
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    // Render-prop receives a generated id.
    expect(input.id).toBeTruthy();
  });

  it('shows a required marker', () => {
    render(<Field label="Name" required>{() => <input />}</Field>);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders an error message and wires aria-invalid / aria-describedby', () => {
    render(
      <Field label="Email" error="Required">
        {(props) => <input {...props} />}
      </Field>
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const errorNode = document.getElementById(describedBy);
    expect(errorNode).toHaveTextContent('Required');
  });

  it('accepts plain node children too', () => {
    render(<Field label="Plain"><span>hello</span></Field>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
