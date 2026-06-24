# Authentication System

## Overview

Authentication is implemented entirely via third-party Django packages (`rest_auth` + `django-allauth`). The backend exposes standard token-based REST endpoints; the frontend (shown in `samples/auth-web/`) stores the token and includes it in API headers. No custom auth logic is written — the project wires up the packages and leaves the frontend integration as a sample to be adopted.

## Backend: REST API Endpoints

All endpoints are mounted under `/api/auth/` via `rest_auth`.

| URL | Method | Description |
|-----|--------|-------------|
| `/api/auth/login/` | POST | Authenticate with username/email + password; returns `{ key: "<token>" }` |
| `/api/auth/logout/` | POST | Invalidate the current token |
| `/api/auth/user/` | GET | Return current user details |
| `/api/auth/user/` | PUT/PATCH | Update current user details |
| `/api/auth/password/change/` | POST | Change password (requires current password) |
| `/api/auth/password/reset/` | POST | Request a password reset email |
| `/api/auth/password/reset/confirm/` | POST | Confirm reset with uid + token from email |
| `/api/auth/registration/` | POST | Register a new account (email + password) |
| `/api/auth/registration/verify-email/` | POST | Confirm email address with key from email |

## Django Configuration

```python
# settings.py
INSTALLED_APPS = [
    ...
    'rest_framework',
    'rest_framework.authtoken',   # Token storage
    'rest_auth',                  # REST endpoints
    'django.contrib.sites',       # Required by allauth
    'allauth',
    'allauth.account',
    'rest_auth.registration',     # Registration endpoint
    'user',                       # Stub local app (no custom logic)
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
    ),
}
```

> **Missing**: `SITE_ID = 1` must be added to `settings.py` — both `django.contrib.sites` and `allauth` require it.

## User Model

The project uses Django's built-in `User` model. The `user/` Django app (`server/user/`) is registered but contains no custom models or views — it is a scaffold for future extension.

## Sample Frontend: `samples/auth-web/`

These files are **not imported by the live app** — they are reference implementations. Copy them into `web/src/` and wire them to your Redux store to enable auth.

### `Auth.js` — Auth Container

The top-level auth page component. Connected to Redux (`state.auth`). Handles two modes via a `login` boolean prop:

- **Login mode** (`/login`): renders `<LoginForm>` + `<GithubButton>`
- **Signup mode** (`/signup`): renders `<SignupForm>` + `<GithubButton>`

On mount, checks for a `props.oauth` prop; if present, parses query string params and calls `authActions.githubLogin(params)` — this handles the GitHub OAuth callback redirect.

```jsx
// Route setup needed in App.js:
<Route path='/login' render={() => <Auth login={true} />} />
<Route path='/signup' render={() => <Auth login={false} />} />
<Route path='/oauth/github' render={() => <Auth oauth={true} />} />
```

### `LoginForm.js` — Login Form

Class component. Uses React refs to read email + password input values on submit. Calls `this.props.login({ email, password })`. Displays `this.props.auth.errorMessage` if login fails.

### `SignupForm.js` — Signup Form

Class component with progressive disclosure: shows a "Sign up with email" button first, then reveals the form on click. Fields: email, first_name, last_name, password (min 8 characters enforced via HTML `pattern`). Calls `this.props.register(params)`.

### `Button.js` — Reusable Button

Pure presentational component. Hot-pink full-width button styled with Aphrodite. Spreads all props onto `<button>` — pass `onClick`, `type`, etc. directly.

### `components/GithubButton.js` — GitHub OAuth Button

Renders an `<a>` that redirects the browser to GitHub's OAuth authorization URL:

```
https://github.com/login/oauth/authorize?client_id=<GITHUB_CLIENT_ID>&scope=repo user&state=<random_hex>
```

- `GITHUB_CLIENT_ID` is imported from `web/src/config/settings` (you must create this file).
- The `state` parameter is generated with `secure-random` + `Buffer` for CSRF protection.
- After GitHub redirects back, `Auth.js` reads the query params and calls `authActions.githubLogin()`.

## Token Usage Pattern

After a successful login, the backend returns `{ key: "<token>" }`. The frontend should:

1. Store the token (e.g., `localStorage.setItem('token', data.key)`).
2. Include it in subsequent API requests:
   ```
   Authorization: Token <token>
   ```
3. On logout, call `POST /api/auth/logout/` and remove the token from storage.

The example Redux action/reducer in `web/src/redux/example.js` shows the intended Redux shape (`state.auth.isLoggedIn`, `state.auth.account`).
