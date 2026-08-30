---
feature: django-spa-backend
area: server
created: 2026-07-07
last_updated: 2026-07-07
---

# Django SPA Backend

## Overview

A Django backend that acts as both an API server and a static host for the React frontend. It ships with token-based authentication and social-login scaffolding already wired in, but no custom endpoints beyond that yet. It exists as the starting point for a Django + React project rather than a finished application.

## Architecture

Django's URL routing is split into three concerns: the Django admin, a set of authentication endpoints under `/api/auth/`, and a catch-all route that serves the compiled React app for every other path. This catch-all pattern is what lets client-side routing (`react-router`) work correctly on page refresh/deep links — any URL Django doesn't recognize falls through to `index.html` and the SPA's router takes over from there.

Authentication is not hand-rolled: `django-rest-framework`, `django-rest-auth`, and `django-allauth` are installed and registered in `INSTALLED_APPS`, providing login/logout/registration/password-reset endpoints out of the box. A local `user` app exists as the designated place for custom user model/view extensions, but currently contains only Django's default scaffolding (no custom fields or views yet).

The project uses SQLite for local development, and templates are configured to load from `static/build` — the directory the frontend's build step writes into (see [react-redux-frontend](../react-redux-frontend/README.md)).

## Key Files

- `server/server/settings.py` - Django settings; registers DRF/rest-auth/allauth apps, points templates and static files at `static/build`
- `server/server/urls.py` - Top-level routing: admin, `/api/auth/` (rest_auth + registration), and the SPA catch-all
- `server/server/views.py` - `index` view that renders the React build's `index.html` for the catch-all route
- `server/user/` - Placeholder Django app for user-related models/views (currently default scaffolding)
- `server/Pipfile` - Backend dependencies (Django, DRF, django-rest-auth, django-allauth)

## Keywords

django, backend, api, server, spa hosting, catch-all route, index view, django-rest-framework, drf, django-rest-auth, django-allauth, authentication, token auth, sqlite, static build, user app
