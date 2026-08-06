import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    viewport: { width: 1440, height: 1100 },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'HOST=0.0.0.0 PORT=3000 BROWSER=none npx --yes -p node@18 node node_modules/react-scripts/scripts/start.js',
    cwd: '..',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
