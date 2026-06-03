import { apiFetch } from './auth';
import { cachedFetch } from '../lib/cache';

const DASHBOARD_TTL = 60 * 1000; // 1 minute

export const dashboardKey = (range = 'monthly') => `dashboard:${range}`;

// Cached per range with stale-while-revalidate, so toggling back to a range you
// already viewed renders instantly while a fresh copy loads in the background.
export function getDashboardSummary({ range } = {}) {
  const qs = range ? `?range=${encodeURIComponent(range)}` : '';
  return cachedFetch(
    dashboardKey(range),
    () => apiFetch(`/dashboard/summary${qs}`),
    { ttl: DASHBOARD_TTL }
  );
}
