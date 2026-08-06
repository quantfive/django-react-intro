---
name: start-app-server
description: "Start the django-react-intro web app in a Docker container and validate it responds. Uses a pre-validated recipe with no discovery or guessing. Triggers on: 'spin up the server', 'run my app', 'start the server', 'verify app server', 'test my server', 'run app server', 'spin up the app'."
user_invocable: true
codepress_generated: true
---

# Start App Server — django-react-intro

Fast-path skill for starting the public Create React App frontend in Docker.
The recipe was bootstrapped on 2026-08-06T20:07:26Z and lives at
`.codepress/start-app-server/recipe.json`.

## Tools

Use these tools directly:

- `build_and_start_app_server` — build the image and start the container
- `forward_app_request` — send an HTTP request into the container
- `get_app_server_logs` — inspect stdout and stderr
- `stop_app_server` — stop a container when cleanup is requested

## Static Context

- **Stack**: Create React App 1.0.10 with React 15, served by the legacy CRA development server
- **Dockerfile**: `Dockerfile.codepress`
- **Port**: 3000
- **Validation**: `GET /` → status in `[200, 301, 302, 404]`
- **Services**: none
- **Required secrets**: none
- **Container alias**: `web`

`server/` contains a separate Django 1.11 project, but this recipe deliberately
targets the frontend because it is the repository's existing runnable preview
surface. The existing `.codepress/dev-server/Dockerfile.web` is a Live Dev
Server hydration image and is not used by this standalone app-server recipe.

## Step 1: Drift Check

Compare the current inputs with the recipe before starting:

```bash
git hash-object Dockerfile.codepress   # expected prefix e5c74266935e1269
git hash-object web/package.json       # expected prefix 82f2e0338f40d5f8
```

If either checksum differs, continue with the build but report that the recipe
may need to be regenerated after the run.

## Step 2: Environment

This app needs no vault secrets. Use these safe runtime values; they are also
set in the Dockerfile:

```json
{
  "HOST": "0.0.0.0",
  "BROWSER": "none",
  "DANGEROUSLY_DISABLE_HOST_CHECK": "true"
}
```

## Step 3: Build and Start

```text
build_and_start_app_server(
  workspaceDir=<absolute path to the repository root>,
  port=3000,
  dockerfilePath="Dockerfile.codepress",
  envVars={
    "HOST": "0.0.0.0",
    "PORT": "3000",
    "BROWSER": "none",
    "DANGEROUSLY_DISABLE_HOST_CHECK": "true"
  },
  name="web"
)
```

The image installs Yarn 1.22.22 and all dependencies from `web/yarn.lock` at
build time. The foreground command invokes the installed CRA start script with
Node 18, which is required by the repository's legacy `websocket-driver`
dependency.

If retrying after a Dockerfile fix, pass `existingContainerId=<previous id>` so
the previous container is stopped during the successful rebuild.

## Step 4: Validate

If the build tool reports `health_check: "ready"`, send the validation request:

```text
forward_app_request(
  containerId=<container id>,
  path="/",
  method="GET"
)
```

Success is any response status in `[200, 301, 302, 404]`. If health is timed
out, poll the same request up to 12 times at five-second intervals. If it still
does not respond, inspect `get_app_server_logs` before deciding whether the
container needs a repair.

## Step 5: Report

Report the container ID, port 3000, the validation response, and these commands:

```text
forward_app_request(containerId=<container id>, path="/")
stop_app_server(containerId=<container id>)
```

When this skill is called only to start the server, leave a healthy container
running. A caller performing verification owns cleanup after its contract run.

## Known Fixes

- The pre-existing `.codepress/dev-server/Dockerfile.web` is intended for Live Dev Server hydration and has no source/dependency copy; use `Dockerfile.codepress` for standalone app-server runs.
- CRA 1.0.10 and `websocket-driver` require Node 18 because newer Node versions removed the `http_parser` binding.
- The official Node 18 image provides a Corepack Yarn shim, so the Dockerfile pins Yarn 1.22.22 with `corepack prepare`.

## Repair on Failure

If the build or start fails, inspect the full build error and container logs,
identify all root causes, and make one combined Dockerfile correction before
rebuilding. Keep the dependency install inside the image; never rely on host
`node_modules` or download packages from the container's startup command.

The recipe's `repair_count` has a ceiling of three. If it is already at least
three, stop repairing and ask for a fresh bootstrap. After a successful repair,
increment `repair_count`, set `origin` to `repair`, update `bootstrapped_at`,
recompute the two input checksums, and append the fix to `known_fixes`.

## Cleanup

Leave a successfully started container running unless the caller explicitly
asks for teardown or started it only for a verification run. Stop failed or
orphaned containers with `stop_app_server(containerId=<container id>)`.
