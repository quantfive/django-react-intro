---
name: start-app-server
description: "Start the django-react-intro web app in a Docker container and validate it responds. Uses a pre-validated recipe with no discovery or guessing."
user_invocable: true
codepress_generated: true
---

# Start App Server — django-react-intro

Fast-path startup for the repository's Create React App frontend. Discovery was completed on 2026-08-06T21:12:43Z. The recipe is at `.codepress/start-app-server/recipe.json`.

This recipe targets the independently runnable `web/` frontend on port 3000. The repository also contains a separate legacy Django backend under `server/`, but no combined full-stack start command was present during bootstrap.

## Tools

Use these tools directly:

- `build_and_start_app_server` to build the image and start the container
- `forward_app_request` to send HTTP requests into the container
- `get_app_server_logs` to inspect startup failures
- `stop_app_server` to clean up a container

## Static Context

- **Stack**: Create React App 1.0.10, React 15.6.1, Yarn 1.22.22, Node 18
- **Dockerfile**: `Dockerfile.codepress`
- **Port**: 3000
- **Validation**: `GET /` with status in `[200, 301, 302, 404]`
- **Services**: none
- **Required secrets**: none

## Step 1: Drift Check

Compare the current inputs with the recipe checksums:

```bash
git hash-object Dockerfile.codepress
git hash-object web/package.json
```

The expected first 16 characters are `34367fcd930b90e4` and `e334e8cea064856b`. A mismatch is a warning that the recipe may need updating; continue to build and report the drift.

## Step 2: Environment

No vault secrets or companion services are required. Use these safe runtime values:

```json
{
  "HOST": "0.0.0.0",
  "PORT": "3000",
  "BROWSER": "none",
  "DANGEROUSLY_DISABLE_HOST_CHECK": "true",
  "CHOKIDAR_USEPOLLING": "true"
}
```

## Step 3: Build and Start

```text
build_and_start_app_server(
  workspaceDir=<absolute path to the repository root>,
  port=3000,
  dockerfilePath="Dockerfile.codepress",
  name="web",
  envVars={
    "HOST":"0.0.0.0",
    "PORT":"3000",
    "BROWSER":"none",
    "DANGEROUSLY_DISABLE_HOST_CHECK":"true",
    "CHOKIDAR_USEPOLLING":"true"
  }
)
```

If retrying after a fix, pass `existingContainerId` with the previous container ID so it is replaced cleanly.

## Step 4: Validate

When the tool reports `health_check: "ready"`, call:

```text
forward_app_request(containerId=<container id>, path="/", method="GET")
```

Accept status 200, 301, 302, or 404. If health times out, poll `/` for up to 12 rounds at 5-second intervals and inspect `get_app_server_logs` before diagnosing a failure. A response outside the allowed statuses, a crash, or exhausted polling is a failed start.

## Step 5: Report

Report the container ID, port 3000, the request form above, and `stop_app_server(containerId=<id>)` for cleanup. Leave a successfully started container running unless the caller is performing verification or explicitly asks for teardown.

## Known Fixes

- The tracked `.codepress/dev-server/Dockerfile.web` is a Live Dev Server image and does not contain application source or dependencies; use `Dockerfile.codepress` for standalone validation.
- The old CRA toolchain needs Node 18 and Yarn 1.22.22. Dependencies are installed during the image build.
- The server binds to `0.0.0.0`, with the browser disabled and polling enabled for containerized development.

## Repair on Failure

Read the full tool error and `get_app_server_logs` output before changing anything. Fix all identified issues together, rebuild with the previous container ID, and update the recipe checksums if the Dockerfile or `web/package.json` changes. Do not put secrets in the recipe or Dockerfile. If three prior repairs are recorded in `recipe.json`, stop and request a fresh bootstrap instead of looping.

## Cleanup

Do not stop a successful container when the user only asked to start the app. Stop failed containers and containers used solely for verification with `stop_app_server`.
