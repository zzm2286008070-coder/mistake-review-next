import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  use: {
    ...devices['iPhone 13'],
    browserName: 'webkit',
    baseURL: 'http://127.0.0.1:18941',
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'python -m http.server 18941 --bind 127.0.0.1',
    url: 'http://127.0.0.1:18941',
  },
});
