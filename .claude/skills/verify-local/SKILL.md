---
name: verify-local
description: "Verify quantfive/django-react-intro locally: start the web frontend in Docker via the bootstrapped recipe and run a public HTTP contract. Triggers on: verify locally, local verify, local validation, test locally, run checks."
user_invocable: true
codepress_generated: true
---

# Verify Local — quantfive/django-react-intro

Start the repository's selected app-server surface in Docker, exercise every relevant HTTP trigger for the current diff, inspect the logs, and write a verification report. The current recipe covers the public Create React App frontend under `web/` on port 3000. It does not start or verify the separate Django source under `server/`; changes that require the Django process are outside this recipe and must not be silently reported as verified.

This skill delegates startup to `.claude/skills/start-app-server/SKILL.md`, so Dockerfile, port, and environment configuration stay in one place. Verification only counts when requests reach the real container through `forward_app_request`; do not replace the app with mocks.

## Quick Reference

| Field | Value |
| --- | --- |
| Server runtime | Docker via the start-app-server recipe |
| Mode | Development CRA server |
| Health endpoint | `GET /` → status in `[200, 301, 302, 404]` |
| Auth flow | None on the selected web surface; the separate Django auth routes are not served by this recipe |
| Test account | None required or discovered |
| Cookie session | Use `useCookieJar: true` on contract requests for consistent proxy behavior |

## Step 0: Confirm the Recipe

Read `.codepress/start-app-server/recipe.json`. If it is missing, invalid, or does not have `schema_version: 1`, stop and ask for the app-server bootstrap to be run first.

## Step 1: Inventory the Diff and Write the Contract

Inspect the current branch against its default branch:

```bash
DEFAULT_BRANCH=\$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo master)
git diff "$DEFAULT_BRANCH"...HEAD --stat
git diff "$DEFAULT_BRANCH"...HEAD --name-only
git log "$DEFAULT_BRANCH"..HEAD --oneline
```

Build a Diff Trigger Inventory with one row for every changed behavior that this container can exercise. Include UI routes, response fields, auth boundaries, negative paths, and downstream effects. Pure refactors, logs, static inspection, and container health are supporting evidence only.

The default contract for this repository is:

| # | Method | Path | Expected | What it proves |
| --- | --- | --- | --- | --- |
| 1 | GET | / | 200 | The public CRA app shell is reachable |
| 2 | GET | /manifest.json | 200 | The public static manifest is served |
| 3 | GET | /favicon.ico | 200 | The public static asset path is served |

Add branch-specific assertions for any changed route or behavior. The dev server uses SPA fallback, so do not claim a missing client route is a 404 unless the live response demonstrates that behavior. Do not use the default contract to cover changes under `server/`; those changes are not reachable through this recipe and must remain uncovered.

## Step 2: Start the App

Run the generated start-app-server skill and capture its container ID:

```text
Skill({"skill": "start-app-server"})
```

If the caller provides an environment artifact, reuse it only when its recorded `head_sha` matches the live branch and its health check still passes. Otherwise create an artifact at `/tmp/codepress-qa-verifier-runs/verify-env-<pr>-<sha>-<run>.json` containing the mode, head SHA, diff range, container ID/base URL, ownership, health check, reuse instructions, and teardown command `stop_app_server(containerId=CONTAINER_ID)`.

If startup fails, do not hand-start a server or mock the backend. Report the startup failure and stop.

## Step 3: Authenticate

The selected frontend has no authentication gate. Skip login and use `useCookieJar: true` on the public requests.

## Step 4: Execute the Contract

Run every contract item in order:

```text
forward_app_request(
  containerId=CONTAINER_ID,
  path="/",
  method="GET",
  useCookieJar=true
)
```

Repeat with `/manifest.json` and `/favicon.ico`. Record the actual status, up to the first 500 characters of the response body, and a one-sentence proof note for each item. A failed item needs a diagnosis. Do not mark the overall run PASS unless every gap-worthy row in the Diff Trigger Inventory has a live result.

Before marking an item incomplete, make up to three materially different recovery attempts: check the exact path and method, inspect container logs, and retry after resolving any real startup or asset issue. Do not mock responses. If a changed behavior cannot be reached through this container, mark it as incomplete rather than silently omitting it.

## Step 5: UI Coverage

If the diff changes visible files under `web/src`, `web/public`, or `web/e2e`, use the repo's PR screenshot/Playwright setup for supporting visual evidence at `/`. A screenshot alone does not prove interactive behavior; add real browser assertions for changed interactions. If a future frontend-qa skill exists, run it for behavioral UI coverage. The overall verification cannot be PASS when a changed UI behavior is only captured visually and not behaviorally exercised.

## Step 6: Review Logs

Always inspect the container logs:

```text
get_app_server_logs(containerId=CONTAINER_ID, tail=500)
```

Record errors, critical messages, or 5xx traces that relate to the contract. A clean log review supports the HTTP results but cannot replace them.

## Step 7: Write the Report

Write `/tmp/local-verification-report.md`. The first line must be exactly:

```text
@codepress /judge-verification can you judge this verification?
```

Use this structure:

```markdown
@codepress /judge-verification can you judge this verification?

## Local Verification — quantfive/django-react-intro

**PR Head SHA:** `<live head SHA, or local HEAD when no PR exists>`

<!-- codepress-verify-result: verdict=<PASS|FAIL> head=<same head SHA> -->

**Environment artifact:** `/tmp/codepress-qa-verifier-runs/verify-env-...`

### Diff Trigger Inventory

| Surface | Location | Contract item |
| --- | --- | --- |
| <changed behavior> | <file or route> | #1 |

### Verification Contract Results

| # | Assertion | Result | Details |
| --- | --- | --- | --- |
| 1 | GET / → 200 | ✅ PASS | <actual status and response excerpt> |

### Log Review

- <findings, or no errors in container logs>

### Container

- ID: <CONTAINER_ID>
- Stopped: yes / no

### Overall: ✅ PASS
```

Use `❌ FAIL` whenever an assertion fails or a changed behavior is not covered. The report must include a current-head `codepress-verify-result` marker when a PR exists.

## Step 8: Post the Report

When an open PR exists, post the exact report file with the `post_pr_comment` tool. If no PR exists, keep the report at the path above and include it in the session handoff. Post failures too; they are actionable evidence.

## Step 9: Cleanup

If no open PR needs the environment for a follow-up judge, stop the container:

```text
stop_app_server(containerId=CONTAINER_ID)
```

Do not leave a container running after a standalone local verification unless the caller explicitly asks to keep it.

## Known Issues at Bootstrap Time

- The recipe verifies only the CRA frontend. The Django backend and its `/api/auth/` routes are not connected to the selected web server.
- The frontend is a starter app with SPA fallback; unknown client-side routes may return the home HTML with status 200.
