import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import Axios from "axios";
import Cookies from "universal-cookie";
import qs from "qs";
import styles from "../styles/login.module.css";

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null
    };
    if (this.props.loginId) this.props.history.push("/");
  }

  componentDidUpdate() {
    if (this.props.loginId) this.props.history.push("/");
  }

  error() {
    if (this.state.error)
      return <Form.Text className={styles.error}>{this.state.error}</Form.Text>;
  }

  login(e) {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    const cookies = new Cookies();
    const token = cookies.get("token");
    Axios.post(
      "/api/login",
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
        if (err.response) this.setState({ error: err.response.data });
      });
  }

  render() {
    return (
      <Form onSubmit={this.login.bind(this)} className={styles.wrapper}>
        <Form.Group>
          <Form.Label>Benutzername</Form.Label>
          <Form.Control
            type="text"
            name="username"
            placeholder="username"
            className="mr-sm-2"
            autoFocus
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Passwort</Form.Label>
          <Form.Control
            type="password"
            name="password"
            placeholder="password"
            className="mr-sm-2"
          />
        </Form.Group>
        <Form.Text className={styles.error}>
          {this.state.error ? this.state.error : ""}
        </Form.Text>
        <Button variant="outline-success" type="submit">
          Login
        </Button>
      </Form>
    );
  }
}

export default withRouter(Login);
