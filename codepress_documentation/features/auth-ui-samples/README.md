---
feature: auth-ui-samples
area: samples/auth-web
created: 2026-07-07
last_updated: 2026-07-07
---

# Auth UI Samples

## Overview

`samples/auth-web/` holds reference React components for an email/password
login-and-signup flow plus a "Continue with GitHub" OAuth entry point. They
are sample/boilerplate code meant to be adapted when wiring real
authentication UI against the [django-backend](../django-backend/README.md)'s
`rest_auth` endpoints — they are not imported by the live app (the current
route table in [react-frontend](../react-frontend/README.md) only renders
`Home`) and reference sibling modules (`redux/auth`, `components/Input`,
`containers/header/Header`, `config/settings`) that don't exist yet in this
repo.

## Architecture

`Auth.js` is the container: it toggles between `LoginForm` and `SignupForm`,
renders a `GithubButton` for OAuth, and, when mounted with an OAuth callback
query string, dispatches a `githubLogin` action and redirects home on
success. `LoginForm` and `SignupForm` are uncontrolled forms that read values
off input refs and call `login()`/`register()` props supplied by the
container, redirecting after a successful response. `Button` is the shared
styled submit button used by both forms, and `GithubButton` builds a GitHub
OAuth authorize URL from a configured client ID and a random state token.

All components style with Aphrodite (`StyleSheet.create`), the same pattern
used by the live `Home` component in the react-frontend feature.

## Key Files

- `samples/auth-web/Auth.js` - login/signup container and GitHub OAuth callback handling.
- `samples/auth-web/LoginForm.js` - email/password login form.
- `samples/auth-web/SignupForm.js` - signup form (email, name, password).
- `samples/auth-web/Button.js` - shared auth submit button.
- `samples/auth-web/components/GithubButton.js` - GitHub OAuth authorize link.

## Keywords

authentication UI, login form, signup form, GitHub OAuth, social login, rest_auth integration, reference components, boilerplate auth, sample code, Aphrodite styling
