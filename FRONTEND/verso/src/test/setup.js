// Global test setup, loaded before every test file (see vite.config.ts `setupFiles`).
//
// - Registers jest-dom matchers (toBeInTheDocument, toHaveClass, ...) for Vitest.
// - Unmounts React trees and clears localStorage after each test so cases stay
//   isolated and deterministic.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  localStorage.clear();
});
