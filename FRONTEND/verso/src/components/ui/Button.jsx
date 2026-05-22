import Spinner from './Spinner';

// Shared button (Rule 1: consistency). Variants reuse the app's existing palette so the
// look is unchanged; only the markup is centralized.
const VARIANTS = {
  primary: 'bg-[#5b7c99] text-white hover:bg-[#4a6a85]',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2 text-sm',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  loadingLabel,
  type = 'button',
  className = '',
  children,
  ...rest
}) => {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading && <Spinner size={size === 'sm' ? 14 : 16} />}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
};

export default Button;
