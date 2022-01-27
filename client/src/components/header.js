import React, { useEffect, useCallback, useRef } from "react";
import { Navbar, Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
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
          <Nav.Link to={"/account"} as={NavLink} href={"/account"} >
            Konto
          </Nav.Link>
          <Nav.Link onClick={() => _logout()} as={Nav.Link} href={"#"} >
            <LogOut />
          </Nav.Link>
        </React.Fragment>
      );
    return (
      <React.Fragment>
        <Nav.Link to={"/login"} as={NavLink} href={"/login"} >
          Login
        </Nav.Link>
        <Nav.Link to={"/register"} as={NavLink} href={"/register"} >
          Sign in
        </Nav.Link>
      </React.Fragment>
    );
  }, [user, _logout]);

  const _getNavbarContent = useCallback(() => {
    return (
      <React.Fragment>
        {user.loggedIn ? (
          <Nav.Link to={"/favorites"} as={NavLink} href={"/favorites"}>
            Favoriten
          </Nav.Link>
        ) : (
          ""
        )}
        {user.admin ? (
          <Nav.Link to={"/admin"} as={NavLink} href={"/admin"}>
            Admin
          </Nav.Link>
        ) : (
          ""
        )}
        <Nav.Link to={"/changes"} as={NavLink} href={"/changes"}>
          Änderungen
        </Nav.Link>
        <Nav.Link to={"/about"} as={NavLink} href={"/about"}>
          Über
        </Nav.Link>
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
        as="header"
        collapseOnSelect
      >
        <Navbar.Brand to={"/"} as={NavLink} href={"/"}>
          MOPS-Y{" "}
          <i>
            <small>Search</small>
          </i>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" children={<Menu />} />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto my-2 my-lg-0">
            {_getNavbarContent()}
          </Nav>
          <Nav className="d-flex">
            {_getLoginForm()}
            <Nav.Link onClick={() => toggleTheme()} as={Nav.Link} href={"#"} >
              {theme === "dark" ? <Sun /> : <Moon />}
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  return <React.Fragment></React.Fragment>;
};

export default Header;
