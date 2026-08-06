---
name: verify-local
description: "Verify quantfive/django-react-intro locally: start the Django/React app in Docker from its bootstrapped recipe, run HTTP contract assertions, and report the evidence to the open pull request. Triggers on: 'verify locally', 'local verify', 'local validation', 'test locally', 'run checks'."
user_invocable: true
codepress_generated: true
---

# Verify Local — quantfive/django-react-intro

Run the app in its real Docker container, then exercise the HTTP contract below with `forward_app_request`. The server configuration comes from `.codepress/start-app-server/recipe.json` and `.claude/skills/start-app-server/SKILL.md`; do not hand-start a different server or mock the backend.

This contract is deliberately trigger-based. It covers every observable route found during bootstrap and adds branch-specific rows for changed files. A health check alone is not a verification result.

## Quick Reference

| Field | Value |
| --- | --- |
| Server runtime | Docker via the `start-app-server` recipe |
| Mode | Local development defaults from the recipe |
| Health endpoint | `GET /` → status in `[200, 301, 302, 404]` |
| Auth flow | No auth gate protects the React shell. Django REST Auth exposes session/token endpoints; anonymous access to `/api/auth/user/` is denied. |
| Test account | No seed script or test account was found; never invent credentials. |
| Session cookie | Not used for the default contract; use `useCookieJar: true` only after a real login flow is discovered. |

## Step 0: Confirm the Recipe

Read `.codepress/start-app-server/recipe.json`. It must be valid JSON with `schema_version` equal to `1`, `dockerfile_path` equal to `Dockerfile`, and `port` equal to `8000`. If it is missing or invalid, stop and ask for the app-server bootstrap to be rerun.

The current recipe uses no vault secrets, static environment variables, or companion services. Its validation path is `/` and its accepted startup statuses are `200`, `301`, `302`, and `404`.

## Step 1: Inventory the Diff and Write the Contract

Identify the live default branch and inspect the branch diff:

```bash
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo master)
git diff "$DEFAULT_BRANCH"...HEAD --stat
git diff "$DEFAULT_BRANCH"...HEAD --name-only
git log "$DEFAULT_BRANCH"..HEAD --oneline
```

Start with this inventory, then add a live row for every changed behavior that can be exercised through HTTP or a rendered page:

| Surface | Location | Contract item |
| --- | --- | --- |
| React shell | `GET /` | #1 returns HTTP 200 and contains the root mount plus built static asset references |
| REST login contract | `OPTIONS /api/auth/login/` | #2 returns HTTP 200, advertises `POST, OPTIONS`, and describes the username/email/password fields |
| Anonymous auth boundary | `GET /api/auth/user/` without credentials | #3 returns HTTP 403 with an authentication-required message |
| Changed React UI | Any diff under `web/src/**` or `web/public/**` | #4 captures `/` with a visible changed feature; add only when the diff touches visible UI |

The app intentionally ends its Django URL list with a React catch-all. Unknown browser paths can therefore return the React shell with HTTP 200; do not use a generic nonexistent URL as a 404 assertion. The admin login route is not in the default contract because the repository has no admin test fixture or seeded `django_site` record.

For every added row, name the real trigger, expected status, response evidence, and the negative assertion that would prove a failure. Pure refactors, log absence, static inspection, and a container health signal do not replace a live contract item.

## Step 2: Start the App Server

Follow the local fast path in `.claude/skills/start-app-server/SKILL.md`, which calls `build_and_start_app_server` with `Dockerfile` on port `8000`. Capture the returned container ID as `CONTAINER_ID`. If the caller supplied a reusable verification environment, reuse it only when its recorded head SHA matches the current `git rev-parse HEAD` and its `GET /` health check still passes.

Write or update an environment record at `/tmp/codepress-qa-verifier-runs/verify-env-<pr>-<sha>-<run>.json` containing:

```json
{
  "schema_version": 1,
  "mode": "local",
  "head_sha": "<current git rev-parse HEAD>",
  "diff_range": "<default branch>...HEAD",
  "environment": {
    "container_id": "<CONTAINER_ID>",
    "base_url": "http://localhost:8000"
  },
  "owned_by_verifier": true,
  "health_check": "GET / -> <status>",
  "reuse_instructions": "Reuse only for the same head SHA while GET / remains healthy.",
  "teardown": "stop_app_server(containerId=CONTAINER_ID)"
}
```

If startup fails, report the complete tool error and stop. Do not replace the container with a hand-started Django process or a mocked response.

## Step 3: Authenticate When a Real Flow Exists

The default contract has no login step because no test account was found and no application route requires authentication. Do not send guessed credentials.

