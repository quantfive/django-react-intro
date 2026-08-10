const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'HOST=0.0.0.0 BROWSER=none DANGEROUSLY_DISABLE_HOST_CHECK=true yarn start',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
