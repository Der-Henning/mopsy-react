import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import Axios from "axios";
import qs from "qs";

const formStyle = {
  width: "100%",
  maxWidth: "500px",
  margin: "0 auto",
  marginTop: "50px"
}

const errorStyle = {
  color: "red",
  fontWeight: "bold",
  marginBottom: "10px"
}

class Register extends Component {
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

  register = e => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    const repPassword = e.target.repPassword.value;
    const email = e.target.email.value;
    const { api, token } = this.props;
    if (password !== repPassword) 
      return this.setState({error: "Passwords don't match!"});
    Axios.post(
      api + "/user/register",
      qs.stringify({
        username: username,
        password: password,
        email: email
      }),
      { headers: { "x-access-token": token } }
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
      <Form onSubmit={this.register} style={formStyle}>
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
          <Form.Label>E-Mail</Form.Label>
          <Form.Control
            type="text"
            name="email"
            placeholder="email"
            className="mr-sm-2"
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
        <Form.Group>
          <Form.Label>Passwort wiederholen</Form.Label>
          <Form.Control
            type="password"
            name="repPassword"
            placeholder="repeat password"
            className="mr-sm-2"
          />
        </Form.Group>
        <Form.Text style={errorStyle}>
          {error ? error : ""}
        </Form.Text>
        <Button variant="outline-success" type="submit">
          Register
        </Button>
      </Form>
    );
  }
}

export default withRouter(Register);
