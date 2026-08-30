---
feature: auth-web-samples
area: samples
created: 2026-07-07
last_updated: 2026-07-07
---

# Auth Web Samples

## Overview

`samples/auth-web/` is a standalone set of reference React components implementing a login/signup UI with GitHub OAuth, kept as copy-paste boilerplate for future projects rather than as part of the running application. It is not imported by, or wired into, the app in `web/`.

## Architecture

`Auth.js` is the container component that toggles between `LoginForm` and `SignupForm` based on a `login` prop, and handles the GitHub OAuth callback (parsing query-string params on mount and dispatching a login action). `Button.js` is a shared styled submit button used by both forms. `GithubButton.js` builds the GitHub OAuth authorize URL from a client ID and a random `state` value for CSRF protection.

These files import from paths that don't exist in this repo (e.g. `../../redux/auth`, `../header/Header`, `../../../config/settings`), confirming they are a design/code reference extracted from another project rather than active code — any reuse requires copying the files into `web/src` and creating the matching redux module, header component, and settings file.

## Key Files

- `samples/auth-web/Auth.js` - Container switching between login/signup, handles GitHub OAuth redirect callback
- `samples/auth-web/LoginForm.js` - Email/password login form
- `samples/auth-web/SignupForm.js` - Registration form
- `samples/auth-web/Button.js` - Shared styled button used by the forms
- `samples/auth-web/components/GithubButton.js` - Builds the GitHub OAuth authorize link

## Keywords

auth, authentication, login form, signup form, github oauth, social login, sample code, boilerplate, reference implementation, aphrodite styling
