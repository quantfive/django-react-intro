---
name: start-app-server
description: "Start the quantfive/django-react-intro frontend in a Docker container and validate that it responds. Uses a pre-validated recipe with no discovery or guessing. Triggers on: spin up the server, run my app, start the server, verify app server, test my server, run app server, spin up the app."
user_invocable: true
codepress_generated: true
---

# Start App Server — quantfive/django-react-intro

Fast-path skill for starting the repository's app server. Discovery was completed on 2026-08-10T04:15:25Z. Read the recipe and execute it directly.

The recipe lives at `.codepress/start-app-server/recipe.json`.

## Tools

Use these tools directly:

- `build_and_start_app_server` to build the image and start the container
- `forward_app_request` to send HTTP requests into the running container
- `get_app_server_logs` to inspect container output
- `stop_app_server` to clean up when requested
- `list_vault_secrets` and `get_vault_secrets` only when a future recipe adds required secrets

## Static Context

- **Stack:** Create React App 1.0.10 under `web/`, served by the CRA development server
- **Dockerfile:** `Dockerfile`
- **Port:** 3000
- **Validation:** `GET /` with status in `[200, 301, 302, 404]`
- **Services:** none
- **Required secrets:** none

## Step 1: Drift Check

From the repository root, compare these hashes with `recipe.input_checksums`:

```bash
git hash-object Dockerfile
git hash-object web/package.json
```

The recorded values are:

- Dockerfile: `f62f4ad864b4fcbe`
- Dependency manifest: `3e3a3c381db1ac9e`

If either value differs, continue with the build but report that the recipe may need regeneration.

## Step 2: Build and Start

This app needs no vault secrets or static environment overrides.

```text
build_and_start_app_server(
  workspaceDir=<absolute path to the repository root>,
  port=3000,
  dockerfilePath="Dockerfile",
  envVars={}
)
```

The Dockerfile installs Yarn 1.22.22 and all frontend dependencies during image build, then runs the installed CRA binary directly. The server binds to `0.0.0.0:3000`.

If retrying after a Dockerfile or dependency fix, pass `existingContainerId=<previous id>` so the prior container is stopped after a successful rebuild.

## Step 3: Validate

If the start tool reports that the container is ready, send a real request:

```text
forward_app_request(
  containerId=CONTAINER_ID,
  path="/",
  method="GET"
)
```

A response with status 200, 301, 302, or 404 confirms that the server is reachable. If startup times out, poll the same path up to 12 times at five-second intervals and inspect `get_app_server_logs` before deciding that the container failed.

## Step 4: Report

Tell the user:

- Container ID
- Port 3000
- How to call `forward_app_request(containerId=..., path="/")`
- How to stop it with `stop_app_server(containerId=...)`

If the user only asked to start the server, stop after reporting the live container. Leave a successful container running for the caller.

## Known Fixes

- The existing `.codepress/dev-server/Dockerfile.web` is a bind-mount-only Live Dev Server image, so this recipe uses a standalone root Dockerfile.
- `@playwright/test` is pinned to 1.53.2 because newer releases require Node 20 and the CRA image uses Node 18.

## Repair on Failure

If the build or start fails:

1. Read the complete tool error and `get_app_server_logs` output.
2. Check the Dockerfile and `web/package.json` together for dependency or port drift.
3. Fix all identified issues before rebuilding.
4. Retry with `existingContainerId` when a prior container exists.
5. After three prior repairs, stop and request a fresh bootstrap rather than looping.

Only update the recipe after a real repair: set `origin` to `repair`, increment `repair_count`, refresh `bootstrapped_at` and input hashes, and append a short entry to `known_fixes`.

## Cleanup

Do not stop a successfully started container unless the user asks for teardown or it was started only for a validation run that is now complete. Stop failed containers so they do not leak.
