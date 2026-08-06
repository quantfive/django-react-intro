---
name: verify-local
description: "Verify django-react-intro locally: start the public web app in Docker via the bootstrapped recipe, run HTTP assertions, and post a @codepress report to the open PR. Triggers on: 'verify locally', 'local verify', 'local validation', 'test locally', 'run checks'."
user_invocable: true
codepress_generated: true
---

# Verify Local — django-react-intro

Run the public web app in a Docker container, exercise its real HTTP surfaces,
and write a verification report led by @codepress /judge-verification can you
judge this verification?

Startup delegates to .claude/skills/start-app-server/SKILL.md, so the Dockerfile,
port, environment, and container alias come from the validated recipe. Counts
only when requests reach the real container; do not mock the app or hand-start a
replacement process.

The current recipe targets the Create React App frontend under web/. The Django
project under server/ is a separate backend surface and is not started by this
recipe. Update the recipe and this skill together if that changes.

## Quick Reference

| Field | Value |
| --- | --- |
| Server runtime | Docker via start-app-server and .codepress/start-app-server/recipe.json |
| Mode | Development recipe defaults |
| Health endpoint | GET / → status in [200, 301, 302, 404] |
| Auth flow | None for the public frontend route |
| Test account | Not applicable to the current frontend recipe |
| Cookie session | Not applicable |

## Step 0: Confirm the Recipe

Read .codepress/start-app-server/recipe.json. If it is absent or invalid, tell
the user to bootstrap the app server first and stop. It must have
schema_version 1, dockerfile_path Dockerfile.codepress, port 3000, and the
validation values shown above.

## Step 1: Inventory the Diff and Write the Contract

Determine the branch diff and current head:

~~~
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo master)
git diff "$DEFAULT_BRANCH"...HEAD --stat
git log "$DEFAULT_BRANCH"..HEAD --oneline
git rev-parse HEAD
~~~

Write a Diff Trigger Inventory before running requests. Every changed observable
surface must map to a live contract item. Use these baseline rows and add
branch-specific rows when the diff changes them:

| Surface | Location | Contract item |
| --- | --- | --- |
| Public rendered page | web/src/containers/home/Home.js, route / | Page loads and contains the visible welcome heading |
| Static app asset | web/public/manifest.json, route /manifest.json | Static asset is served successfully |
| Negative static asset | CRA dev server, route /static/js/__codepress_missing__.js with Accept: application/javascript | Unknown asset returns a clean 404 response |

Default contract:

| # | Method | Path | Expected | Notes |
| --- | --- | --- | --- | --- |
| 1 | GET | / | 200 | The HTML shell and public app route respond |
| 2 | GET | /manifest.json | 200 | The public static asset is served |
| 3 | GET | /static/js/__codepress_missing__.js | 404 | Unknown static asset returns a 404 when JavaScript is requested |

If the diff changes a visible component, expand item 1 with a browser screenshot
or a real semantic UI assertion against /. A health check alone never proves
changed UI behavior. If the diff changes only files under server/, record that
the frontend-only recipe cannot cover the change and mark the run FAIL.

## Step 2: Start the App Server

Reuse a supplied environment artifact only when its head_sha matches the live
head and its health check still passes. Otherwise delegate startup:

~~~
Skill({"skill": "start-app-server"})
~~~

Capture the returned container ID as CONTAINER_ID. For a PR-backed run, write
/tmp/codepress-qa-verifier-runs/verify-env-<pr>-<sha>-<run>.json with mode,
head_sha, diff_range, container/base URL handles, ownership, health check, reuse
instructions, and teardown command:

~~~
stop_app_server(containerId=CONTAINER_ID)
~~~

If startup fails, do not hand-start the app. Report the full failure and stop.

## Step 3: Authenticate

The current app-server recipe exposes a public frontend and has no auth gate.
Skip login and cookie setup. Django REST Auth routes in server/server/urls.py
are not part of the running frontend container.

## Step 4: Execute the Contract

For each contract item, call the real proxy:

~~~
forward_app_request(
  containerId=CONTAINER_ID,
  path="/",
  method="GET"
)
~~~

Repeat for /manifest.json and /static/js/__codepress_missing__.js. For the
negative asset, include headers={"Accept": "application/javascript"} so CRA's
HTML history fallback is not selected. Record the actual status,
the first 500 response characters, and a one-sentence proof for PASS or diagnosis
for FAIL. Use real responses. If setup or a request fails, make up to three
materially different recovery attempts for that item and fix the root cause when
supported. Never use a mock to turn a failed live request into a pass. Every
Diff Trigger Inventory row needs a live result before the overall result passes.

## Step 5: UI Verification

When the diff touches web/src/**/*.js, web/src/**/*.css, web/src/**/*.svg, or
web/public/**, capture the changed route with the real container:

~~~
take_app_server_screenshot(
  containerId=CONTAINER_ID,
  path="/",
  viewport={"width": 1280, "height": 800},
  wait_ms=1000
)
~~~

The screenshot must show the changed feature, not only a blank shell or loading
state. It supports the HTTP contract but does not replace a semantic assertion.

## Step 6: Log Review

Always inspect logs after the contract:

~~~
get_app_server_logs(containerId=CONTAINER_ID, tail=500)
~~~

Note errors or stack traces related to changed behavior. The Node 18
http_parser deprecation warning is expected for this legacy dependency tree;
compile failures and request-time exceptions are not.

## Step 7: Write the Report

Write /tmp/local-verification-report.md. The first line must be exactly:

~~~
@codepress /judge-verification can you judge this verification?
~~~

Use this structure:

~~~markdown
@codepress /judge-verification can you judge this verification?

## Local Verification — django-react-intro

PR Head SHA: <live head SHA>

<!-- codepress-verify-result: verdict=<PASS|FAIL> head=<live head SHA> -->

Environment artifact: /tmp/codepress-qa-verifier-runs/verify-env-...json

### Diff Trigger Inventory

| Surface | Location | Contract item |
| --- | --- | --- |
| <changed behavior> | <file or route> | #1 |

### Verification Contract Results

| # | Assertion | Result | Details |
| --- | --- | --- | --- |
| 1 | GET / → 200 | PASS | HTTP 200; public app responded |

### Log Review

- <findings, or no errors in container logs>

### Container

- ID: <CONTAINER_ID>
- Stopped: yes / no

### Overall: PASS
~~~

Use Overall: FAIL when any assertion fails or when a changed surface is not
covered by the frontend-only recipe. Do not report PASS for a health check alone.

## Step 8: Post the Report

If an open PR exists, verify that the report names the live PR head and that the
working tree is clean before posting. Use the CodePress PR comment tool with the
report file, not a direct gh pr comment call. Post failures too.

If there is no open PR, leave the report at the path above for the caller and
stop the container after writing it. If a PR exists, leave teardown to the
orchestrator until the verification/judge loop is complete.

## Step 9: Cleanup

When no PR exists, or when the caller owns cleanup:

~~~
stop_app_server(containerId=CONTAINER_ID)
~~~

Do not stop a container that a PR-backed judge run still needs.

## Known Issues at Bootstrap Time

- The current recipe verifies the React frontend only. Django authentication and
  API routes under server/ require a separate backend recipe.
- No test account is discoverable, and none is needed for the public frontend
  contract.
