import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    // Use worker threads rather than forked processes: forks rely on process IPC
    // that some sandboxed/CI environments block ("Timeout waiting for worker").
    pool: 'threads',
  },
})
