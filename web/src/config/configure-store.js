/**
* create-react-app-intro
* Place where we create the store and combine it with the reducers (Redux stuff)
* author: @
*/

import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { routerMiddleware } from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';
import { createLogger } from 'redux-logger';
import rootReducer from '../redux'

export const history = createHistory()

const enhancers = []
const middleware = [
  thunk,
  routerMiddleware(history),
]

// Configure the logger middleware
const logger = createLogger({
  level: 'info',
  collapsed: true,
});

if (process.env.NODE_ENV === 'development') {
  // const devToolsExtension = window.devToolsExtension;

  // if (typeof devToolsExtension === 'function') {
  //   enhancers.push(devToolsExtension());
  // }
  middleware.push(logger);
} else {
}

const createStoreWithMiddleware = compose(
  applyMiddleware(...middleware)(createStore)
);

export function configure(initialState) {

  // Create the redux store and add middleware to it
  var configStore = createStoreWithMiddleware(
    rootReducer,
    initialState,
  )

  // Snippet to allow hot reload to work with reducers
  if(module.hot) {
    module.hot.accept(function _() {
      configStore.replaceReducer(rootReducer);
    });
  }

  return configStore;
};
