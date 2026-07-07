---
feature: auth-ui-samples
area: samples
created: 2026-07-07
last_updated: 2026-07-07
---

# Auth UI Samples

## Overview

A set of reference React components demonstrating how to build a login/signup UI with GitHub OAuth, kept under `samples/` as copy-from-here starting material rather than as part of the running app. They are not imported by [react-redux-frontend](../react-redux-frontend/README.md) and are not wired into the app's routes, store, or build.

## Architecture

The sample shows a typical container/presentational split: an `Auth` container toggles between a `LoginForm` and `SignupForm` based on a prop, renders a `GithubButton` for social login, and dispatches auth actions (login/register/GitHub OAuth) through Redux action creators. Styling uses `aphrodite` (CSS-in-JS), which is not a dependency used anywhere else in this repo's actual frontend.

Because this is reference code, it intentionally imports from modules that don't exist in this repo (e.g. a `redux/auth` actions module, a `header/Header` component, and a `config/settings` file for the GitHub OAuth client ID) — these are placeholders showing the shape of a complete implementation, not working imports. Anyone adopting this sample needs to supply those pieces and add the corresponding Redux auth reducer/actions and API calls against the backend's `/api/auth/` endpoints.

## Key Files

- `samples/auth-web/Auth.js` - Container that switches between login/signup and renders the social login option
- `samples/auth-web/LoginForm.js` - Login form UI
- `samples/auth-web/SignupForm.js` - Signup form UI
- `samples/auth-web/Button.js` - Shared button component used by the forms
- `samples/auth-web/components/GithubButton.js` - GitHub OAuth login button, builds the GitHub authorize URL from a client ID

## Keywords

auth samples, login form, signup form, github oauth, social login, aphrodite, reference code, boilerplate, unused sample, auth ui
