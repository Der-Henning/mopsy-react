import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import Axios from "axios";
import qs from "qs";
import styles from "../styles/login.module.css";

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null
    };
    if (props.loginId) this.props.history.push("/");
  }

  componentDidUpdate() {
    if (this.props.loginId) this.props.history.push("/");
  }

  _login = e => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    const { api, token } = this.props;
    Axios.post(
      api + "/user/login",
      qs.stringify({
        username: username,
        password: password
      }),
      {
        headers: { "x-access-token": token }
      }
    )
      .then(res => {
        if (res.data.loginId) {
          this.props.setLoginId(res.data.loginId, res.headers["x-auth-token"]);
        }
      })
      .catch(err => {
        if (err.response) this.setState({ error: err.response.data.status.message });
      });
  }

  render() {
    const { error } = this.state;
    return (
      <Form onSubmit={this._login} className={styles.wrapper}>
        <Form.Group>
          <Form.Label>Benutzername</Form.Label>
          <Form.Control
            type="text"
            name="username"
            placeholder="username"
            className="mr-sm-2"
            autoFocus
          />
          <Button variant="link" tabindex="-1">
            Benutzername vergessen?
          </Button>
        </Form.Group>
        <Form.Group>
          <Form.Label>Passwort</Form.Label>
          <Form.Control
            type="password"
            name="password"
            placeholder="password"
            className="mr-sm-2"
          />
          <Button variant="link" tabindex="-1">
            Passwort vergessen?
          </Button>
        </Form.Group>
        <Form.Text className={styles.error}>
          {error ? error : ""}
        </Form.Text>
        <Button variant="outline-success" type="submit">
          Login
        </Button>
      </Form>
    );
  }
}

export default withRouter(Login);
