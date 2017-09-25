/***
 * The sign up form. This is only the form element for signup.
 * @patr + @craiglu
 */

import React from 'react';

// Components
import Input from '../components/Input';
import Button from './Button';

// NPM Modules
import { StyleSheet, css } from 'aphrodite';

export default class SignupForm extends React.Component {
  constructor(props) {
    super(props);

    this.INPUTS = [
      {id: 'email', placeholder: 'Email', minlength: '0', ref: this.email},
      {id: 'first_name', placeholder: 'First Name', minlength: '0', ref: this.firstName},
      {id: 'last_name', placeholder: 'Last Name', minlength: '0', ref: this.lastName},
      {id: 'password', placeholder: 'Create your password', minlength: '8', ref: this.password},
    ];

    this.state = {
      emailPressed: false,
    }
  }

  /***
   * Submit the signup form to the backend
   */
  submit = (e) => {
    e.preventDefault();
    var params = {}
    for (var i = 0; i < this.INPUTS.length; i++) {
      params[this.INPUTS[i].id] = this.INPUTS[i].ref.inputRef.value;
    }

    this.props.register(params)
    .then((user) => {
      if (user && user.isLoggedIn) {
        this.props.redirect();
      }
    });
  }

  render() {
    var inputs = this.INPUTS.map((input, index) => {
                   return <div className={css(styles.inputContainer)} key={`${input.id}_${index}`}>
                            <Input
                              ref={(ref) => input.ref = ref}
                              name={input.id}
                              type={input.id}
                              pattern={`.{${input.minlength},}`}
                              placeholder={input.placeholder}
                              required
                            />
                          </div>
                  })
    return (
      <div clasName={css(styles.signupContainer)}>
        {this.state.emailPressed
          ?   <form className={css(styles.signup)} onSubmit={this.submit}>
                {this.props.auth.errorMessage
                  ?   <span className={css(styles.errorMessage)}>{this.props.auth.errorMessage}</span>
                  :   null
                }
                { inputs }
                <Button buttonText={'Sign up'} />
              </form>
          :   <Button buttonText={'Sign up with email'} onClick={() => this.setState({emailPressed: true})} />
        }
      </div>
    );
  }
}

var styles = StyleSheet.create({
  signup: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',

    '@media only screen and (min-width: 320px)': {
      width: '100%',
    },

    '@media only screen and (min-width: 768px)': {
      width: '440px',
    }, 
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
