# SPA + Django Integration

## Overview

The project serves the React SPA and its REST API from a single Django origin. The React app is built with Create React App, copied into Django's static files directory, and served via a catch-all URL pattern that lets React Router handle client-side navigation.

## Key Files

| File | Role |
|------|------|
| `web/package.json` | Defines the `postbuild` script that copies the React build into Django |
| `server/server/settings.py` | Configures Django's template and static file paths to the React build |
| `server/server/urls.py` | Registers the catch-all URL that serves `index.html` for all non-API routes |
| `server/server/views.py` | The single `index` view that renders `index.html` |

## Build Pipeline

1. Run `yarn build` (or `npm run build`) inside `web/`.
2. Create React App produces `web/build/` with `index.html` and hashed `static/` bundles.
3. The `postbuild` script in `web/package.json` runs automatically:
   ```json
   "postbuild": "cp -r build/ ../server/static/build/"
   ```
4. Django is configured to look for templates and static files in `server/static/build/`:
   ```python
   # settings.py
   TEMPLATES DIRS = [os.path.join(BASE_DIR, 'static/build')]
   STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static/build/static')]
   STATIC_URL = '/static/'
   ```

## URL Routing

`server/server/urls.py` defines routes in this order:

```
/admin/                       → Django admin
/api/auth/                    → rest_auth (login, logout, user, password)
/api/auth/registration/       → rest_auth registration
/^                            → server.views.index  (catch-all — MUST be last)
```

The catch-all `url(r'^', index_views.index)` matches every URL that was not claimed by an earlier pattern. Django renders `index.html` (the React shell), and React Router then handles the route client-side.

## Request Flow in Production

```
Browser GET /dashboard
  → Django: no /api/* match → catch-all → render index.html
  → Browser loads React JS bundles from /static/...
  → React Router matches /dashboard → renders Dashboard component

Browser POST /api/auth/login/
  → Django: matches /api/auth/ → rest_auth LoginView → returns token JSON
```

## Development Considerations

- In development, run `web/` on port 3000 (CRA dev server) and `server/` on port 8000 separately.
- No CRA proxy is configured in `web/package.json`, so API calls from the dev server will hit CORS errors. Either add `"proxy": "http://localhost:8000"` to `package.json` or install `django-cors-headers` for cross-origin dev access.
- The `web/build/` directory is `.gitignore`d in `web/`; it is a transient artifact — always regenerated from source.

## Known Issues

- No CORS middleware is installed. The project assumes single-origin serving and will not work with a separate frontend host without adding `django-cors-headers`.
- `SITE_ID = 1` is missing from `settings.py` even though `django.contrib.sites` and `allauth` are installed — this will raise `ImproperlyConfigured` when any allauth endpoint is used.
- `SECRET_KEY` is hardcoded in `settings.py` and must be replaced with an environment variable before any non-demo deployment.
