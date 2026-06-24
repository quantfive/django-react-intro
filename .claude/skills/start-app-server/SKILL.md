---
name: start-app-server
description: "Start the django-react-intro app server in a Docker container and validate it responds. Uses a pre-validated recipe — no discovery, no guessing. Triggers on: 'spin up the server', 'run my app', 'start the server', 'verify app server', 'test my server', 'run app server', 'spin up the app'."
user_invocable: true
codepress_generated: true
---

# Start App Server — django-react-intro

Fast-path skill for starting django-react-intro's app server. All discovery was done during bootstrap on 2026-06-24T06:47:00Z — just execute.

The recipe lives at `.codepress/start-app-server/recipe.json`. This skill is the human-readable companion.

## Tools

These tools are pre-loaded — call them directly:

- `build_and_start_app_server` — build image + start container in one step
- `forward_app_request` — HTTP request into the running container
- `get_app_server_logs` — container stdout/stderr
- `stop_app_server` — clean up when done
- `list_vault_secrets`, `get_vault_secrets` — fetch required secrets

## Static Context (from bootstrap)

- **Stack**: Django 1.11.29 + SQLite + Django REST Framework, Python 3.7, development server on port 8000
- **Dockerfile**: `Dockerfile.codepress` (inside `server/` — build context is the server/ subdirectory)
- **Port**: 8000
- **Validation**: `GET /api/auth/login/` → status in [200, 301, 302, 404, 405]
- **Services**: none
- **Required secrets**: none

## Step 1: Drift Check

Verify the recipe hasn't gone stale:

```bash
git hash-object server/Dockerfile.codepress   # compare to recipe.input_checksums.dockerfile (dd0fe78c2c6f455d)
git hash-object server/Pipfile.lock           # compare to recipe.input_checksums.dependency_manifest (81916a6062098028)
```

If either checksum mismatches, the file has been edited since bootstrap. Proceed anyway — the agent will catch any actual breakage at build time — but flag the drift in your final report so the user knows the recipe may need updating.

## Step 2: Fetch Secrets

This app needs no vault secrets. Skip to Step 3.

## Step 3: Build and Start

```text
build_and_start_app_server(
  workspaceDir=<absolute path to repo root>/server,
  port=8000,
  dockerfilePath="Dockerfile.codepress",
  envVars={}
)
```

Note: the build context is the `server/` subdirectory of the repo, not the repo root. This is because the repo root contains symlinks (CodePress skill directories) that the Docker proxy rejects. The Django application is self-contained within `server/`.

If retrying after a fix in the same session, pass `existingContainerId=<previous id>` so the old container is stopped on a successful rebuild. On the first attempt there is no previous container — omit the argument.

## Step 4: Validate

If the tool returns `health_check: "ready"` → go to Step 5.

If it returns `health_check: "timed_out"`, poll up to 12 rounds × 5s each (default 12 rounds = 60 seconds):

```text
for attempt in 1..12:
  r = forward_app_request(containerId, path="/api/auth/login/", method="GET")
  if r.status in [200, 301, 302, 404, 405]: break
  sleep 5
```

If the poll is about to exhaust without success, check `get_app_server_logs` once. If the logs show a still-progressing startup step (running migrations, compiling assets, warming caches), extend with up to another 12 rounds before giving up.

Success = any status in [200, 301, 302, 404, 405]. A definite crash in the logs, or true exhaustion after extension, counts as failure and jumps to "Repair on Failure" below.

## Step 5: Report

Tell the user:

- Container ID: `<id>`
- Port: 8000
- How to hit it: `forward_app_request(containerId, path="...")`
- How to stop: `stop_app_server(containerId)`

If the user only asked to start / spin up the server, **STOP HERE**. Do not proceed to verification unless they asked to verify or test changes.

## Known Fixes (from bootstrap)

- `setuptools<60` required: django-allauth 0.33.0 uses `setuptools.convert_path`, removed in setuptools 60+
- `python:3.7-slim` required: Django 1.11 has a `SyntaxError` in `admin/widgets.py` on Python 3.8+ (generator expression parenthesization)
- `django==1.11.29` required: Django 1.11.5 has Python 3.7 incompatibilities fixed in patch releases

## Repair on Failure

If `build_and_start_app_server` returns a genuine build/start error (not just a health timeout):

**Before attempting repair, check `recipe.repair_count`.** If it is already at the `>= 3` ceiling, do not attempt in-session repair — tell the user the recipe is likely stale and suggest they re-invoke `/codepress-bootstrap-app-server` to regenerate it from scratch, then stop.

Otherwise:

1. Read `get_app_server_logs` AND the tool's error string in full
2. Match the error against the Known Fixes list above — apply that fix first if it matches
3. Identify ALL issues in the error output — do not rebuild after fixing just one
4. Edit `Dockerfile.codepress` (and, if needed, `recipe.json` for port/services changes)
5. Rebuild with `existingContainerId` set to the previous container's ID
6. If still failing after 3 in-session retries:
   - Bump `recipe.json.repair_count` by 1
   - Set `recipe.json.origin` to `"repair"`
   - Update `recipe.json.bootstrapped_at` to the current ISO timestamp
   - Recompute `input_checksums` for the files you changed
   - Append a one-line summary of what you fixed to `recipe.json.known_fixes`
   - Also append that line to the "Known Fixes" section above in this SKILL.md
   - Commit:
     ```bash
     git add server/Dockerfile.codepress .codepress/start-app-server/recipe.json .claude/skills/start-app-server/
     git commit -m "fix: update start-app-server recipe (repair attempt <N>)"
     ```
   - In ECS mode, also push: `git push origin HEAD`

If you can't get it running after all that, stop the container if one is up, tell the user what you tried, and leave the recipe unchanged.

## Cleanup

**Do NOT stop a successfully started container.** The caller (user or `app-server-verify` Step 0) delegated here to leave a live server they can hit with `forward_app_request`. Leave it running and just report the container ID.

Only call `stop_app_server(containerId)` when:

- The user explicitly asks to stop or tear down the server, OR
- A build/start attempt failed and left a dead container behind (stop that failed container so it doesn't leak), OR
- You started a container as part of verification and the user asked to clean up afterward
