import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Row, Col } from "react-bootstrap";
import { useGlobal } from "../context";

const formStyle = {
  width: "100%",
  maxWidth: "500px",
  margin: "0 auto",
  marginTop: "50px",
  marginBottom: "50px"
};

const errorStyle = {
  color: "red",
  fontWeight: "bold",
  marginBottom: "10px",
};

const Login = (props) => {
  const { userAPI } = useGlobal();
  const { user, login, sendMail } = userAPI;
  const navigate = useNavigate();

  const [state, setState] = useState({
    error: null,
    forgottUsername: false,
    forgottPassword: false,
    mailSend: false,
  });

  useEffect(() => {
    if (user.loggedIn) navigate("/");
  }, [user, navigate]);

  const _login = useCallback(
    (e) => {
      e.preventDefault();
      const username = e.target.username.value;
      const password = e.target.password.value;
      login({
        username: username,
        password: password,
      })
        .catch((err) => {
          setState((prevState) => ({
            ...prevState,
            error: err.response ? err?.response?.data?.status?.message : err,
          }));
        });
    },
    [login]
  );

  const _sendMail = useCallback(
    (e) => {
      e.preventDefault();
      const email = e.target.email.value;
      sendMail(state.forgottUsername ? "forgottusername" : "forgottpassword", email)
        .then(() => {
          setState((prevState) => ({ ...prevState, mailSend: true }));
        })
        .catch((err) => {
          if (err.response)
            setState((prevState) => ({
              ...prevState,
              mailSend: true,
              error: err?.response?.data?.status?.message,
            }));
          else
            setState((prevState) => ({
              ...prevState,
              mailSend: true,
              error: err,
            }));
        });
    },
    [sendMail, state.forgottUsername]
  );

  if (state.mailSend) {
    return (
      <Form style={formStyle}>
        <Form.Group>
          {state.error ? (
            <Form.Text style={errorStyle}>{state.error}</Form.Text>
          ) : (
            <Form.Text>
              {state.forgottUsername
                ? "Der Benutzername wurde an die hinterlegte E-Mail Adresse gesendet!"
                : "Ein neues Passwort wurde an die hinterlegte E-Mail Adresse gesendet!"}
            </Form.Text>
          )}
        </Form.Group>
        <Button
          variant="outline-success"
          onClick={() => {
            setState({
              forgottPassword: false,
              forgottUsername: false,
              mailSend: false,
              error: null,
            });
          }}
        >
          zurück
        </Button>
      </Form>
    );
  }
  if (state.forgottUsername || state.forgottPassword) {
    return (
      <Form onSubmit={_sendMail} style={formStyle}>
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
              {state.forgottUsername
                ? "Benutzername senden"
                : "neues Passwort senden"}
            </Button>
          </Col>
          <Col xs="auto">
            <Button
              variant="outline-danger"
              onClick={() => {
                setState((prevState) => ({
                  ...prevState,
                  forgottUsername: false,
                  forgottPassword: false,
                  mailSend: false,
                }));
              }}
            >
              zurück
            </Button>
          </Col>
        </Row>
      </Form>
    );
  }
  return (
    <Form onSubmit={_login} style={formStyle}>
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
          onClick={() => {
            setState((prevState) => ({ ...prevState, forgottUsername: true }));
          }}
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
          onClick={() => {
            setState((prevState) => ({ ...prevState, forgottPassword: true }));
          }}
        >
          Passwort vergessen?
        </Button>
      </Form.Group>
      <Form.Text style={errorStyle}>{state.error ? state.error : ""}</Form.Text>
      <Button variant="outline-success" type="submit">
        Login
      </Button>
    </Form>
  );
};

export default Login;
