---
feature: django-backend
area: server
created: 2026-07-07
last_updated: 2026-07-07
---

# Django Backend (API + Frontend Host)

## Overview

The `server/` app is a Django project that serves two roles at once: a REST
API for authentication (via django-rest-framework, django-rest-auth, and
django-allauth) and the host process that serves the compiled React
frontend. In this starter, both the API and the single-page app are shipped
from one Django process rather than two separately deployed services.

## Architecture

Django's URL config routes `/admin/` to the built-in admin, `/api/auth/` and
`/api/auth/registration/` to `rest_auth`'s login/logout/password endpoints and
registration flow, and treats every other path as a catch-all that renders
`index.html` — the entry point of the built React app. This catch-all must stay
last in `urlpatterns` so that client-side routing (pushState) works correctly.

Django's template and static-files search paths are pointed at
`static/build`, the directory the frontend's production build gets copied
into (see [react-frontend](../react-frontend/README.md)). This is what lets a
single Django deployment serve both the API and the SPA's HTML/JS/CSS.

A local `user` Django app exists as a placeholder for custom user models,
views, and admin registrations, but currently holds no app-specific code
beyond the generated scaffolding. The default database is SQLite, configured
for local development rather than production use.

## Key Files

- `server/server/settings.py` - installed apps (DRF, rest_auth, allauth, local `user` app), template/staticfiles paths pointed at `static/build`, SQLite config.
- `server/server/urls.py` - URL routing: admin, rest_auth/rest_auth.registration endpoints, and the catch-all SPA index route.
- `server/server/views.py` - the `index` view that renders the React build's `index.html`.
- `server/user/` - local app reserved for custom user models/views (currently unimplemented scaffolding).
- `server/Pipfile` - Python dependencies (Django, djangorestframework, django-rest-auth, django-allauth).

## Keywords

Django, REST API, django-rest-framework, DRF, django-rest-auth, rest_auth, django-allauth, allauth, authentication endpoints, registration, SQLite, static files, catch-all route, SPA hosting, urls.py, settings.py
