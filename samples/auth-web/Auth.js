/***
 * The auth super container. Handles displaying both login and signup.
 * @patr -- patrick@quantfive.org
 */

import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// NPM Modules
import { StyleSheet, css } from 'aphrodite';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import Spinner from 'react-spinkit';

// Components
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import GithubButton from './components/GithubButton';

// Actions
import { AuthActions } from '../../redux/auth';

// Settings
import { HEADER_HEIGHT } from '../header/Header';

class Auth extends React.Component {

  redirect = () => {
    this.props.history.push('/');
  }

  componentDidMount() {
    let { authActions } = this.props;
    if (this.props.oauth) {

      var params = queryString.parse(this.props.history.location.search);
      // TODO: dispatch the state of the queryString and check if it's messed up
      authActions.githubLogin(params)
      .then((result) => {
        if (result.isLoggedIn) {
          this.props.history.push('/');
        }
      })
    }
  }

  render() {
    let { auth, authActions } = this.props;
    return (
      <div className={css(styles.auth)}>
        <div className={css(styles.formContainer)}>
          <div className={css(styles.alignmentContainer)}>
            <div className={css(styles.socialLogins)}>
              <GithubButton />
            </div>
            <div className={css(styles.divider)}>
              <hr className={css(styles.hr)} />
              <span>or</span>
              <hr className={css(styles.hr)} />
            </div>
            {this.props.login
              ?   <LoginForm login={authActions.login} auth={auth} redirect={this.redirect} />
              :   <SignupForm register={authActions.register} auth={auth} redirect={this.redirect} />
            }
            <div className={css(styles.alreadyHaveAccount)}>
              <span className={css(styles.alreadyText)}>
                {this.props.login ? "Don't have an account? " : "Already have an account? "}
              </span>
              <Link className={css(styles.link)} to={!this.props.login ? "/login" : "/signup"}> {this.props.login ? "Signup" : "Log In"} </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

var styles = StyleSheet.create({
  auth: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0 15px',
    paddingTop: '30px',
    justifyContent: 'center',
    minHeight: `calc(100vh - ${HEADER_HEIGHT}px - 30px)`,
  },
  spinner: {
    marginLeft: '50px',
  },
  divider: {
    display: 'flex',
    padding: '10px',
    alignItems: 'center',
  },
  hr: {
    width: '40%',
    height: '1px',
    border: 'none',
    borderTop: '.5px solid #dce0e0',
  },
  footer: {
    fontSize: '12px',
    color: '#999999',
    marginTop: '14px',
  },
  alreadyHaveAccount: {
    marginTop: '14px',
  },
  alreadyText: {
    fontSize: '12px',
    opacity: '.7',
  },
  link: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#000',
    opacity: '.9',
  },
  header: {
    top: '20px',
    display: 'flex',
    width: '100%',
    boxSizing: 'border-box',
    paddingTop: '20px',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lunyrBrand: {
    display: 'flex',
    height: '100%',
    'alignItems': 'center',
    'justifyContent': 'center',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  lunyrText: {
    color: '#fff',
    fontFamily: 'Lato',
    paddingLeft: '5px',
    paddingBottom: '5px',
    fontSize: '24px',
    '@media only screen and (min-width: 768px)': {
      fontSize: '24px',
    },
  },
  loginButton: {
    border: 'none',
    'backgroundColor': 'rgba(29, 30, 34, .56)',
    width: '60px',
    height: '30px',
    cursor: 'pointer',
    outline: 'none',

    '@media only screen and (min-width: 768px)': {
      width: '117px',
      height: '48px',
    },
  },
  loginButtonText: {
    color: '#fff',
    fontFamily: 'Lato',
    fontWeight: '400',
    textTransform: 'uppercase',
    fontSize: '11px',

    '@media only screen and (min-width: 768px)': {
      fontSize: '13px',
    },
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignmentContainer: {
    border: '1px solid #dce0e0',
    padding: '25px',
    '@media only screen and (min-width: 320px)': {
      width: '100%',
    },

    '@media only screen and (min-width: 768px)': {
      width: '440px',
    },
  },
});

const mapStateToProps = state => ({
  auth: state.auth,
})

const mapDispatchToProps = (dispatch) => ({
  authActions: bindActionCreators(AuthActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Auth)
