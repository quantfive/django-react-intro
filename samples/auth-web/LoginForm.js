/***
 * The login form. This is only the form element for login.
 * @patr + @craiglu
 */

import React from 'react';

// Components
import Input from '../components/Input';
import Button from './Button';

// NPM Modules
import { StyleSheet, css } from 'aphrodite';

export default class LoginForm extends React.Component {
  constructor(props) {
    super(props);

    this.INPUTS = [
      {id: 'email', placeholder: 'Email Address', ref: this.email},
      {id: 'password', placeholder: 'Password', ref: this.password},
    ]
  }

  /***
   * Submits the login form to the backend
   */
  submit = (e) => {
    e.preventDefault();
    var params = {};
    for (var i = 0; i < this.INPUTS.length; i++) {
      params[this.INPUTS[i].id] = this.INPUTS[i].ref.inputRef.value;
    }

    this.props.login(params)
    .then((user) => {
      if (user) {
        this.props.redirect();
      }
    });
  }

  render() {
    var inputs = this.INPUTS.map((input, index) => {
                 return <div className={css(styles.inputContainer)} key={`${input.id}_${index}`}>
                          <Input
                            name={input.id}
                            ref={(ref) => input.ref = ref}
                            type={input.id}
                            placeholder={input.placeholder}
                            required
                          />
                        </div>
                })
    return (
      <form className={css(styles.login)} onSubmit={this.submit}>
        {this.props.auth.errorMessage
          ?   <span className={css(styles.errorMessage)}>{this.props.auth.errorMessage}</span>
          :   null
        }
        { inputs }
        <Button buttonText={'Login'} />
      </form>
    );
  }
}

var styles = StyleSheet.create({
  login: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    // border: '1px solid #dce0e0',
    // padding: '15px',
    width: '100%',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    marginBottom: '15px',
  },
  inputLabel: {
    fontFamily: 'Roboto',
    fontSize: '16px',
    color: '#fff',
    marginBottom: '5px',
  },
  errorMessage: {
    fontSize: '14px',
    fontFamily: 'Roboto',
    color: '#ef3434',
    textAlign: 'center',
    marginBottom: '20px',
  }
});
