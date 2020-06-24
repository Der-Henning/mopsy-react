import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import Axios from "axios";
import qs from "qs";
import { Spinner } from "react-bootstrap";

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

const successStyle = {
  color: "green",
  fontWeight: "bold",
  marginBottom: "10px"
}

class Account extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isFetching: true,
      data: null,
      success: false
    };
    if (!this.props.loginId) this.props.history.push("/");
  }

  componentDidMount() {
    this._fetchData();
  }
  
  componentDidUpdate() {
    if (!this.props.loginId) this.props.history.push("/");
  }

  _fetchData = () => {
    const { token, api, loginId } = this.props;
    this.setState({
      isFetching: true,
      data: null
    });
    Axios.get(api + "/user/" + loginId, {
      headers: { "x-access-token": token }
    }).then(res => {
      this.setState({
        isFetching: false,
        data: res.data,
        error: null
      });
    }).catch(err => {
      if (err.response)
        this.setState({error: err.response.data, isFetching: false});
    });
  }
    
  _update = e => {
    e.preventDefault();
    const password = e.target.password.value;
    const repPassword = e.target.repPassword.value;
    const email = e.target.email.value;
    const { api, token, loginId } = this.props;
    this.setState({error: null, success: false});
    if (password !== repPassword) 
      return this.setState({error: "Passwords don't match!"});
    Axios.post(
      api + "/user/" + loginId + "/update",
      qs.stringify({
        password: password,
        email: email
      }),
      { headers: { "x-access-token": token } }
    )
    .then(res => {
      this.setState({success: true});
    })
    .catch(err => {
      if (err.response) this.setState({ error: err.response.data.status.message });
    });
  }

  _onChange = e => {
    var { data } = this.state;
    data.email = e.target.value;
    this.setState({data});
  }

  render() {
    const { error, data, isFetching, success } = this.state;
    if (isFetching) {
      return (
        <div style={{
          display: "flex", 
          height: "100%",
          justifyContent: "center",
          paddingTop: "50px"
        }}
        >
          <Spinner animation="border" variant="primary" />
        </div>
      )
    }
    return (
      <Form onSubmit={this._update} style={formStyle}>
        <Form.Group>
          <Form.Label>Benutzername</Form.Label>
          <Form.Text>{data.username}</Form.Text>
        </Form.Group>
        <Form.Group>
          <Form.Label>E-Mail ändern</Form.Label>
          <Form.Control
            type="text"
            name="email"
            value={data.email}
            placeholder="email"
            className="mr-sm-2"
            onChange={this._onChange}
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
        <Form.Text style={errorStyle}>
          {error ? error : ""}
        </Form.Text>
        <Form.Text style={successStyle}>
          {success ? "gespeichert" : ""}
        </Form.Text>
        <Button variant="outline-success" type="submit">
          Speichern
        </Button>
      </Form>
    );
  }
}

export default withRouter(Account);