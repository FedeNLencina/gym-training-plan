import { defineConfig, devices } from '@playwright/test';

const URL_BASE = 'http://localhost:5173';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: URL_BASE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: URL_BASE,
    reuseExistingServer: !process.env.CI,
    // vite.config.ts tiene `server.open: true`; esto evita abrir una pestaña en cada corrida.
    env: { BROWSER: 'none' },
  },
});
