---
name: pr-screenshot
description: "Capture and attach frontend screenshots and videos to pull requests for quantfive/django-react-intro. Auto-triggers when creating a PR with UI changes in the web Create React App. Uses Playwright to render affected pages and uploads evidence to the PR. IMPORTANT: Use this skill EVERY TIME you create a PR if the diff includes frontend/UI files. Trigger on: 'make a pr', 'create a pr', 'open a pull request', or any request that results in a PR with frontend file changes."
user_invocable: true
codepress_generated: true
---

# PR Screenshots — django-react-intro

Capture useful visual evidence for UI changes in the `web/` Create React App. The
app currently has one public route, `/`, and no authentication or API data
dependency. Use semantic assertions so the capture proves the rendered feature
is present instead of producing a screenshot of an empty shell.

## When to Trigger

Run this skill automatically when a pull request changes visible UI, including:

- `web/src/**/*.js` or `web/src/**/*.jsx`
- `web/src/**/*.css`
- `web/src/**/*.svg`
- `web/public/**/*` when the asset is rendered by the app
- Any file that changes the visible home page or its layout

Do not trigger for backend-only changes under `server/`, test-only changes with
no visual effect, documentation, or dependency updates that do not affect the
rendered page.

## What to Capture

| Changed files | What to screenshot | URL |
| --- | --- | --- |
| `web/src/containers/home/**` | Home page and its welcome content | `/` |
| `web/src/containers/App/**` | Routed app shell and home page | `/` |
| `web/src/containers/router/**` | Routed app shell and home page | `/` |
| `web/src/index.css`, `web/src/containers/home/stylesheets/**` | Home page styling | `/` |
| `web/src/**/*.svg`, `web/public/**` | The page that renders the changed asset | `/` |

Use a screenshot for static layout, color, typography, or asset changes. Use a
video when the change adds an animation, transition, hover state, or interaction.
Capture both when a static comparison and an interaction demonstration are useful.

## Auth and Data

The current app has no auth gate and the `/` route renders bundled content. No
cookies, local-storage tokens, login flow, or API mocks are required. If a future
change adds protected routes or network data, update this section and the capture
spec with the repo's real fixture or a narrowly-scoped `page.route()` mock.

## Dev Server

### Preferred CodePress container flow

When `.codepress/start-app-server/recipe.json` exists, invoke the repo's
`start-app-server` skill and use the returned container with
`take_app_server_screenshot`. The app server recipe is the source of truth for
the Dockerfile, port, and any future services.

```text
Skill({"skill": "start-app-server"})

take_app_server_screenshot(
  containerId=<container id>,
  path="/",
  viewport={"width": 1440, "height": 1100},
  wait_ms=1000,
)
```

The screenshot must show the home page's rendered content, including the main
heading or the changed feature. Stop the container after capture when it was
started only for this PR evidence.

### Local Playwright flow

Run from `web/`. The checked-in Yarn 1 lockfile is authoritative. If a global
Yarn binary is unavailable, use the pinned runner shown below.

```bash
cd web
npx --yes yarn@1.22.22 install --frozen-lockfile
mkdir -p /tmp/pr-screenshots
./node_modules/.bin/playwright install chromium
```

The checked-in `web/e2e/playwright.config.ts` starts CRA on `0.0.0.0:3000` with
`BROWSER=none` and waits for `http://127.0.0.1:3000` to respond. This legacy
CRA 1.0.10 tree requires Node 18 because its `websocket-driver` dependency
uses the removed Node `http_parser` binding; the config obtains Node 18 through
the pinned npm package and runs CRA's installed start script without fetching
application dependencies at server startup.

## Capture Spec Template

Create a temporary spec at `web/e2e/tests/_pr-screenshot.spec.ts`:

```typescript
import { expect, test } from '@playwright/test';

test('capture the changed home page', async ({ page }) => {
  await page.goto('/');

  const heading = page.getByRole('heading', { name: 'Welcome to React' });
  await expect(heading).toBeVisible();
  await heading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  await page.screenshot({
    path: '/tmp/pr-screenshots/pr-screenshot-home.png',
    fullPage: false,
  });
});
```

