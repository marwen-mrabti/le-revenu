import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  // The development server compiles pages on first visit: assertions wait longer than Playwright's 5 s default.
  expect: { timeout: 10_000 },
  use: { baseURL, trace: 'retain-on-failure', timezoneId: 'Europe/Paris' },
  projects: [
    { name: 'fr', use: { ...devices['Desktop Chrome'], locale: 'fr-FR' } },
    { name: 'en', use: { ...devices['Desktop Chrome'], locale: 'en-GB' } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'pnpm start',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