Still exercise the anonymous boundary in contract item #3. If a future branch adds a documented seed account or login fixture, use the real REST endpoint at `/api/auth/login/`, pass the discovered request body, set `useCookieJar: true`, and then verify an authenticated endpoint with the stored session. Record the cookie name and account source without writing the password into the report.

## Step 4: Execute the HTTP Contract

Run each item against the same `CONTAINER_ID`, record the actual status and a response excerpt, and explain what the result proves:

```text
forward_app_request(containerId=CONTAINER_ID, path="/", method="GET")
```

Pass item #1 only when the response is HTTP 200 and the body contains `id="root"`, `/static/js/`, and `/static/css/`.

```text
forward_app_request(containerId=CONTAINER_ID, path="/api/auth/login/", method="OPTIONS")
```

Pass item #2 only when the response is HTTP 200, the headers include `Allow: POST, OPTIONS`, and the JSON body describes the login fields.

```text
forward_app_request(containerId=CONTAINER_ID, path="/api/auth/user/", method="GET")
```

Pass item #3 only when the response is HTTP 403 and its JSON body says that authentication credentials were not provided. A 200 response here is a security failure, not a success.

For UI changes, also capture the affected route with `take_app_server_screenshot` after the HTTP checks:

```text
take_app_server_screenshot(
  containerId=CONTAINER_ID,
  path="/",
  viewport={"width": 1280, "height": 800},
  wait_ms=1000
)
```

Screenshot evidence is supplemental. A changed UI behavior is not verified by a screenshot alone; add a real interaction or response assertion for the behavior whenever the app exposes one.

Do not use mocks or synthetic success responses. If a contract row cannot be exercised from a real app-server route, keep it in the report as `FAIL` for incomplete local coverage.

## Step 5: Review Logs

After all requests, inspect the container logs:

```text
get_app_server_logs(containerId=CONTAINER_ID, tail=500)
```

Note errors or stack traces related to the changed behavior. A clean log review supports the HTTP evidence but cannot replace it.

## Step 6: Write the Verification Report

Write `/tmp/local-verification-report.md`. The first line must be exactly:

```text
@codepress /judge-verification can you judge this verification?
```

Use this structure:

```markdown
@codepress /judge-verification can you judge this verification?

## Local Verification — quantfive/django-react-intro

**PR Head SHA:** `<live head SHA, or current git rev-parse HEAD when no PR exists>`

<!-- codepress-verify-result: verdict=<PASS|FAIL> head=<same SHA> -->

**Environment artifact:** `/tmp/codepress-qa-verifier-runs/verify-env-<pr>-<sha>-<run>.json`

### Diff Trigger Inventory

| Surface | Location | Contract item |
| --- | --- | --- |
| React shell | `GET /` | #1 |

### Verification Contract Results

| # | Assertion | Result | Details |
| --- | --- | --- | --- |
| 1 | `GET /` → 200 | ✅ PASS | Actual status and response markers |
| 2 | `OPTIONS /api/auth/login/` → 200 | ✅ PASS | Actual status, Allow header, and response fields |
| 3 | Anonymous `GET /api/auth/user/` → 403 | ✅ PASS | Actual status and denial body |

### Log Review

- No errors related to the contract, or describe the exact finding.

### Container

- ID: `<CONTAINER_ID>`
- Stopped: yes / no

### Overall: ✅ PASS
```

Use `❌ FAIL` for any failed assertion or any changed behavior left outside the live HTTP contract. Overall `✅ PASS` is allowed only when every gap-worthy inventory row has a passing live result.

## Step 7: Post the Report When a PR Exists

If the current branch has an open pull request, include the current live head SHA and the `codepress-verify-result` marker, then post the exact report with `post_pr_comment` using the repository root and PR number. If no PR exists, keep the report at `/tmp/local-verification-report.md` and return its path.

Do not post a report for a different head SHA. A generated artifact PR should use `post_generated_artifact_verification_report`; an ordinary PR should use `post_pr_comment`.

## Step 8: Cleanup

If no PR or follow-up judge will reuse the environment, stop the container:

```text
stop_app_server(containerId=CONTAINER_ID)
```

If a PR exists and the orchestrator is retaining the environment for a judge or another verification pass, leave it running and record that ownership in the environment artifact.

## Known Issues at Bootstrap Time

- No seed script or test account was found, so authenticated success paths are not part of the default contract.
- The React catch-all intentionally serves the shell for unknown browser paths; generic 404 checks are not meaningful for this repository.
- The admin route can require a seeded `django_site` row; it is excluded from the default contract until the repository provides a fixture.
- The root route and REST auth contract were exercised against the real container during bootstrap: `/` returned 200, `OPTIONS /api/auth/login/` returned 200, and anonymous `GET /api/auth/user/` returned 403.