Replace the heading assertion with the most stable semantic locator for the
changed feature. Assert that feature before saving the screenshot, and choose a
viewport or scroll position that keeps the feature and nearby context visible.
Avoid relying on the browser's default 1280x720 viewport.

### Video Capture Template

For an interaction or animation, use Playwright video recording and keep the
useful portion under ten seconds when possible:

```typescript
import { expect, test } from '@playwright/test';

test.use({
  video: { mode: 'on', size: { width: 1280, height: 720 } },
  viewport: { width: 1280, height: 720 },
});

test('capture the changed interaction', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome to React' })).toBeVisible();

  // Perform the interaction here, with short waits between meaningful actions.
  await page.waitForTimeout(750);
  await page.close();
});
```

Convert WebM to an inline GIF for GitHub and keep the original WebM as a link:

```bash
for video in /tmp/pr-screenshots/*.webm; do
  [ -f "$video" ] || continue
  ffmpeg -i "$video" -vf 'fps=15,scale=1280:-1:flags=lanczos' -y "${video%.webm}.gif"
done
```

## Running the Capture

```bash
cd web
mkdir -p /tmp/pr-screenshots
./node_modules/.bin/playwright test \
  --config e2e/playwright.config.ts \
  e2e/tests/_pr-screenshot.spec.ts \
  --workers=1
```

Before reporting success, verify that each expected screenshot exists and is
larger than 10 KB. A blank page, loading shell, or screenshot containing only
the browser background is not useful evidence. If the app fails to start, read
the full Playwright error, repair the root setup issue, and retry up to three
times. Do not replace a broken render with a mocked screenshot.

## Before and After

For visual changes, capture the branch and the same page from the merge-base so
reviewers can compare the change in context:

1. Capture the current branch into a clean output directory.
2. Compute `BASE_SHA=$(git merge-base origin/master HEAD)`.
3. Add a detached worktree at that SHA, copy only the temporary spec/config and
   required untracked environment files, install its dependencies, and run the
   same capture command.
4. Save baseline files with a `-before` suffix beside the branch captures.
5. Remove the temporary worktree. If the base cannot render because this is a
   new page or the fixture has changed, keep the branch capture and document the
   after-only fallback.

Stamp the Demo section with `git rev-parse --short HEAD` so stale images are
detectable after later commits.

## Upload and Embed

In CodePress sessions, call `upload_pr_asset` for each PNG, GIF, or short WebM
that is intended for the PR. Wrap returned image URLs as links so reviewers can
open the full-size asset. If the upload tool is unavailable, use the repository's
`pr-assets` GitHub release and namespace filenames by PR number.

The PR description should include a section like:

```markdown
## Demo

<!-- pr-screenshot: captured at abc1234 -->

| Before | After |
| --- | --- |
| [![before](BEFORE_URL)](BEFORE_URL) | [![after](AFTER_URL)](AFTER_URL) |

[Interaction demo](VIDEO_URL)
```

Use a single image when no baseline exists. Do not embed a raw `<video>` tag;
GitHub renders GIF plus a download link more consistently.

## Cleanup

Remove the temporary spec and local screenshot output after assets are uploaded:

```bash
rm -f web/e2e/tests/_pr-screenshot.spec.ts
rm -rf /tmp/pr-screenshots
```

Do not commit the temporary spec, generated screenshots, videos, or detached
worktree. Keep only the checked-in Playwright config, package manifest/lockfile,
and this skill.

## Tips

- Use viewport captures for bounded features and `fullPage: true` only when page-level context matters.
- Add a 390x844 capture when the change is responsive or mobile-specific.
- Capture every changed UI area when a PR touches multiple routes or components.
- Skip evidence for purely structural changes such as test-id or class-name renames with no visual effect.
