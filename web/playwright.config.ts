import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  globalTimeout: process.env.CI ? 10 * 60 * 1000 : undefined,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    reducedMotion: 'reduce',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], reducedMotion: 'reduce' } },
  ],

  webServer: [
    {
      // E2E backend: Express + mongodb-memory-server, no external services
      command: 'npm run start:e2e',
      cwd: '../backend',
      port: 5001,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      // Vite dev server — VITE_API_URL points at the E2E backend, not production
      command: 'npm run dev',
      port: 5173,
      timeout: 30_000,
      reuseExistingServer: !process.env.CI,
      env: { VITE_API_URL: 'http://localhost:5001' },
    },
  ],
});
