/***
 * Entry point of the app that renders other containers with react router
 * @
 */

import React, { Component } from 'react';

// NPM Modules
import { Switch, Route } from 'react-router-dom';
import { withRouter } from 'react-router';

// Containers
import Home from '../home/Home';
import Analytics from '../analytics/Analytics';

// Router
import ScrollToTop from '../router/ScrollToTop';

class App extends Component {
  render() {
    return (
      <div className="App">
        <ScrollToTop>
          <Switch>
            <Route exact path='/' component={Home} />
            <Route exact path='/analytics' component={Analytics} />
          </Switch>
        </ScrollToTop>
      </div>
    );
  }
}

export default withRouter(App);
