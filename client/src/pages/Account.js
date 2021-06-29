import React, { useState, useCallback, useEffect } from "react";
import { withRouter } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import { Spinner } from "react-bootstrap";
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

const successStyle = {
  color: "green",
  fontWeight: "bold",
  marginBottom: "10px",
};

const Account = (props) => {
  const { userAPI } = useGlobal();
  const { user, getUserData, setUserData } = userAPI;

  const [state, setState] = useState({
    isFetching: true,
    error: null,
    data: null,
    success: false,
  });

  const _fetchData = useCallback(() => {
    setState((prevState) => ({ ...prevState, isFetching: true }));
    getUserData()
      .then(res => {
        setState(prevState => ({
          ...prevState,
          data: res.data,
          isFetching: false,
          error: null
        }))
      })
      .catch((err) => {
        setState((prevState) => ({
          ...prevState,
          isFetching: false,
          error: err.response ? err.response.data : err,
        }));
      });
  }, [getUserData]);

  useEffect(() => {
    if (!user.loggedIn) props.history.push("/");
    else _fetchData();
  }, [user, _fetchData, props.history]);

  const _update = useCallback(
    (e) => {
      e.preventDefault();
      const password = e.target.password.value;
      const repPassword = e.target.repPassword.value;
      const email = e.target.email.value;
      setState((prevState) => ({ ...prevState, error: null, success: false }));
      if (password !== repPassword)
        return setState((prevState) => ({
          ...prevState,
          error: "Passwords don't match!",
        }));
      setUserData({ password: password, email: email, })
        .then(() => {
          setState((prevState) => ({
            ...prevState,
            success: true,
            error: null,
          }));
        })
        .catch((err) => {
          setState((prevState) => ({
            ...prevState,
            error: err.response ? err.response.data?.status?.message : err,
          }));
        });
    },
    [setUserData]
  );

  const _onChange = useCallback((e) => {
    setState((prevState) => ({
      ...prevState,
      data: { ...prevState.data, email: e.target.value },
    }));
  }, []);

  if (state.isFetching) {
    return (
      <div
        style={{
          display: "flex",
          height: "100%",
          justifyContent: "center",
          paddingTop: "50px",
        }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }
  return (
    <Form onSubmit={_update} style={formStyle}>
      <Form.Group>
        <Form.Label>Benutzername</Form.Label>
        <Form.Text>{state.data.username}</Form.Text>
      </Form.Group>
      <Form.Group>
        <Form.Label>E-Mail ändern</Form.Label>
        <Form.Control
          type="text"
          name="email"
          value={state.data.email}
          placeholder="email"
          className="mr-sm-2"
          onChange={_onChange}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Passwort ändern</Form.Label>
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
      <Form.Text style={errorStyle}>{state.error ? state.error : ""}</Form.Text>
      <Form.Text style={successStyle}>
        {state.success ? "gespeichert" : ""}
      </Form.Text>
      <Button variant="outline-success" type="submit">
        Speichern
      </Button>
    </Form>
  );
};

export default withRouter(Account);
