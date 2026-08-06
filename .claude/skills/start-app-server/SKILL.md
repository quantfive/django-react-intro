---
name: start-app-server
description: "Start the quantfive/django-react-intro app server in a Docker container and validate it responds. Uses a pre-validated recipe with no discovery or guessing. Triggers on: 'spin up the server', 'run my app', 'start the server', 'verify app server', 'test my server', 'run app server', 'spin up the app'."
user_invocable: true
codepress_generated: true
---

# Start App Server — quantfive/django-react-intro

Fast-path skill for starting this repository's app server. Discovery and one repair were completed during bootstrap on 2026-08-06T18:37:57Z; execute the recipe below rather than rediscovering the stack.

The machine-readable recipe lives at `.codepress/start-app-server/recipe.json`.

## Tools

Use these tools directly:

- `build_and_start_app_server` — build the image and start the container
- `forward_app_request` — send an HTTP request into the running container
- `get_app_server_logs` — inspect container stdout and stderr
- `stop_app_server` — stop and remove a container when cleanup is required

## Static Context

- **Stack**: Django 1.11.5 with a Create React App 1.0.10 frontend; Node 18 builds the frontend and Python 3.6 runs Django.
- **Dockerfile**: `Dockerfile`
- **Port**: `8000`
- **Validation**: `GET /` with status in `[200, 301, 302, 404]`
- **Services**: none; the app uses repository-local SQLite.
- **Required secrets**: none.

## Step 1: Drift Check

Compare the current inputs with the recipe checksums:

```bash
git hash-object Dockerfile       # expected prefix: 55b86d98d1d0e26a
git hash-object server/Pipfile  # expected prefix: a4af380b1d34c482
```

If either value differs, proceed with the current files but report the drift. The build is still the source of truth for whether the server works.

## Step 2: Fetch Secrets

This app has no vault-backed secrets. Use an empty environment map and continue.

## Step 3: Build and Start

Call:

```text
build_and_start_app_server(
  workspaceDir=<absolute path to the repository root>,
  port=8000,
  dockerfilePath="Dockerfile",
  envVars={}
)
```

The Dockerfile installs both dependency trees inside the image. It builds `web/` with Yarn 1.22.22, copies the resulting assets to `server/static/build`, installs the locked Python dependencies from `server/Pipfile.lock`, applies the initial SQLite migrations, and starts Django on `0.0.0.0:8000`.

If retrying after a fix in the same session, pass `existingContainerId` from the previous attempt so the old container is replaced cleanly.

## Step 4: Validate

If the start tool reports that the health check is ready, send:

```text
forward_app_request(
  containerId=<container id>,
  path="/",
  method="GET"
)
```

Accept status `200`, `301`, `302`, or `404`. The expected healthy response for this repository is `HTTP 200` with the React HTML shell and `/static/js/` and `/static/css/` asset references.

If health is timed out, poll `GET /` up to 12 times at 5-second intervals. Inspect `get_app_server_logs` before the final retry. A crash, a non-allowlisted 4xx, a 5xx response, or exhaustion of the poll budget is a failure.

## Step 5: Report

Report the container ID, port `8000`, the `forward_app_request` command for the root route, and the `stop_app_server` command. Leave a successfully started container running so the caller can continue verification. Stop only an explicitly requested teardown or a failed container that would otherwise leak.

## Known Fixes

- The legacy CRA `postbuild` script copies into `../server/static/build`; the Dockerfile creates `server/static` before `yarn build`.
- Django's SQLite path is inside `/app/server`, while the container runs as UID 65534; the Dockerfile chowns that tree before startup.
- The old frontend uses Yarn 1.22.22 and is built with Node 18. The install command uses `--ignore-engines` because the repository now includes the Playwright package for screenshot capture.
- Django auth/admin routes need the initial SQLite schema, so migrations run during the image build before the app directory is chowned for the runtime user.
- The app binds to `0.0.0.0:8000` in the foreground so the container proxy can reach it.

## Repair on Failure

Before repairing, read `repair_count` from `.codepress/start-app-server/recipe.json`. If it is already 3 or higher, stop and report that the recipe needs a fresh bootstrap rather than attempting another repair.

For a repair attempt:

1. Read the full build error and `get_app_server_logs` output.
2. Fix all related issues in one edit pass; do not rebuild after only the first symptom.
3. Retry `build_and_start_app_server` with the previous `existingContainerId`.
4. If the recipe itself changes, increment `repair_count`, set `origin` to `repair`, update `bootstrapped_at`, recompute the two input checksums, and append the fix to `known_fixes`.
5. Re-run the HTTP validation before treating the repair as successful.

Never put credentials in the recipe or Dockerfile. Do not solve a failed HTTP check by weakening the verification status list.
