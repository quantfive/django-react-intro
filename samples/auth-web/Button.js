/***
 * The button component for auth
 * @patr
 */

import React from 'react';

// NPM Modules
import { StyleSheet, css } from 'aphrodite';

export default class Button extends React.Component {
  render() {
    return (
      <button className={css(styles.loginButton)} {...this.props}>
        <span className={css(styles.loginButtonText)}>{this.props.buttonText}</span>
      </button>
    )
  }
}

var styles = StyleSheet.create({
  loginButton: {
    border: 'none',
    'backgroundColor': '#ff0084',
    // width: '60px',
    // height: '30px',
    width: '100%',
    cursor: 'pointer',
    outline: 'none',
    padding: '15px 40px',
    borderRadius: '4px',
  },
  loginButtonText: {
    color: '#fff',
    fontFamily: 'Lato',
    fontWeight: 'bold',
    // textTransform: 'uppercase',
    letterSpacing: '1px',
    fontSize: '15px',
  }
});
