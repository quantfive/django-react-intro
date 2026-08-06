---
name: verify-local
description: "Verify django-react-intro locally: start the web app in Docker via the bootstrapped recipe, run HTTP assertions, and post a verification report to an open PR."
user_invocable: true
codepress_generated: true
---

# Verify Local — django-react-intro

Start the repository's containerized Create React App frontend and exercise a real HTTP contract against it. Post a report to the open PR when one exists.

This skill delegates all server configuration to `.claude/skills/start-app-server/SKILL.md` and `.codepress/start-app-server/recipe.json`. The recipe targets `web/` on port 3000. The separate legacy Django service in `server/` is not started by this recipe because the repository has no canonical combined start command; Django authentication assertions are therefore outside this local contract.

The standard is to test every changed behavior from a real trigger surface. Do not replace live requests with code inspection, mocks, or a health check alone.

## Quick Reference

| Field | Value |
| --- | --- |
| Server runtime | Docker via the generated start-app-server skill |
| Mode | Local development recipe |
| Health endpoint | `GET /` → status in `[200, 301, 302, 404]` |
| Auth flow | None for the web frontend; no frontend auth gate or API calls were found |
| Test account | Not applicable to the selected web recipe |
| Session cookie | Not applicable |

## Step 0: Confirm the Recipe

Read `.codepress/start-app-server/recipe.json`. If it is missing, invalid JSON, or does not have `schema_version` equal to `1`, tell the user to run the app-server bootstrap first and stop. Confirm that `.claude/skills/start-app-server/SKILL.md` also exists and is generated.

## Step 1: Inventory the Diff and Write the Contract

Determine the current branch diff:

```bash
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo master)
git diff "$DEFAULT_BRANCH"...HEAD --stat
git log "$DEFAULT_BRANCH"..HEAD --oneline
gh pr view --json title,body 2>/dev/null
```

Write a Diff Trigger Inventory before executing requests. Include every changed observable surface with `Surface`, `Location`, and `Contract item` columns. For this repository, frontend changes under `web/src/`, `web/public/`, or the frontend manifest map to the rendered `/` page; backend changes under `server/` are not covered by this recipe and must be reported as incomplete rather than silently omitted.

Start with this default contract and add branch-specific rows for every changed behavior:

| # | Method | Path | Expected | Notes |
| --- | --- | --- | --- | --- |
| 1 | GET | `/` | 200, 301, 302, or 404 | Container liveness and CRA HTML shell |
| 2 | GET | `/static/js/bundle.js` | 200 | Frontend JavaScript bundle is reachable |
| 3 | GET | `/manifest.json` | 200 | Public frontend asset is served |

Do not invent a 404 assertion for this app: CRA's development server may return the application shell for unknown paths. Add a negative assertion only when the changed server surface has a grounded expected response.

## Step 2: Start the App Server

If the caller provides an `environment_artifact_path`, reuse it only when its recorded head SHA matches the current head and its health check still passes. Otherwise delegate to the generated fast path:

```text
Skill({"skill": "start-app-server"})
```

Capture the returned container ID as `CONTAINER_ID`. Write or update `/tmp/codepress-qa-verifier-runs/verify-env-<pr>-<sha>-<run>.json` with the mode, current head SHA, diff range, container ID, base URL, ownership, health check, reuse instructions, and teardown command `stop_app_server(containerId=CONTAINER_ID)`.

If startup fails, do not hand-start a server or mock it. Report the complete start failure and stop.

## Step 3: Authentication

The selected web container has no authentication gate and no frontend login flow. Skip login. Do not treat the Django `rest_auth` routes as covered because the Django service is not running in this recipe and no frontend code calls them.

## Step 4: Execute the Contract

Run every contract item in order with `forward_app_request` against the live container. Use real responses and record:

- the actual HTTP status;
- the response body, or a concise excerpt when it is long;
- `✅ PASS` with a one-sentence confirmation, or `❌ FAIL` with a diagnosis.

If a prerequisite fails, make up to three materially different recovery attempts, such as checking the exact route, reviewing container logs, and correcting a recipe or fixture issue. Do not mock around missing setup. Overall verification is `✅ PASS` only when every gap-worthy inventory row has a live passing result.

## Step 5: UI Verification

If the diff touches `web/src/**/*.{js,jsx,css}` or `web/public/**/*`, verify the rendered page at `/` with the browser. The page is ready when the `Welcome to React` heading or the changed feature's stable selector is visible, the page is not blank, and there are no uncaught console errors.

If `.claude/skills/frontend-qa/SKILL.md` exists, invoke it for behavioral UI evidence and include its report and artifact manifest. If it does not exist, capture the changed page with:

```text
take_app_server_screenshot(
  containerId=CONTAINER_ID,
  path="/",
  viewport={"width":1280,"height":800},
  wait_ms=1000,
  full_page=false
)
```

A screenshot is supporting evidence only; it cannot replace a behavior-specific contract assertion. Use `useCookieJar=true` only when a future frontend auth flow is added.

## Step 6: Review Logs

Always inspect the container logs after the contract:

```text
get_app_server_logs(containerId=CONTAINER_ID, tail=500)
```

Record any error or stack trace related to the changed behavior. A clean response does not erase a runtime error that occurred during the flow.

## Step 7: Write the Report

Write `/tmp/local-verification-report.md`. Its first line must be exactly:

```text
@codepress /judge-verification can you judge this verification?
```

Use this structure:

```markdown
@codepress /judge-verification can you judge this verification?

## Local Verification — django-react-intro

**PR Head SHA:** `<live head SHA>`

<!-- codepress-verify-result: verdict=<PASS|FAIL> head=<live head SHA> -->

**Environment artifact:** `/tmp/codepress-qa-verifier-runs/verify-env-<pr>-<sha>-<run>.json`

### Diff Trigger Inventory

| Surface | Location | Contract item |
| --- | --- | --- |
| <changed behavior> | <file or route> | <item number> |

### Verification Contract Results

| # | Assertion | Result | Details |
| --- | --- | --- | --- |
| 1 | GET / → expected status | ✅ PASS | <actual response evidence> |

### Frontend QA

- Status: PASS / FAIL / not applicable
- Report: <path or not run>
- Manifest: <path or not run>
- Artifacts: <screenshots, videos, traces, or none>

### Log Review

- <findings, or no errors in container logs>

### Container

- ID: <CONTAINER_ID>
- Stopped: yes / no

### Overall: ✅ PASS
```

Replace the overall line with `### Overall: ❌ FAIL` if any contract row fails or if a changed backend behavior is outside this app-server surface. Keep the current live head SHA in both the prose field and the hidden marker.

## Step 8: Post the Report

If the current branch has an open PR, post the report with `post_pr_comment` using `repoDir` and the PR number. Confirm the report names the live PR head and contains the matching `codepress-verify-result` marker. If no PR exists, keep the report at the path above and include it in the session result.

## Step 9: Cleanup

When no PR needs the environment, or after the report is final, stop the container:

```text
stop_app_server(containerId=CONTAINER_ID)
```

If a PR exists and a downstream judge will reuse the environment, leave teardown to the orchestrator.

## Known Issues at Bootstrap Time

- The local recipe validates only the React frontend. The Django backend has old dependencies, no canonical combined start command, and a broken WSGI module target; it is intentionally outside this generated contract.
- No frontend test account, auth fixture, or API mock is needed for the current public Home screen.
