import { existsSync } from 'node:fs';
import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

// 3477, not 3000. `reuseExistingServer` is on outside CI, so a default of 3000
// silently pointed every run at whatever already listens there — on this
// machine that is AutoInvoice, a different product, and the suite would test
// IT and fail with mystifying selectors. Override with PORT= when this port is
// taken too.
const PORT = process.env.PORT || 3477;

// The live Atlas conversation test. It is a project of its own and NOT part of
// `npm run test:e2e`, because it needs three real things this repo does not
// own: the production LiveKit server, the atlas-web-voice worker unit on
// MagicCat, and the LiveKit credentials in .env.local. Run it deliberately:
//
//   PORT=3477 ATLAS_E2E=1 npx playwright test --project=atlas-live
const ATLAS_LIVE_TESTS = /AtlasLive\.e2e\.ts/;
// Chromium plays this file instead of a microphone (see the fixture script for
// how it is built and why the silence is where it is).
//
// Resolved against THIS FILE, never process.cwd(): a run started from anywhere
// but the repo root would otherwise hand Chromium a path that does not exist —
// and Chrome does not complain about that, it just produces silence, which
// looks exactly like a visitor who never spoke. The existsSync below turns a
// missing fixture into a startup error instead of a 90-second mystery.
const ATLAS_FAKE_MIC = path.resolve(__dirname, 'tests/e2e/fixtures/atlas-visitor.wav');

if (!existsSync(ATLAS_FAKE_MIC)) {
  throw new Error(
    `Playwright fake-microphone fixture is missing: ${ATLAS_FAKE_MIC}. `
    + 'Rebuild it with `bash tests/e2e/fixtures/make-atlas-visitor.sh` (needs the local TTS server on :8004).',
  );
}

// Set webServer.url and use.baseURL with the location of the WebServer respecting the correct set port
const baseURL = `http://localhost:${PORT}`;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  // Look for files with the .spec.js or .e2e.js extension
  testMatch: '*.@(spec|e2e).?(c|m)[jt]s?(x)',
  // Timeout per test
  timeout: 30 * 1000,
  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,
  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: process.env.CI ? 'github' : 'list',

  expect: {
    // Set timeout for async expect matchers
    timeout: 10 * 1000,
  },

  // Run your local dev server before starting the tests:
  // https://playwright.dev/docs/test-advanced#launching-a-development-web-server-during-the-tests
  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev:next',
    url: baseURL,
    timeout: 2 * 60 * 1000,
    reuseExistingServer: !process.env.CI,
  },

  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Use baseURL so to make navigations relative.
    // More information: https://playwright.dev/docs/api/class-testoptions#test-options-base-url
    baseURL,

    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    trace: process.env.CI ? 'retain-on-failure' : undefined,

    // Record videos when retrying the failed test.
    video: process.env.CI ? 'retain-on-failure' : undefined,
  },

  projects: [
    // `setup` and `teardown` are used to run code before and after all E2E tests.
    // These functions can be used to configure Clerk for testing purposes. For example, bypassing bot detection.
    // In the `setup` file, you can create an account in `Test mode`.
    // For each test, an organization can be created within this account to ensure total isolation.
    // After all tests are completed, the `teardown` file can delete the account and all associated organizations.
    // You can find the `setup` and `teardown` files at: https://nextjs-boilerplate.com/pro-saas-starter-kit
    { name: 'setup', testMatch: /.*\.setup\.ts/, teardown: 'teardown' },
    { name: 'teardown', testMatch: /.*\.teardown\.ts/ },
    {
      name: 'chromium',
      testIgnore: ATLAS_LIVE_TESTS,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    ...(process.env.CI
      ? [
          {
            name: 'firefox',
            testIgnore: ATLAS_LIVE_TESTS,
            use: { ...devices['Desktop Firefox'] },
            dependencies: ['setup'],
          },
        ]
      : []),
    // The live project only EXISTS when the operator asked for it, so a plain
    // `npx playwright test` cannot pick it up even as a skipped test — it
    // dials a production media server and it is nobody's accident to run.
    ...(process.env.ATLAS_E2E
      ? [
          {
            name: 'atlas-live',
            testMatch: ATLAS_LIVE_TESTS,
            // A real conversation: dial, a verbatim 11-second greeting, a
            // spoken question 15 s into the fixture, whisper, the language
            // model and the voice. Three minutes is the budget for one of
            // those, not a guess at how long it takes.
            timeout: 3 * 60 * 1000,
            use: {
              ...devices['Desktop Chrome'],
              launchOptions: {
                args: [
                  // Grant the microphone without a prompt, then replace the
                  // device with the fixture file so the "visitor" says the same
                  // sentence in the same voice on every run.
                  '--use-fake-ui-for-media-stream',
                  '--use-fake-device-for-media-stream',
                  `--use-file-for-fake-audio-capture=${ATLAS_FAKE_MIC}`,
                  // Atlas's reply plays into an <audio> element the test never
                  // clicks, and a blocked autoplay would silently break the meter.
                  '--autoplay-policy=no-user-gesture-required',
                ],
              },
            },
          },
        ]
      : []),
  ],
});
