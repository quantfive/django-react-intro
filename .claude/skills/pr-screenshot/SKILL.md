---
name: pr-screenshot
description: "Capture and attach frontend screenshots and videos to pull requests for quantfive/django-react-intro. Auto-triggers when creating a PR with UI changes under web/src or web/public. Uses Playwright to render the affected page and uploads assets to the PR. IMPORTANT: Use this skill whenever a PR changes visible frontend behavior. Trigger on: 'make a pr', 'create a pr', 'open a pull request', or any request that results in a PR with frontend file changes."
user_invocable: true
codepress_generated: true
---

## When to Trigger

Run this skill automatically when a pull request changes visible frontend behavior, including:

- `web/src/**/*.{js,jsx,css,svg}`
- `web/public/**/*.{html,css,ico,json,png,svg}`
- `web/package.json` or `web/yarn.lock` when the dependency change affects the UI
- `server/server/views.py` or templates when the change affects the page served at `/`

Do not run it for backend-only changes, database changes, infrastructure or CI changes, documentation-only changes, or test-only changes with no visible UI effect.

## What to Capture

This repository has one frontend app and one public route:

| Changed files | What to screenshot | URL |
| --- | --- | --- |
| `web/src/containers/home/**` | Home page content and branding | `/` |
| `web/src/containers/App/**` | Application shell and route behavior | `/` |
| `web/src/containers/home/stylesheets/**`, `web/src/index.css` | Home page layout and styling | `/` |
| `web/src/index.js`, `web/public/**` | Bootstrapped home page | `/` |
| `server/server/views.py` or the frontend template | Django-served frontend shell | `/` |

The frontend is a Create React App application using `react-scripts@1.0.10`, React 15, Redux, and React Router. The current route is public and does not require authentication or API mocks. The current home-page readiness checks are the `Welcome to React` heading and the image with alt text `logo`; when a PR changes a different element, replace those checks with a semantic locator for the changed feature.

Use a screenshot for static layout, color, typography, and component changes. Use a video when the change includes an animation, transition, hover or click interaction, loading state, or other time-based behavior. Capture both when reviewers need a static preview and an interaction demonstration.

## Dev Server

### Option A: CodePress container capture

If the repository has `.claude/skills/start-app-server/SKILL.md` and `.codepress/start-app-server/recipe.json`, follow that skill to build and start the full-stack container, then use `take_app_server_screenshot` against `/` with the recipe port. Prefer a viewport of 1440 by 1000 and wait up to 1000 milliseconds after load so the page is settled.

The existing `.codepress/dev-server/recipe.json` describes the `web` CRA dev server at port 3000 and points to `.codepress/dev-server/Dockerfile.web`. That Dockerfile is a thin Live Dev Server image which expects the CodePress Live Dev Server source mount; do not pass it directly to `build_and_start_app_server` without that mount. If the Live Dev Server transport is available, use its `web` entry; otherwise use Option B.

### Option B: Local Playwright capture

The durable Playwright config is `web/e2e/playwright.config.js`. It starts the CRA server on port 3000 with the repo's Yarn 1 lockfile:

```bash
cd web
npx --yes yarn@1.22.22 install --frozen-lockfile
npx --yes yarn@1.22.22 playwright install chromium
npx --yes yarn@1.22.22 playwright test \
  --config e2e/playwright.config.js \
  e2e/tests/_pr-capture.spec.js \
  --workers=1
```

The CRA toolchain is from 2017. Use Node 18 for the frontend runtime; the host Node 25 runtime is incompatible with its `websocket-driver` dependency and fails with `No such module: http_parser`. The temporary capture spec must be removed after the run.

The frontend home route is standalone, so no Django server is needed for the current screenshot contract. If a future change adds a backend request, start the Django app according to the repo-local app-server recipe and add the required route mocks or service URL to the spec rather than hiding a failing request.

## Capture Spec Template

Create a temporary file at `web/e2e/tests/_pr-capture.spec.js`:

```javascript
const { test, expect } = require('@playwright/test');

test('capture the changed home-page feature', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const feature = page.getByRole('heading', { name: 'Welcome to React' });
  await expect(feature).toBeVisible();
  await feature.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  await page.screenshot({
    path: '/tmp/pr-screenshots/pr-screenshot-home.png',
    fullPage: false,
  });
});
```

Keep the assertion focused on the changed feature body, not only the page shell. Use `getByRole`, `getByText`, or another stable semantic locator because the repository currently has no `data-testid` convention. Set a mobile viewport of 390 by 844 as an additional capture when the PR changes responsive behavior.

