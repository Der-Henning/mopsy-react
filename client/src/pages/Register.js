import React, { useState, useEffect, useCallback } from "react";
import { withRouter } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
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

const Register = (props) => {
  const { userAPI } = useGlobal();
  const { user, register } = userAPI;

  const [error, setError] = useState(null);

  useEffect(() => {
    if (user.loggedIn) props.history.push("/");
  }, [user, props.history]);

  const _register = useCallback(
    (e) => {
      e.preventDefault();
      const username = e.target.username.value;
      const password = e.target.password.value;
      const repPassword = e.target.repPassword.value;
      const email = e.target.email.value;
      if (password !== repPassword) return setError("Passwords don't match!");
      register({
          username: username,
          password: password,
          email: email,
        })
        .catch((err) => {
          setError(err.response ? err.response.data?.status?.message : err);
        });
    },
    [register]
  );

  return (
    <Form onSubmit={_register} style={formStyle}>
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
      <Form.Text style={errorStyle}>{error ? error : ""}</Form.Text>
      <Button variant="outline-success" type="submit">
        Register
      </Button>
    </Form>
  );
};

export default withRouter(Register);
