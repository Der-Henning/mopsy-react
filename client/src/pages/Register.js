import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Form, FormControl, Button } from 'react-bootstrap'; 
import Axios from 'axios';
import Cookies from 'universal-cookie';
import qs from 'qs'; 
import styles from '../styles/login.module.css';  

class Register extends Component {
    constructor(props) {
        super(props);
        this.state={
            error: null
        }
        if (this.props.loginId) this.props.history.push('/');
    }

    componentDidUpdate() {
        if (this.props.loginId) this.props.history.push('/');
    }

    register(e) {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        const repPassword = e.target.repPassword.value;
        const email = e.target.email.value;
        const cookies = new Cookies();
        const token = cookies.get('token');
        Axios.post('/api/register',
          qs.stringify({
            username: username,
            password: password,
            email: email
          }),{ headers: {'x-access-token': token}})
          .then(res => {
            if (res.data.loginId) {
              this.props.setLoginId(res.data.loginId, res.headers['x-auth-token']);
            }
          })
          .catch(err => {
            if (err.response) this.setState({error: err.response.data});
          })
      }

      error() {
        if (this.state.error) return(
            <div className={styles.error}>
                {this.state.error}
            </div>
        )
    }

    render() {
        return(
            <Form onSubmit={this.register.bind(this)} className={styles.wrapper}>
                <FormControl type="text" name="username" placeholder="username" className="mr-sm-2" autoFocus />
                <FormControl type="text" name="email" placeholder="email" className="mr-sm-2" />
                <FormControl type="password" name="password" placeholder="password" className="mr-sm-2" />
                <FormControl type="password" name="repPassword" placeholder="repeat password" className="mr-sm-2" />
                <Button variant="outline-success" type="submit">Register</Button>
                {this.error()}
            </Form>
        )
    }
}

export default withRouter(Register);