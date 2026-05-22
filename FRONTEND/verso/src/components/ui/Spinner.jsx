import { Loader2 } from 'lucide-react';

// Inline loading indicator used inside buttons and page loading regions (Rule 3: feedback).
const Spinner = ({ size = 16, className = '', label }) => (
  <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
    <Loader2 size={size} className={`animate-spin ${className}`} aria-hidden="true" />
    {label ? <span>{label}</span> : <span className="sr-only">Loading</span>}
  </span>
);

export default Spinner;
