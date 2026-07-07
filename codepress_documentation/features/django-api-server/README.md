---
feature: django-api-server
area: server
created: 2026-07-07
last_updated: 2026-07-07
---

# Django API Server

## Overview

The `server/` directory is a Django 1.11 backend that provides authentication endpoints (via `django-rest-framework`, `django-rest-auth`, and `django-allauth`) and serves the compiled React frontend as its default catch-all route. It is the single deployable backend for this intro/starter project.

## Architecture

Django is configured as a thin API layer plus a static-file host. `rest_auth` and `allauth` are wired in to provide login, logout, password reset, and registration endpoints without hand-written views. A local `user` app exists as a placeholder for project-specific user model/view extensions but currently contains no custom logic.

Rather than running a separate static file server, Django templates and static files are pointed at the React app's production build output (`static/build`), and a catch-all URL pattern renders that build's `index.html` for any path not claimed by the API or admin routes. This lets client-side routing (react-router) take over in the browser after the initial page load.

## Key Files

- `server/server/settings.py` - Django settings; registers `rest_framework`, `rest_auth`, `allauth`, and the local `user` app; points templates/static files at `static/build`
- `server/server/urls.py` - Routes `/admin/`, `/api/auth/` (login/logout/password), `/api/auth/registration/` (signup), and a catch-all `^` route to the frontend index view
- `server/server/views.py` - `index` view that renders the React build's `index.html`
- `server/user/` - Placeholder Django app for user-related models/views/admin (scaffolded, not yet implemented)
- `server/Pipfile` - Backend dependencies (Django, django-rest-framework, django-rest-auth, django-allauth)
- `server/manage.py` - Standard Django management entrypoint

## Keywords

django, backend, api server, rest framework, drf, rest-auth, allauth, authentication, login, registration, wsgi, sqlite, static build, catch-all route, user app
