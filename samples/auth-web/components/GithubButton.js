/***
 * The button component for github login
 * @patr
 */

import React from 'react';
import secureRandom from 'secure-random';

// NPM Modules
import { StyleSheet, css } from 'aphrodite';

// Settings
import { GITHUB_CLIENT_ID } from '../../../config/settings';

export default class GithubButton extends React.Component {
  render() {
    return (
      <a href={`http://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo user&state=${new Buffer(secureRandom(10)).toString('hex')}`} className={css(styles.githubButton)}>
        <i className={css(styles.githubIcon) + " fa-2x fa fa-github"} aria-hidden="true"></i>
        <span className={css(styles.githubText)}>Continue with Github</span>
      </a>
    );
  }
}

var styles = StyleSheet.create({
  githubButton: {
    border: '1px solid #000',
    color: '#3a414d',
    background: '#fff',
    borderRadius: '4px',
    outline: 'none',
    cursor: 'pointer',
    padding: '20px',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    textDecoration: 'none',
  },
  githubIcon: {
    position: 'absolute',
    left: '30px',
  },
  githubText: {
    letterSpacing: '.5px',
    paddingLeft: '20px',
  },
})