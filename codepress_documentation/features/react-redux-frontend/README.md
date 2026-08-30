---
feature: react-redux-frontend
area: web
created: 2026-07-07
last_updated: 2026-07-07
---

# React + Redux Frontend

## Overview

A Create React App frontend wired up with Redux for state management and React Router for client-side navigation. It provides the baseline app shell (store, router, root component) that the Django backend ([django-spa-backend](../django-spa-backend/README.md)) serves as a compiled static bundle.

## Architecture

The app entry point creates a Redux store and wraps the root `App` component in both a Redux `Provider` and a `ConnectedRouter`, so routing state lives in the Redux store alongside application state. The store is configured with `redux-thunk` for async actions and `redux-router` middleware to keep the URL in sync with Redux; a `redux-logger` middleware is added in development for action/state debugging. Hot module reloading is wired in for both the root component and the root reducer.

`App.js` defines the top-level route table via `react-router-dom`'s `Switch`/`Route`, currently mapping only the root path to a `Home` container, and wraps routes in a `ScrollToTop` helper that resets scroll position on navigation. The Redux reducer tree currently only combines the router reducer — there are no application-specific reducers yet, making this a scaffold rather than a feature-complete app.

Production builds are produced by `react-scripts build` and then copied into the Django backend's static directory via an npm `postbuild` script (`cp -r build/ ../server/static/build/`), which is how the two halves of the project connect at deploy time.

## Key Files

- `web/src/index.js` - App entry point; creates the Redux store and mounts `App` inside `Provider`/`ConnectedRouter`
- `web/src/config/configure-store.js` - Redux store setup: middleware (thunk, router, logger) and hot-reload wiring
- `web/src/containers/App/App.js` - Root component defining the route table
- `web/src/containers/home/Home.js` - The only registered route/page currently in the app
- `web/src/containers/router/ScrollToTop.js` - Route-change scroll-reset wrapper
- `web/src/redux/index.js` - Root reducer (currently just the router reducer)
- `web/package.json` - Frontend dependencies and the `postbuild` script that copies the build into the Django backend

## Keywords

react, redux, create-react-app, cra, react-router, react-router-redux, redux-thunk, redux-logger, connected router, scroll to top, postbuild, frontend scaffold, spa
