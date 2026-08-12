---
name: verify-local
description: "Verify quantfive/django-react-intro locally by running its Django backend and Create React App frontend, exercising the public page, and executing the repository-owned checks."
user_invocable: true
codepress_generated: true
---

# Verify Local

Use `.codepress/verify-local/recipe.json` as the immutable verification
contract. It declares the local Django backend, the React frontend, their
health probes, and the focused checks. Do not invent replacement commands or
silently omit a required service or check.

## 1. Inventory the diff and claims

Start from the repository root and inspect the complete diff:

```bash
git status --short
git diff --name-status
git diff --stat
```

Define observable claims from the changed files before choosing probes. For
this repository, the baseline claims are:

- The React application starts on port 3000 and `/` returns a non-blank page
  with the home-page content.
- The Django application starts on port 8000 and `/admin/login/` returns HTTP
  200 after the local SQLite migrations run.
- Backend tests, frontend tests, and the frontend production build complete
  with their declared exit codes.
- A frontend change is visible in a browser at `/`; a backend-only change is
  exercised through the Django process or its focused tests.

Add feature-specific claims for the current diff. A passing process health
check alone is not enough evidence for a UI or backend behavior change.

## 2. Read and validate the recipe

Before running anything, parse the recipe and confirm:

- `schema_version` is the integer `1`.
- `setup_commands` are direct argv arrays, not shell strings.
- `backend` and `web` are required native services with unique IDs, owner-local
  working directories, private ports, and bounded HTTP health checks.
- Every declared check is executed. The recipe currently requires
  `backend-tests`, `frontend-tests`, and `frontend-build`.
- No environment default or binding contains a secret, token, password, API
  key, private key, credential, platform-owned value, or production value.
- The recipe contains no peer repository topology, checkout credentials, SHA,
  container-image dependency, or staging secret.

The backend's recipe validator is authoritative for schema and composition
validation. If it reports an invalid recipe, fix the recipe rather than
working around it in this skill.

## 3. Choose the execution plane

### Developer device

Run repository commands directly. Do not require Docker just to make local
verification portable. From the repository root, run the recipe setup commands
in order:

```bash
yarn --cwd web install --frozen-lockfile
pipenv sync
mkdir -p server/static
```

The lockfile is an old Pipenv lock for Django 1.11 and the frontend is a
Create React App 1.0.10 project. Use a runtime compatible with those pinned
dependencies. If the required Yarn, Pipenv, Python, or dependency versions are
not available, report the environment as blocked instead of silently dropping
the affected service or check.

Start the required services in dependency order:

```bash
cd server
pipenv run python manage.py migrate --noinput
pipenv run python manage.py runserver 0.0.0.0:8000
```

```bash
cd web
BROWSER=none HOST=0.0.0.0 PORT=3000 yarn start
```

The frontend does not need an auth session or API mock for the current home
page. Start the backend even when the current page is static so backend
changes remain a first-class local verification path.

### CodePress cloud runner

Use the CodePress verification-environment lifecycle for every customer
application process. The runner is the control plane and must not host the
repository's backend or frontend itself.

- Use the backend-issued environment/run reference and the bounded check IDs
  returned from the immutable recipe manifest.
- Start the frontend through the repository's Live Dev Server capability using
  the committed `.codepress/dev-server/recipe.json` and working directory
  `web` when a browser surface is needed.
- Start the backend inside the admitted verification MicroVM with the native
  commands from the recipe. Do not use retired application-container tools or
  hand-start the backend in the agent container.
- Submit only returned check IDs; never submit arbitrary shell text, ports,
  manifests, repositories, SHAs, or checkout credentials.
- If the verification execution plane or an admitted executor is unavailable,
  report `BLOCKED`. Do not replace it with Docker proxy validation or a server
  started in the agent container.

## 4. Health and behavioral probes

After the services are ready, verify the declared probes:

```bash
curl --fail --silent --show-error http://127.0.0.1:8000/admin/login/ > /tmp/verify-local-backend.html
curl --fail --silent --show-error http://127.0.0.1:3000/ > /tmp/verify-local-frontend.html
```

Confirm the frontend response is not an empty shell. For the baseline app,
assert that the rendered page contains `Welcome to React` and the intro copy.
For a changed feature, assert its semantic heading, role, text, or other stable
visible selector and capture browser console errors and failed network requests.

For backend changes, exercise the changed URL or form through the local Django
process and verify the response status, body shape, and error behavior. For
frontend changes, use the browser against `http://127.0.0.1:3000/` and verify
the changed content after hydration, not just the HTML shell.

## 5. Execute every manifest-owned check

Run the checks exactly as declared in the recipe:

```bash
cd server
pipenv run python manage.py test
```

```bash
cd web
CI=true yarn test --watchAll=false
yarn build
```

The repository has no separate lint or typecheck script. The Create React App
build's compiler/lint pipeline is the available frontend static check, and the
Django test command is the available backend check. Do not claim lint or
typecheck evidence that the repository does not provide.

The build's `postbuild` script copies the generated frontend into
`server/static/build`; the recipe creates `server/static` before running it.
Treat a failed copy, test, build, or service health probe as a real failure and
fix or report the root cause.

## 6. Route claims that need staging

Keep local verification honest. Deployed infrastructure, production-like
cross-service wiring, unavailable private services, and external integrations
that cannot be reproduced locally belong in `verify-staging`.

This repository currently has no staging environment, so do not invent a
staging URL or mark deployment-only claims as locally verified. Report such a
claim as unsupported locally and point to the repository's staging verifier if
one is later added. This does not weaken claims that the local Django and React
processes can prove.

## 7. Evidence and cleanup

Record the exact commands, working directories, health observations, browser
assertions, console/network observations, and check exit codes in the
verification report. Include the environment/run reference for cloud runs.
Keep evidence free of cookies, tokens, environment dumps, private values, or
production data.

Stop local processes and remove temporary outputs after verification. Reuse
healthy runtime handles during retries, inspect logs when a probe fails, and
report unsupported or blocked paths explicitly rather than converting them to
passes.
