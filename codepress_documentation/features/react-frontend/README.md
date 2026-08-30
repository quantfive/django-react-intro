---
feature: react-frontend
area: web
created: 2026-07-07
last_updated: 2026-07-07
---

# React Frontend (Create React App + Redux)

## Overview

The `web/` app is a Create React App (CRA) single-page app wired with Redux
for state management, react-router for client-side routing, and Aphrodite
for CSS-in-JS styling. It is the frontend half of the project, built and then
handed off to the [django-backend](../django-backend/README.md) to serve.

## Architecture

The entry point renders the root `App` component inside a Redux `Provider`
and a router-aware `ConnectedRouter`, sharing a single browser history
instance created during store configuration. `App` defines the route table
(currently just `/` -> `Home`) and wraps routes in a `ScrollToTop` helper
that resets scroll position on navigation.

The Redux store applies `redux-thunk` (for async action creators) and
`react-router-redux`'s router middleware, plus a development-only logger
middleware. The root reducer currently combines the router reducer with a
single example reducer (`redux/example.js`) that models a basic login
flag — a template for how feature reducers should be added, not a real auth
implementation.

The build pipeline is what connects this app to the backend: CRA's `build`
script produces a static bundle, and a `postbuild` npm script copies that
output into `../server/static/build/`, the exact directory Django's settings
point at for templates and static files. Running `yarn build` in `web/`
followed by Django's server is how the two halves become one deployable app.

## Key Files

- `web/src/index.js` - app bootstrap; wires the Redux `Provider` and `ConnectedRouter`.
- `web/src/config/configure-store.js` - Redux store, middleware, and history configuration.
- `web/src/redux/index.js` / `web/src/redux/example.js` - root reducer and an example login action/reducer.
- `web/src/containers/App/App.js` - route definitions.
- `web/src/containers/home/Home.js` - the landing page (CRA default template content).
- `web/src/containers/router/ScrollToTop.js` - resets scroll position on route change.
- `web/package.json` - `postbuild` script that copies the CRA build into `server/static/build/`.

## Keywords

React, Create React App, CRA, Redux, redux-thunk, redux-logger, react-router, react-router-redux, ConnectedRouter, Aphrodite, CSS-in-JS, SPA, frontend build, postbuild, static build output
