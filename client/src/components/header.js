import React, { Component } from 'react';
import { Navbar, Button, Nav, Form } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import styles from '../styles/header.module.css';
import { withRouter } from 'react-router-dom';
import Axios from 'axios';
import Cookies from 'universal-cookie';
import qs from 'qs'; 

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loginId: props.loginId,
      visible: props.visible
    };
  }

  componentDidUpdate(prevProps) {
   // if (prevProps.loginId !== this.props.loginId) this.setState({loginId: this.props.loginId});
    if (prevProps !== this.props) this.setState(this.props);
  }

  logout(e) {
    e.preventDefault();
    const cookies = new Cookies();
    const token = cookies.get('token');
    Axios.post('/api/logout',
      qs.stringify({}),
      {
        headers: {'x-access-token': token}
      }).then(res => {
        this.props.setLoginId(null, res.headers['x-auth-token']);
      })
  }

  loginForm() {
    if (this.state.loginId) return(
      <Form inline onSubmit={this.logout.bind(this)}>
        <Button variant="outline-success" type="submit">Logout</Button>
      </Form>
    )
    return(
      <Form inline>
        <NavLink to={'/login'} className="nav-link">Login</NavLink>
        <Button onClick={() => {this.props.history.push('/register')}} variant="outline-primary">Sign in</Button>
      </Form>
    )
  }

  favorites() {
    if (this.state.loginId) return(
      <NavLink to={'/favorites'} className="nav-link">Favorites</NavLink>
    )
  }

  render() {
    if (this.state.visible) return(
      <Navbar bg="light" expand="md">
        <Navbar.Toggle aria-controls="basic-nav-bar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <NavLink to={'/'} className="nav-link"> Home </NavLink>
            {this.favorites()}
            <NavLink to={'/about'} className="nav-link">About</NavLink>
          </Nav>
          {this.loginForm()}
        </Navbar.Collapse>
      </Navbar>
    );
    return(<React.Fragment></React.Fragment>);
  }
}

export default withRouter(Header);