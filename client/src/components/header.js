import React, { useEffect, useCallback, useRef } from "react";
import { Navbar, Button, Nav, Form } from "react-bootstrap";
import { NavLink, Link } from "react-router-dom";
import { withRouter } from "react-router-dom";
import Axios from "axios";
import { Menu, Sun, Moon, LogOut } from "react-feather";
import { useGlobal } from "../context";

const Header = (props) => {
  const {
    api,
    token,
    loginId,
    admin,
    theme,
    setUser,
    setHeaderHeight,
    toggleTheme,
  } = useGlobal();
  const { visible, sticky } = props;
  const bar = useRef();

  useEffect(() => {
    const height = bar.current.clientHeight;
    setHeaderHeight(height);
  }, [setHeaderHeight]);

  const logout = useCallback(() => {
    Axios.get(api + "/user/logout", {
      headers: { "x-access-token": token },
    }).then((res) => {
      setUser({token: res.headers["x-auth-token"], loginId: null, admin: false});
    });
  }, [api, token, setUser]);

  const _getLoginForm = useCallback(() => {
    if (loginId)
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
          <Button variant="link" onClick={logout}>
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
  }, [loginId, logout, props.history]);

  const _getNavbarContent = useCallback(() => {
    return (
      <React.Fragment>
        {loginId ? (
          <NavLink to={"/favorites"} className="nav-link">
            Favoriten
          </NavLink>
        ) : (
          ""
        )}
        {admin ? (
          <NavLink to={"/admin"} className="nav-link">
            Admin
          </NavLink>
        ) : (
          ""
        )}
        <NavLink to={"/about"} className="nav-link">
          Über
        </NavLink>
      </React.Fragment>
    );
  }, [loginId, admin]);

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
