import React, { useEffect, useCallback, useRef } from "react";
import { Navbar, Button, Nav, Form } from "react-bootstrap";
import { NavLink, Link } from "react-router-dom";
import { withRouter } from "react-router-dom";
import { Menu, Sun, Moon, LogOut } from "react-feather";
import { useGlobal } from "../context";

const Header = (props) => {
  const {
    theme,
    setHeaderHeight,
    toggleTheme,
    userAPI
  } = useGlobal();
  const { user, logout } = userAPI;
  const { visible, sticky } = props;
  const bar = useRef();

  useEffect(() => {
    const height = bar.current.clientHeight;
    setHeaderHeight(height);
  }, [setHeaderHeight]);

  const _logout = useCallback(() => {
    logout().catch(err => { })
  }, [logout])

  const _getLoginForm = useCallback(() => {
    if (user.loggedIn)
      return (
        <React.Fragment>
          <Button
            variant="link"
            style={{ textDecoration: "none" }}
            onClick={() => {
              props.history.push("/account");
            }}
          >
            Konto
          </Button>
          <Button variant="link" onClick={_logout}>
            <LogOut />
          </Button>
        </React.Fragment>
      );
    return (
      <React.Fragment>
        <Button
          variant="link"
          style={{ textDecoration: "none" }}
          onClick={() => {
            props.history.push("/login");
          }}
        >
          Login
        </Button>
        <Button
          onClick={() => {
            props.history.push("/register");
          }}
          variant="outline-primary"
        >
          Sign in
        </Button>
      </React.Fragment>
    );
  }, [user, _logout, props.history]);

  const _getNavbarContent = useCallback(() => {
    return (
      <React.Fragment>
        {user.loggedIn ? (
          <NavLink to={"/favorites"} className="nav-link">
            Favoriten
          </NavLink>
        ) : (
          ""
        )}
        {user.admin ? (
          <NavLink to={"/admin"} className="nav-link">
            Admin
          </NavLink>
        ) : (
          ""
        )}
        <NavLink to={"/changes"} className="nav-link">
          Änderungen
        </NavLink>
        <NavLink to={"/about"} className="nav-link">
          Über
        </NavLink>
      </React.Fragment>
    );
  }, [user]);

  if (visible)
    return (
      <Navbar
        bg={theme}
        variant={theme}
        expand="md"
        sticky={sticky ? "top" : ""}
        ref={bar}
      >
        <Navbar.Brand as={Link} to={"/"}>
          MOPS-Y{" "}
          <i>
            <small>Search</small>
          </i>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-nav-bar-nav" children={<Menu />} />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            {/* <NavLink to={"/"} className="nav-link">
                <Home />
              </NavLink> */}
            {_getNavbarContent()}
          </Nav>
          <Nav>
            <Form inline>
              {_getLoginForm()}
              <Button
                variant="link"
                onClick={() => {
                  toggleTheme();
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
};

export default withRouter(Header);
