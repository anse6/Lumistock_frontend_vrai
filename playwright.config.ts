import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173', // ton app React
    headless: false,                   // pour voir le navigateur
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  // Lance automatiquement ton serveur React si nécessaire
  webServer: {
    command: 'npm run dev',           // ou la commande que tu utilises pour vite
    url: 'http://localhost:5173',
    reuseExistingServer: true,        // si ton app est déjà lancée, Playwright ne relance pas
  },
});
