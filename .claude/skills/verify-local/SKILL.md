---
name: verify-local
description: Verify the Django backend and React frontend using this repository's typed local contract.
codepress_generated: true
---

# Verify local

Use this skill to prove the behavior of the `django-react-intro` checkout. The
typed contract in `.codepress/verify-local/recipe.json` is authoritative for
installation, services, fixtures, health probes, and one-shot checks. Do not
invent commands, ports, environment values, or alternate service runners.

## Repository contract

This repository has two local services:

- `backend` is the Django application in `server/`. Its SQLite database is
  local to the checkout. The setup phase builds the React bundle into
  `server/static/build/`, and the service runs
  `python3 -m pipenv run python manage.py runserver 0.0.0.0:8000` from
  `server/`. Its required health probe is `GET /` with status `200`.
- `frontend` is the Create React App in `web/`. It uses the committed Yarn 1
  lockfile and runs `yarn start` on port `3000`. Its browser-facing health
  probe is `GET /` with status `200`. The `BROWSER=none` and
  `DANGEROUSLY_DISABLE_HOST_CHECK=true` defaults keep a headless local run
  usable on a non-loopback preview host.

The backend fixture runs Django migrations against the repository's SQLite
database before its health probe. There are no external services, queues,
third-party integrations, production credentials, or repository-specific
secret bindings in this contract.

The required checks are manifest-owned and must all pass:

| Check | Evidence |
| --- | --- |
| `backend-check` | Django configuration check |
| `backend-tests` | The complete Django test command |
| `frontend-tests` | CRA/Jest tests with watch mode disabled and `CI=true` so the full suite runs |
| `frontend-build` | The production React build, including its existing postbuild copy into `server/static/build/` |

No lint or typecheck command is declared because the repository has no lint or
typecheck script and its application source is plain JavaScript. Do not add a
made-up lint or typecheck command to the verification report.

The frontend toolchain is the 2017 Create React App 1.0.10 stack. Use the
Node/Yarn combination admitted by the repository's existing dev-server recipe;
that recipe pins Node 18 and Yarn 1.22.22 because newer Node versions remove a
legacy dependency API used by this app. On a developer device, preflight the
runtime before installing dependencies and report an incompatible runtime as
blocked instead of silently upgrading the application toolchain.

## Start with the behavioral contract

Before probing, inventory the current diff and turn the changed files into
observable claims. At minimum, when the corresponding surface is present,
cover these claims:

1. The frontend root loads without a blank screen, displays the app's
   `Welcome to React` heading, and displays the React logo and introductory
   text.
2. The backend root serves the built frontend template after setup, and the
   backend service reaches its declared `/` health status.
3. The frontend development server reaches its declared `/` health status and
   has no uncaught browser/runtime error while the homepage renders.
4. The backend migration fixture and Django check/test commands complete with
   the expected exit code.
5. The frontend test and production-build commands complete with the expected
   exit code.

If the diff changes a route, authentication behavior, static asset, build
step, or database behavior, add a claim for that changed behavior and record
the real trigger and observed result. A static inspection can support a claim,
but it cannot replace a live health, HTTP, browser, or command observation.

## Developer-device execution

Run the recipe from the checkout root on a developer device:

1. Preflight Python 3, `pip`, Node 18, and Yarn 1. Do not read or print
   environment dumps. The first setup command installs Pipenv for the current
   Python user; the next one syncs the committed `server/Pipfile.lock`.
2. Execute every `setup_commands` entry exactly as an argv command. This
   installs the backend and frontend dependencies, creates the ignored static
   output directory required by the existing `web` postbuild script, and
   creates the frontend bundle before the backend service starts.
3. Start the required services in recipe order, using each service's declared
   working directory and port. Run the backend migration fixture before
   probing backend health. Keep process handles and terminate the service
   process groups and descendants after verification.
4. Wait only on the bounded health probes from the recipe. Verify both roots
   return `200`; for the browser-facing frontend, load the page in the
   supported local browser probe and confirm the heading is visible, the
   homepage is not blank, and the browser console has no uncaught errors.
5. Run all four manifest-owned checks. Preserve each check's exit code and a
   short, redacted observation. Do not replace a failed check with an ad hoc
   command or mark it successful from source inspection.
6. Inspect service output for startup failures, compile errors, tracebacks, or
   uncaught runtime errors, then clean up all descendants. A missing process
   inventory or missing cleanup proof is a verification failure, not a reason
   to leave a server running.

The build and migration create only ignored or disposable local runtime
outputs (`web/build`, `server/static/build`, and the SQLite database). Never
commit those outputs as part of verification.

## CodePress cloud-runner execution

The cloud runner is only the control plane. Run application processes inside
the backend-issued verification environment and never in the agent container.
Use the `verify_environment` lifecycle with the opaque `environment_id` and
`attempt` returned by the backend:

1. Create one environment and read its returned manifest projection. If the
   environment cannot be created, the admitted executor is unavailable, or a
   required service/check is not returned, report the verification as blocked.
2. Run the returned setup lifecycle. Do not submit repository paths, SHAs,
   commands, ports, manifests, checkout credentials, or arbitrary shell text.
3. Start each returned required service by its backend-issued service ID and
   wait on the returned health result. The backend owns the checkout, runtime,
   bind host, ports, and environment composition.
4. Select only the returned check IDs for `backend-check`, `backend-tests`,
   `frontend-tests`, and `frontend-build`. Never reconstruct or alter their
   argv in the cloud call. Use the runner's admitted browser probe for the
   frontend service when it is provided; otherwise report the UI assertion as
   unsupported rather than substituting a hand-started server.
5. Request bounded logs for failed or suspicious services/checks, keeping
   credentials and authorization material out of evidence. Stop the
   verification environment once all evidence is collected.

Reuse the healthy environment handle for independent checks. Do not fall back
to an alternate application lifecycle, and do not run a repository server in
the agent container. If the selected Verify VM does not implement a native
executor or cannot provide the required browser/backend surface, fail closed
and report the exact unsupported claim.

## Staging boundary and report

This repository currently has no staging-verification skill and discovery
found no effect that depends on deployed infrastructure, private services,
production-like cross-service wiring, or an external integration. Keep all
claims above on the local path. If a future diff introduces one of those
effects, route only that claim to the repository's `verify-staging` contract;
do not weaken the local backend or frontend claims and do not pretend a local
pass proves a deployed behavior. If staging is unavailable or declined,
identify the individual unsupported claim in the report.

Report one result for every behavioral claim and every manifest-owned check,
including the service health status and relevant log observation. The overall
result is `PASS` only when every required service is healthy, every declared
check has its expected exit code, and every applicable live claim is observed.
Use `FAIL` for an executed assertion that fails. Use `BLOCKED` when the
supported execution plane or required runtime is unavailable. Include the
environment artifact/reference only when the runner supplies one, and redact
secrets, tokens, cookies, authorization headers, and raw environment values.
