---
name: pr-screenshot
description: "Capture and attach frontend screenshots and videos to pull requests for django-react-intro. Auto-triggers when a PR changes the React frontend or its styles."
user_invocable: true
codepress_generated: true
---

# PR Screenshot — django-react-intro

Capture useful visual evidence for pull requests that change the React frontend. The repository has one frontend at `web/`, built with Create React App 1.0.10 and Yarn 1, and one public route: `/`.

## When to Trigger

Run this skill when a PR changes files under:

- `web/src/**/*.{js,jsx,css}`
- `web/public/**/*`
- `web/package.json` or `web/yarn.lock` when the dependency change affects visible UI

Do not run it for backend-only changes under `server/`, documentation-only changes, or test-only changes with no visual impact.

## What to Capture

| Changed files | What to screenshot | URL |
| --- | --- | --- |
| `web/src/containers/home/**` | Home screen and welcome content | `/` |
| `web/src/containers/App/**` or `web/src/containers/router/**` | Routed application shell | `/` |
| `web/src/index.css` or `web/src/**/*.css` | The affected page with its surrounding layout | `/` |
| `web/public/**` | Home screen using the changed public asset | `/` |

The page is public and has no authentication or API data dependency. The key ready-state selector is the heading `Welcome to React`; the page root uses `.Home` and the logo uses `.Home-logo`.

## Dev Server

### Docker capture (preferred in CodePress sessions)

The repository root `Dockerfile` is a self-contained validation image for the `web` app. It installs the pinned Yarn dependencies inside the image and starts CRA on port 3000.

```text
build_and_start_app_server(
  workspaceDir=<absolute repo root>,
  dockerfilePath="Dockerfile",
  port=3000,
  envVars={
    "HOST":"0.0.0.0",
    "PORT":"3000",
    "BROWSER":"none",
    "DANGEROUSLY_DISABLE_HOST_CHECK":"true",
    "CHOKIDAR_USEPOLLING":"true"
  }
)

take_app_server_screenshot(
  containerId=<container id>,
  path="/",
  viewport={"width":1440,"height":1100},
  wait_ms=1000,
  full_page=false
)

stop_app_server(containerId=<container id>)
```

Assert that the screenshot contains the changed feature, not just a non-blank shell. For this app, wait for the `Welcome to React` heading or another stable selector introduced by the PR.

### Local Playwright fallback

From `web/`, install dependencies with the existing Yarn lockfile. If Playwright is not already a dev dependency, add it once and install Chromium:

```bash
cd web
yarn install --frozen-lockfile
yarn add --dev @playwright/test
yarn exec playwright install chromium
```

Create `web/e2e/playwright.config.js` temporarily when no config exists:

```js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:3000' },
  webServer: {
    command: 'HOST=0.0.0.0 BROWSER=none DANGEROUSLY_DISABLE_HOST_CHECK=true yarn start',
    port: 3000,
    reuseExistingServer: true,
    timeout: 60000,
  },
});
```

## Capture Spec Template

Create `web/e2e/tests/_pr-screenshot.spec.js` temporarily and remove it after the run:

```js
const { test } = require('@playwright/test');

test('capture the changed home screen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Welcome to React' }).waitFor({ state: 'visible' });
  await page.locator('.Home').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: '/tmp/pr-screenshots/pr-screenshot-home.png',
    fullPage: false,
  });
});
```

For a PR that changes an interaction, record a short video with Playwright's `video: 'on'` setting and perform the real interaction before waiting for its final-state selector. Keep captures under ten seconds and include the final state.

## Running the Spec

```bash
cd web
mkdir -p /tmp/pr-screenshots
yarn exec playwright test --config e2e/playwright.config.js e2e/tests/_pr-screenshot.spec.js --workers=1
```

Check that each screenshot is larger than 10 KB and that the changed content is visible. Capture a 390x844 viewport as well when the PR changes responsive behavior. Capture the same route against the merge-base in a detached worktree for a before/after pair when practical; if the base cannot render, keep the valid after capture and note why.

## Upload and Embed

In CodePress cloud sessions, call `upload_pr_asset` for each PNG, GIF, or WebM and embed the returned permanent URL in the PR's `## Demo` section. Use a before/after table when both captures exist, and stamp the section with the captured commit SHA.

For local fallback, upload assets to the repository's `pr-assets` GitHub release with `gh release upload`, using PR-number-prefixed filenames. Prefer a GIF plus a link to the original WebM for video evidence.

## Cleanup

Remove the temporary spec and config, delete `/tmp/pr-screenshots`, and stop any server started for the capture. Do not commit temporary Playwright specs, configs, screenshots, or videos.

## Tips

- Use viewport captures for bounded UI changes and include enough height to show the feature below the header.
- Capture `/` for any shared component, router, or global-style change because the app currently has only that route.
- No auth bypass or API mocking is needed for this repository.
- Skip screenshots for changes that cannot affect rendered output.
