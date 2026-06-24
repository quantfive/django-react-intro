# Redux + Routing Setup

## Overview

The React frontend uses Redux for state management with `react-router-redux` to synchronize the current URL into the Redux store. The store is configured with middleware for async actions (thunk) and development logging. Client-side routing is handled by React Router v4.

## Key Files

| File | Role |
|------|------|
| `web/src/index.js` | App bootstrap: creates store, wraps app in Provider + ConnectedRouter |
| `web/src/config/configure-store.js` | Redux store factory with middleware and HMR support |
| `web/src/redux/index.js` | Root reducer combining all slices |
| `web/src/redux/example.js` | Template pattern for actions + reducers |
| `web/src/containers/App/App.js` | Top-level component with route definitions |
| `web/src/containers/router/ScrollToTop.js` | Utility: scrolls to top on route change |
| `web/src/containers/home/Home.js` | Example Redux-connected container component |

## Store Configuration (`configure-store.js`)

```javascript
import { createBrowserHistory } from 'history'
import { applyMiddleware, createStore } from 'redux'
import { routerMiddleware } from 'react-router-redux'
import thunk from 'redux-thunk'
import logger from 'redux-logger'  // dev only

export const history = createBrowserHistory()

export function configure(initialState = {}) {
  const middleware = [thunk, routerMiddleware(history)]
  if (process.env.NODE_ENV !== 'production') {
    middleware.push(logger)   // logs actions to console (collapsed, info level)
  }
  const store = createStore(rootReducer, initialState, applyMiddleware(...middleware))

  // HMR: replace the reducer without losing state
  if (module.hot) {
    module.hot.accept('../redux', () => store.replaceReducer(require('../redux').default))
  }

  return store
}
```

The `history` instance is exported and shared with both the store (via `routerMiddleware`) and the `<ConnectedRouter>` component so they stay in sync.

In development, `window.store = store` is set for debugging in the browser console.

## Root Reducer (`redux/index.js`)

```javascript
import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'

export default combineReducers({
  routing: routerReducer,   // URL is mirrored into state.routing
})
```

Only the routing slice is active. To add feature state, import your reducer and add it here.

## Adding a New Reducer — Pattern (`redux/example.js`)

`example.js` is a template. It is NOT wired into the root reducer — it exists as a reference:

```javascript
// Constants
export const AuthConstants = { LOGIN: 'LOGIN' }

// Action creator (thunk example)
export const ExampleActions = {
  login: () => (dispatch) => {
    dispatch({ type: AuthConstants.LOGIN, isLoggedIn: true })
  }
}

// Reducer
const defaultState = { isLoggedIn: false, account: { username: '' } }
export const AuthReducer = (state = defaultState, action) => {
  switch (action.type) {
    case AuthConstants.LOGIN:
      return { ...state, isLoggedIn: action.isLoggedIn }
    default:
      return state
  }
}
```

To activate it, import `AuthReducer` in `redux/index.js` and add `auth: AuthReducer` to `combineReducers`.

## Route Definitions (`App.js`)

```jsx
<Switch>
  <Route exact path='/' component={Home} />
</Switch>
```

Only one route exists. To add routes, import the new component and add `<Route>` entries inside `<Switch>`. The `<ScrollToTop>` wrapper ensures `window.scrollTo(0, 0)` fires on every navigation.

## Container Pattern (`Home.js`)

Connected components follow this pattern:

```javascript
import { connect } from 'react-redux'
import { ExampleActions } from '../../redux/example'

class Home extends Component { ... }

const mapStateToProps = (state) => ({ routing: state.routing })
const mapDispatchToProps = (dispatch) => ({
  exampleActions: bindActionCreators(ExampleActions, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(Home)
```

`state.routing` (from `react-router-redux`) is mapped to props in the Home container as an example, but no components currently read from it directly — it is there as a demonstration.

## Styling Approach

Components use **Aphrodite** (`aphrodite` package) for CSS-in-JS styling. Styles are defined as JS objects at the bottom of each file:

```javascript
import { StyleSheet, css } from 'aphrodite'

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
})

// In render:
<div className={css(styles.container)}>
```

Some components also import plain `.css` files alongside Aphrodite (e.g., `Home.css`). There is no Tailwind, CSS Modules, or other styling system.

## Technology Versions

| Package | Version | Note |
|---------|---------|------|
| `react` | 15.6.1 | Pre-hooks era |
| `react-router-dom` | 4.1.2 | |
| `react-router-redux` | next (v5 pre-release) | Syncs URL to Redux |
| `redux` | 3.7.2 | |
| `redux-thunk` | 2.2.0 | Async action middleware |
| `redux-logger` | 3.0.6 | Dev-only console logging |
| `aphrodite` | 1.2.3 | CSS-in-JS styling |
| `react-scripts` | 1.0.10 | Create React App build tooling |
