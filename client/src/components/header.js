import React, { Component } from "react";
import { Navbar, Button, Nav, Form } from "react-bootstrap";
import { NavLink, Link } from "react-router-dom";
import { withRouter } from "react-router-dom";
import Axios from "axios";
import Cookies from "universal-cookie";
import { Menu, Sun, Moon, LogOut } from "react-feather";
import { Searchbar } from "../components";

class Header extends Component {
  componentDidMount() {
    let height = this.barElement.clientHeight;
    this.props.setHeaderHeight(height);
  }

  logout(e) {
    e.preventDefault();
    const cookies = new Cookies();
    const token = cookies.get("token");
    const { api } = this.props;
    Axios.get(api + "/user/logout", {
      headers: { "x-access-token": token }
    }).then(res => {
      this.props.setLoginId(null, res.headers["x-auth-token"]);
    });
  }

  _getLoginForm() {
    const { history, loginId } = this.props;
    if (loginId)
      return (
        <React.Fragment>
          <Button
            variant="link"
            style={{textDecoration: "none"}}
            onClick={() => {
              history.push("/account");
            }}
          >
            Konto
          </Button>
          <Button variant="link" onClick={this.logout.bind(this)}>
            <LogOut />
          </Button>
        </React.Fragment>
      );
    return (
      <React.Fragment>
        <Button
          variant="link"
          style={{textDecoration: "none"}}
          onClick={() => {
            history.push("/login");
          }}
        >
          Login
        </Button>
        <Button
          onClick={() => {
            history.push("/register");
          }}
          variant="outline-primary"
        >
          Sign in
        </Button>
      </React.Fragment>
    );
  }

  _getNavbarContent() {
    const { loginId, searchText } = this.props;
    if (false) {
      return (<Searchbar searchText={searchText} />)
    } else {
      return (
        <React.Fragment>
          {loginId ? (
            <NavLink to={"/favorites"} className="nav-link">
              Favoriten
            </NavLink>
          ) : (
            ""
          )}
          <NavLink to={"/about"} className="nav-link">
            Über
          </NavLink>
        </React.Fragment>
      )
    }
  }

  render() {
    const { visible, sticky, theme } = this.props;
    if (visible)
      return (
        <Navbar
          bg={theme}
          variant={theme}
          expand="md"
          sticky={sticky ? "top" : ""}
          ref={bar => {
            this.barElement = bar;
          }}
        >
          <Navbar.Brand as={Link} to={"/"}>
            MOPS-Y <i><small>Search</small></i>
          </Navbar.Brand>
          <Navbar.Toggle 
            aria-controls="basic-nav-bar-nav" 
            children={<Menu />}
          />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              {/* <NavLink to={"/"} className="nav-link">
                <Home />
              </NavLink> */}
              {this._getNavbarContent()}
            </Nav>
            <Nav>
              <Form inline>
                {this._getLoginForm()}
                <Button 
                  variant="link"
                  onClick={() => {
                    this.props.toggleTheme()
                  }}
                >
                  {theme === "dark" ? <Sun /> : <Moon />}
                </Button>
              </Form>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
      );
    return <React.Fragment></React.Fragment>;
  }
}

export default withRouter(Header);
