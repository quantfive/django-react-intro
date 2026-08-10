---
name: pr-screenshot
description: "Capture frontend screenshots and videos for quantfive/django-react-intro pull requests. Auto-triggers when a PR diff changes visible files under web/src, web/public, or web/package.json. Uses Playwright to render the Create React App home page and uploads evidence to the PR. IMPORTANT: Use this skill whenever a PR includes frontend or UI changes. Trigger on: make a PR, create a PR, open a pull request, or any request that results in a PR with frontend file changes."
user_invocable: true
codepress_generated: true
---

# PR Screenshots — quantfive/django-react-intro

Capture useful visual evidence for UI changes in the `web/` Create React App. The current frontend has one renderable route, `/`, served by `react-scripts start` on port 3000. The Django code under `server/` is not a screenshot surface unless the frontend is changed to consume it.

## When to Trigger

Run this skill when the PR changes visible frontend behavior in:

- `web/src/**/*.{js,jsx,css,svg}`
- `web/public/**/*.{html,json,ico}`
- `web/package.json` or `web/e2e/**/*`

Do not run it for backend-only changes under `server/`, documentation-only changes, dependency updates with no visible effect, or test-only changes that do not alter the rendered UI.

## What to Capture

| Changed files | What to screenshot | URL |
| --- | --- | --- |
| `web/src/containers/home/**` | Home screen and its welcome content | `/` |
| `web/src/containers/App/**` | Application shell and routed home screen | `/` |
| `web/src/containers/router/**` | The route affected by the change | `/` |
| `web/src/index.css`, `web/src/containers/home/stylesheets/**` | Home screen styling | `/` |
| `web/public/**` | Home screen with updated public assets or metadata | `/` |

This is a static starter app with no discovered login flow, protected route, API fixture, or seeded account. Capture the public home screen without auth injection or API mocks. Use a screenshot for layout, typography, color, and asset changes. Add a video only when the diff introduces an interaction, animation, loading state, or drag-and-drop flow.

## Dev Server

The durable local capture path uses the `web/e2e/playwright.config.js` file committed with this skill. It starts the existing CRA app with:

```bash
cd web
yarn install --frozen-lockfile
yarn playwright install chromium
yarn playwright test --config=e2e/playwright.config.js
```

The server binds to `0.0.0.0:3000`, disables browser launching, and allows the CodePress preview hostname. In a CodePress cloud session, use the available container-backed browser or Live Dev Server flow when it provides the same frontend; otherwise use the Playwright config above. Do not use the existing `.codepress/dev-server/Dockerfile.web` with a standalone app-server build unless the source tree is explicitly mounted, because that image intentionally expects runtime dependency hydration from a bind-mounted checkout.

## Capture Spec

Create a temporary spec at `web/e2e/tests/_validate-pr-screenshot.spec.js` and remove it after the run:

```js
const { test, expect } = require('@playwright/test');

test('capture the public home screen for a pull request', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome to React' })).toBeVisible();
  await expect(page.getByText(/To get started, edit/)).toBeVisible();
  await page.screenshot({
    path: '/tmp/pr-screenshots/pr-screenshot-home.png',
    fullPage: false,
  });
});
```

Run it from the repository root:

```bash
rm -rf /tmp/pr-screenshots
mkdir -p /tmp/pr-screenshots
cd web
yarn playwright test --config=e2e/playwright.config.js e2e/tests/_validate-pr-screenshot.spec.js --workers=1
test -s /tmp/pr-screenshots/pr-screenshot-home.png
rm -f e2e/tests/_validate-pr-screenshot.spec.js
```

The screenshot must contain the visible home content, not only a blank shell or loading state, and should be larger than 10 KB. If the PR changes the only heading or intro copy, update the semantic assertions in the temporary spec to match the changed final state while keeping an assertion that the changed content is visible.

## Before and After

For an existing route, capture the same spec on the merge-base in a temporary detached worktree and save the result with a `-before` suffix. The before pass is best effort: a dependency or fixture mismatch must fall back to the current-branch capture rather than invalidate the after screenshot. A new route has no before image.

Stamp the PR evidence with the short commit SHA so reviewers can identify stale screenshots after later commits.

## Video Capture

For interactive changes, enable Playwright video in the temporary spec with a 1280 by 720 viewport, perform the shortest readable interaction path, wait for the final state, and close the page so recording finalizes. Convert the resulting WebM to a GIF with `ffmpeg` for inline PR rendering, and retain the WebM as a download.

## Upload and Embed

In CodePress cloud sessions, upload each PNG, GIF, and WebM with `upload_pr_asset` and embed the returned permanent URLs in a `## Demo` section of the PR body. Use linked image markdown so clicking an image opens the full asset. For local sessions without that tool, upload the assets to the repository's `pr-assets` release with `gh release upload` and use the release URLs. Include before/after images in a two-column table when both exist; otherwise show the after image alone.

## Cleanup

Always remove the temporary spec, stop any server started solely for capture, and clear `/tmp/pr-screenshots` after assets are uploaded or copied. Do not commit screenshots, videos, temporary specs, or generated dependency directories.
