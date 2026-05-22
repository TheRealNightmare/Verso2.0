import { useId } from 'react';

// Boxed label-on-top field, generalized from ProfileForm's FieldShell so every form shares
// the same look (Rule 1) and gains error/aria wiring (Rules 2 & 5).
//
// Children may be a render function receiving `{ id, 'aria-invalid', 'aria-describedby' }`
// to wire the control to its label and error message, or plain nodes for custom layouts.
const Field = ({ label, error, required = false, children }) => {
  const id = useId();
  const errorId = `${id}-error`;
  const fieldProps = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
  };

  return (
    <div>
      <div
        className={`relative w-full rounded-xl border bg-white px-4 pt-2 pb-2 ${
          error ? 'border-red-400' : 'border-[#5b7c99]/60'
        }`}
      >
        <label htmlFor={id} className="block text-[11px] font-semibold text-slate-800">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
        {typeof children === 'function' ? children(fieldProps) : children}
      </div>
      {error && (
        <p id={errorId} className="mt-1 px-1 text-[11px] text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default Field;
