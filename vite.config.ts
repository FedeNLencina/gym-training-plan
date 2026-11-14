import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: { open: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/tests/setup.ts'],
    // Los specs de e2e/ los corre Playwright, no Vitest.
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
