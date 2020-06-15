import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { Form, Button, Row, Col } from "react-bootstrap";
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

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      forgottUsername: false,
      forgottPassword: false,
      mailSend: false
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

  _sendMail = e => {
    e.preventDefault();
    const { forgottUsername } = this.state;
    const { api, token } = this.props;
    const email = e.target.email.value;
    Axios.post(
      api + "/user/" + (forgottUsername ? "forgottusername" : "forgottpassword"),
      qs.stringify({
        email: email
      }),
      {
        headers: { "x-access-token": token }
      }
    )
    .then(res => {
      this.setState({mailSend: true});
    })
    .catch(err => {
      console.log(err.response);
      if (err.response) this.setState({ mailSend: true, error: err.response.data.status.message });
      else this.setState({ mailSend: true, error: err });
    })
  }

  render() {
    const { error, forgottUsername, forgottPassword, mailSend } = this.state;
    if (mailSend) {
      return (
        <Form style={formStyle}>
          <Form.Group>
            {error ? 
              <Form.Text style={errorStyle}>
                {error}
              </Form.Text> :
              <Form.Text>
                {forgottUsername ? "Der Benutzername wurde an die hinterlegte E-Mail Adresse gesendet!" : 
                  "Ein neues Passwort wurde an die hinterlegte E-Mail Adresse gesendet!"}
              </Form.Text>
            }
          </Form.Group>
          <Button 
            variant="outline-success"
            onClick={() => {
              this.setState({
                forgottUsername: false,
                forgottPassword: false,
                mailSend: false,
                error: null
              })
            }}
          >
            zurück
          </Button>
        </Form>
      )
    }
    if (forgottUsername || forgottPassword) {
      return (
        <Form onSubmit={this._sendMail} style={formStyle}>
          <Form.Group>
            <Form.Label>E-Mail</Form.Label>
            <Form.Control
              type="text"
              name="email"
              placeholder="email"
              className="mr-sm-2"
              autoFocus
            />
          </Form.Group>
          <Row>
            <Col xs="auto">
              <Button variant="outline-success" type="submit">
                {forgottUsername ? "Benutzername senden" : "neues Passwort senden"}
              </Button>
            </Col>
            <Col xs="auto">
              <Button 
                variant="outline-danger"
                onClick={() => {
                  this.setState({
                    forgottUsername: false,
                    forgottPassword: false,
                    mailSend: false
                  })
                }}
              >
                zurück
              </Button>
            </Col>
          </Row>
        </Form>
      )
    }
    return (
      <Form onSubmit={this._login} style={formStyle}>
        <Form.Group>
          <Form.Label>Benutzername</Form.Label>
          <Form.Control
            type="text"
            name="username"
            placeholder="username"
            className="mr-sm-2"
            autoFocus
          />
          <Button 
            variant="link"
            tabIndex="-1"
            onClick={() => {this.setState({forgottUsername: true})}}
          >
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
          <Button 
            variant="link"
            tabIndex="-1"
            onClick={() => {this.setState({forgottPassword: true})}}
          >
            Passwort vergessen?
          </Button>
        </Form.Group>
        <Form.Text style={errorStyle}>
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
