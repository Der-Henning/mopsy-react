import React, { useState, useCallback, useEffect } from "react";
import { withRouter } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import Axios from "axios";
import qs from "qs";
import { Spinner } from "react-bootstrap";
import { useGlobal } from "../context";

const formStyle = {
  width: "100%",
  maxWidth: "500px",
  margin: "0 auto",
  marginTop: "50px",
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
  const { api, token, loginId } = useGlobal();

  const [state, setState] = useState({
    isFetching: true,
    error: null,
    data: null,
    success: false,
  });

  useEffect(() => {
    if (!loginId) props.history.push("/");
    // eslint-disable-next-line
  }, [loginId]);

  const _fetchData = useCallback(() => {
    setState({ ...state, isFetching: true });
    Axios.get(api + "/user/" + loginId, {
      headers: { "x-access-token": token },
    })
      .then((res) => {
        setState({ ...state, data: res.data, isFetching: false, error: null });
      })
      .catch((err) => {
        setState({
          ...state,
          isFetching: false,
          error: err.response ? err.response.data : err,
        });
      });
  }, [api, token, loginId, state]);

  useEffect(() => {
    if (loginId) _fetchData();
    // eslint-disable-next-line
  }, [loginId]);

  const _update = useCallback(
    (e) => {
      e.preventDefault();
      const password = e.target.password.value;
      const repPassword = e.target.repPassword.value;
      const email = e.target.email.value;
      setState({ ...state, error: null, success: false });
      if (password !== repPassword)
        return setState({ ...state, error: "Passwords don't match!" });
      Axios.post(
        api + "/user/" + loginId + "/update",
        qs.stringify({
          password: password,
          email: email,
        }),
        { headers: { "x-access-token": token } }
      )
        .then(() => {
          setState({ ...state, success: true, error: null });
        })
        .catch((err) => {
          setState({
            ...state,
            error: err.response ? err.response.data?.status?.message : err,
          });
        });
    },
    [api, token, loginId, state]
  );

  const _onChange = useCallback(
    (e) => {
      setState({ ...state, data: { ...state.data, email: e.target.value } });
    },
    [state]
  );

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
