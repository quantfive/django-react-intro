---
feature: react-frontend
area: web
created: 2026-07-07
last_updated: 2026-07-07
---

# React Frontend

## Overview

The `web/` directory is a Create React App (react-scripts) single-page application that renders the client side of the project. It uses React Router for navigation, Redux for state management, and Aphrodite for CSS-in-JS styling. Its production build output is copied into the Django server's static directory so the two apps ship as one deployable unit.

## Architecture

The app boots in `web/src/index.js`, wrapping the root `App` component in a Redux `Provider` and a router-aware `ConnectedRouter` (from `react-router-redux`), with hot-module-reload support for both the component tree and the reducers. `App.js` defines the top-level route table and wraps routed content in a `ScrollToTop` helper that resets scroll position on navigation.

State is managed through a single Redux store assembled in `config/configure-store.js`, which applies `redux-thunk` for async actions and `redux-logger` in development. Reducers are combined in `redux/index.js`; the `redux/example.js` module demonstrates the actions/reducer pattern used for feature state (login flag tracking) and serves as a template for future domain reducers. `containers/home/Home.js` is the sole routed page, illustrating the connected-component pattern (`mapStateToProps`/`mapDispatchToProps`) and Aphrodite styling.

The `postbuild` npm script (`cp -r build/ ../server/static/build/`) is what physically joins this app to the Django backend described in [django-api-server](../django-api-server/README.md) — after `yarn build`, the compiled assets land where Django's `TEMPLATES`/`STATICFILES_DIRS` expect them.

## Key Files

- `web/src/index.js` - App entry point; sets up the Redux store, connected router, and hot reload
- `web/src/containers/App/App.js` - Top-level route table (`react-router-dom` `Switch`/`Route`)
- `web/src/containers/router/ScrollToTop.js` - Router-aware helper that scrolls to top on navigation
- `web/src/config/configure-store.js` - Redux store creation, middleware (thunk, router, logger)
- `web/src/redux/index.js` - Root reducer (`combineReducers`)
- `web/src/redux/example.js` - Example actions/reducer pair demonstrating the state pattern
- `web/src/containers/home/Home.js` - Home page container; example of a connected component with Aphrodite styles
- `web/package.json` - CRA scripts; `postbuild` copies the build output into `server/static/build/`

## Keywords

react, create-react-app, redux, react-router, react-router-redux, thunk, redux-logger, aphrodite, css-in-js, spa, frontend, home page, connected component, postbuild, hot reload
