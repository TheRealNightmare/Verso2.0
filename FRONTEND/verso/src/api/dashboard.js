import { apiFetch } from './auth';

export function getDashboardSummary({ range } = {}) {
  const qs = range ? `?range=${encodeURIComponent(range)}` : '';
  return apiFetch(`/dashboard/summary${qs}`);
}
