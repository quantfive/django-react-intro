---
name: pr-screenshot
description: "Capture and attach frontend screenshots and videos to pull requests for quantfive/django-react-intro. Auto-triggers when a pull request includes visible UI changes in the web Create React App."
user_invocable: true
codepress_generated: true
---

# PR Screenshot

Capture useful visual evidence for pull requests that change the React app in
`quantfive/django-react-intro`. The main application is a public, single-page
Create React App under `web/`; it has no authentication or API data required to
render the current route.

## When to Trigger

Run this skill after creating or updating a PR when the diff includes visible
frontend changes in:

- `web/src/**/*.js`, `web/src/**/*.jsx`, or `web/src/**/*.css`
- `web/public/**` when the asset is visible on the home page
- `web/src/containers/home/**` or `web/src/containers/App/**`
- Any other file that changes what a browser user sees at `/`

Do not trigger for:

- Backend-only changes under `server/`
- Redux or utility changes that have no visible effect
- Test-only, documentation-only, or CI/configuration-only changes
- `samples/auth-web/**` by itself; those example components are not mounted by
  the running application

## What to Capture

| Changed files | What to screenshot | URL |
| --- | --- | --- |
| `web/src/containers/home/**` | The home page, including the React logo, heading, and intro text | `/` |
| `web/src/containers/App/**`, `web/src/index.js` | The routed application shell and home page | `/` |
| `web/src/**/*.css`, `web/public/**` | The home page showing the affected styling or asset | `/` |
| `samples/auth-web/**` plus new app wiring | The route where the sample is mounted; otherwise use `/` | `/` unless the diff adds another route |

Use a static screenshot for layout, copy, typography, color, or asset changes.
Use a short video as well when the change affects the rotating logo animation,
transitions, hover states, or another interaction. The current app's only
route is `/`; do not invent a dashboard or authentication URL.

## Dev Server

### CodePress capture path

In a cloud session, prefer the CodePress app-server screenshot tools when they
are available. The committed Live Dev Server recipe is
`.codepress/dev-server/recipe.json`; it starts the `web` app with Yarn 1 and
Create React App on port 3000, and the repository's
`.codepress/dev-server/Dockerfile.web` pins Node 18 and Yarn 1.22.22.

The thin Live Dev Server image expects the Live Dev Server runtime to provide
the checkout and dependencies. If an app-server capture needs a self-contained
image instead, create a temporary, untracked Dockerfile that copies `web/`,
runs `yarn install --frozen-lockfile`, sets `BROWSER=none`, `HOST=0.0.0.0`, and
`COREPACK_ENABLE_PROJECT_SPEC=0`, and runs `yarn start` on port 3000. Remove
that temporary file after capture; never commit it.

```text
build_and_start_app_server(
  workspaceDir="/absolute/path/to/django-react-intro",
  dockerfilePath=".codepress/dev-server/Dockerfile.web",
  port=3000,
)

take_app_server_screenshot(
  containerId=<container id>,
  path="/",
  viewport={"width": 1440, "height": 1100},
  full_page=false,
  wait_ms=1000,
)

stop_app_server(containerId=<container id>)
```

The screenshot must show the rendered page body, not only a blank shell or a
loading state. Confirm that the `Welcome to React` heading or the changed
feature is visible before accepting the capture.

### Local fallback

Use Node 18 or another runtime compatible with the repository's 2017-era CRA
toolchain. Yarn 1.22.22 is the package manager recorded by the lockfile.
Because newer Corepack versions may try to edit `package.json`, disable its
project-spec write when installing or starting:

```bash
cd web
COREPACK_ENABLE_PROJECT_SPEC=0 corepack yarn install --frozen-lockfile
BROWSER=none HOST=127.0.0.1 PORT=3000 COREPACK_ENABLE_PROJECT_SPEC=0 yarn start
```

The backend is not needed for the current home page. Start it only when a
future UI change actually depends on Django-served output or an API:

```bash
cd server
pipenv run python manage.py runserver 8000
```

No committed environment file, auth session, or API mock is required for the
current route.

## Capture Spec Template

If the app-server screenshot tool is unavailable, use a temporary Playwright
spec outside the repository. This keeps the repository free of a new test
dependency while still allowing a local capture. The command below uses the
ephemeral `@playwright/test` package and does not edit `web/package.json`.

Create `/tmp/django-react-intro-pr-screenshot.spec.js`:

```javascript
const { test, expect } = require("@playwright/test");

test("capture the affected home page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle" });

  const heading = page.getByRole("heading", { name: "Welcome to React" });
  await expect(heading).toBeVisible();
  await heading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  await page.screenshot({
    path: "/tmp/pr-screenshots/pr-screenshot-home.png",
    fullPage: false,
  });
});
```

For a feature with no `Welcome to React` heading, replace the assertion with a
semantic locator for the changed content and keep the assertion before the
screenshot. There is no auth bypass or API route mocking to add for the
current app.

For animation or interaction work, use a temporary Playwright video test with
the same URL and viewport. Wait for the changed final state, keep the useful
clip under about 10 seconds, and convert the resulting WebM to a GIF for the
PR while retaining the original WebM as a download.

## Running the Spec

```bash
cd web
mkdir -p /tmp/pr-screenshots
npm exec --yes --package=@playwright/test -- playwright install chromium
npm exec --yes --package=@playwright/test -- playwright test \
  /tmp/django-react-intro-pr-screenshot.spec.js \
  --workers=1
test -s /tmp/pr-screenshots/pr-screenshot-home.png
```

The PNG should be materially larger than 10 KB and should contain the logo,
heading, and intro text (or the changed feature). Stop the frontend and remove
the temporary spec after the capture. If the before/after workflow is useful,
render the same temporary spec from the merge-base in a detached worktree,
save that image with a `-before` suffix, and treat the before pass as
best-effort; never let a baseline rendering failure replace a valid after
capture.

## Upload Assets

In CodePress cloud sessions, use `upload_pr_asset` for every PNG, GIF, and WebM
that should appear in the PR. Embed the returned permanent URL as
`[![description](url)](url)` in the PR's Demo section. Include the captured
commit SHA in that section so stale images can be recognized.

For local runs without `upload_pr_asset`, upload namespaced files to the
`pr-assets` GitHub release in `quantfive/django-react-intro`:

```bash
PR_NUMBER=123
for asset in /tmp/pr-screenshots/pr-screenshot-*.png \
             /tmp/pr-screenshots/pr-video-*.gif \
             /tmp/pr-screenshots/pr-video-*.webm; do
  test -f "$asset" || continue
  name=$(basename "$asset")
  cp "$asset" "/tmp/pr-screenshots/pr-$PR_NUMBER-$name"
  gh release upload pr-assets \
    "/tmp/pr-screenshots/pr-$PR_NUMBER-$name" \
    --repo quantfive/django-react-intro --clobber
done
```

Create the release once if needed:

```bash
gh release create pr-assets \
  --repo quantfive/django-react-intro \
  --title "PR Assets" \
  --notes "Screenshots and assets referenced in pull requests." \
  --latest=false
```

## Clean Up

```bash
rm -f /tmp/django-react-intro-pr-screenshot.spec.js
rm -rf /tmp/pr-screenshots
```

Stop any app-server container and local frontend process after capture. Do not
commit the temporary spec, a temporary Dockerfile, or generated screenshot
files.