For interaction changes, use this video pattern and close the page after the final state so the recording is flushed:

```javascript
test.use({
  video: { mode: 'on', size: { width: 1280, height: 720 } },
  viewport: { width: 1280, height: 720 },
});

test('record the changed home-page interaction', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Welcome to React' }).waitFor({ state: 'visible' });
  // Perform the user interaction here and wait for its final visible state.
  await page.waitForTimeout(750);
  await page.close();

  const video = testInfo.attachments.find((attachment) => attachment.name === 'video');
  if (video && video.path) {
    const fs = require('fs');
    fs.mkdirSync('/tmp/pr-screenshots', { recursive: true });
    fs.copyFileSync(video.path, '/tmp/pr-screenshots/pr-video-home.webm');
  }
});
```

## Running the Spec

Kill stale local servers before capture, then remove the temporary spec and output:

```bash
cd web
lsof -ti :3000 2>/dev/null | xargs kill 2>/dev/null || true
rm -rf /tmp/pr-screenshots
mkdir -p /tmp/pr-screenshots
npx --yes yarn@1.22.22 playwright test \
  --config e2e/playwright.config.js \
  e2e/tests/_pr-capture.spec.js \
  --workers=1
rm -f e2e/tests/_pr-capture.spec.js
rm -rf /tmp/pr-screenshots
```

Before reporting success, confirm each screenshot is larger than 10 KB, the changed feature is visible, and the capture is not only a blank shell, loading state, or page header. If the server fails, inspect the full Playwright web-server output; common causes here are the wrong Node runtime, a stale port 3000 process, or an old CRA dependency failure.

## Before and After Capture

For visual changes, capture the same spec on the current branch and on the merge base so reviewers can compare the result:

1. Capture the current branch into a clean output directory and keep the files with their commit SHA.
2. Set `BASE_SHA=$(git merge-base origin/master HEAD)` and create a detached temporary worktree at that SHA.
3. Copy the temporary capture spec and any local environment file needed for the render into the worktree, install the `web` Yarn dependencies, and run the same config.
4. Save the base screenshots with a `-before` suffix, remove the temporary worktree, and keep after-only evidence if the base tree cannot render.

Never reuse a stale output directory between the before and after passes. A new page or a fixture drift is a valid reason to omit the before image; it is not a reason to discard a valid after capture.

## Upload and Embed in the PR

In a CodePress cloud session, use `upload_pr_asset` for each PNG, GIF, and original video. Embed the returned permanent URL in the PR description, wrapping images as a link so reviewers can open the full resolution.

For the local fallback, upload assets to the `pr-assets` release in `quantfive/django-react-intro`:

```bash
gh release upload pr-assets /tmp/pr-screenshots/pr-screenshot-*.png \
  --repo quantfive/django-react-intro --clobber
gh release upload pr-assets /tmp/pr-screenshots/pr-video-*.webm \
  --repo quantfive/django-react-intro --clobber
```

Add a `## Demo` section to the PR body and identify the capture commit. Use a before/after table when both images exist:

```markdown
## Demo

<!-- pr-screenshot: captured at abc1234 -->

| Before | After |
| --- | --- |
| [![before](BEFORE_URL)](BEFORE_URL) | [![after](AFTER_URL)](AFTER_URL) |
```

Convert WebM interaction recordings to GIF for inline playback and link the original WebM separately. Do not use HTML video tags in GitHub markdown.

## GitHub Release Setup

The release fallback is only needed when `upload_pr_asset` is unavailable. Create it once with:

```bash
gh release create pr-assets \
  --repo quantfive/django-react-intro \
  --title "PR Assets" \
  --notes "Screenshots and assets referenced in pull requests." \
  --latest=false
```

## Tips

- Prefer a bounded viewport over `fullPage` so the changed feature remains readable.
- Capture every route affected by the diff; this repository currently has only `/`.
- Add a 390 by 844 capture for mobile or responsive changes.
- Keep videos under 10 seconds and trim loading pre-roll when possible.
- Skip screenshots for structural-only changes such as selector renames with no visual effect.

## Known Issues at Bootstrap Time

- The existing Live Dev Server Dockerfile is source-mount dependent and cannot be used as a standalone `build_and_start_app_server` image.
- The legacy CRA dependency tree requires Node 18; Node 25 fails before the app starts because its `websocket-driver` expects the removed `http_parser` binding.
- A real screenshot was captured successfully from an isolated Node 18 container at `/`, with a 1440 by 1000 viewport and a 22 KB PNG result. The route returned HTTP 200 and rendered the `Welcome to React` heading and logo.
