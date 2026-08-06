const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'HOST=0.0.0.0 BROWSER=none npx --yes yarn@1.22.22 start',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
