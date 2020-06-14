import React, { Component } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Axios from "axios";
import Cookies from "universal-cookie";
import { Header } from "./components";
import { Home, Search, Favorites, Login, Register, Viewer, About } from "./pages";

class App extends Component {
  constructor(props) {
    super(props);
    const cookies = new Cookies();
    this.state = {
      api: "/api/v1",
      token: cookies.get("token"),
      loginId: null,
      showHeader: true,
      stickyHeader: true,
      showPdfViewer: true,
      windowHeight: 0,
      windowWidth: 0,
      pdfHeight: 0,
      pdfWidth: 0,
      headerHeight: 0,
      theme: cookies.get("theme") || "light"
    };
  }

  componentDidMount() {
    this._updateDimensions();
    window.addEventListener("resize", this._updateDimensions);

    const cookies = new Cookies();
    const token = cookies.get("token");
    const { api } = this.state;
    if (!token) {
      Axios.get(api + "/user/newtoken").then(res => {
        this._setToken(res.headers["x-auth-token"]);
      });
    } else {
      Axios.get(api + "/user/loginid", {
        headers: { "x-access-token": token }
      }).then(res => {
        if (res.data.loginId) this.setState({ loginId: res.data.loginId });
      });
    }
  }

  toggleTheme = () => {
    const cookies = new Cookies();
    var theme = (this.state.theme === "light") ? "dark" : "light";
    this.setState({theme: theme})
    cookies.set("theme", theme, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
  }

  setHeaderHeight = (headerHeight) => {
    this.setState({ headerHeight }, () => {
      this._updateDimensions();
    });
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this._updateDimensions);
  }

  _updateDimensions = () => {
    let windowWidth = typeof window !== "undefined" ? window.innerWidth : 0;
    let windowHeight = typeof window !== "undefined" ? window.innerHeight : 0;
    let pdfHeight = windowHeight - this.state.headerHeight;
    let pdfWidth = Math.ceil(pdfHeight / 1.4);
    let showPdfViewer = pdfWidth / windowWidth < 0.6 ? true : false;
    this.setState({
      windowWidth,
      windowHeight,
      pdfHeight,
      pdfWidth,
      showPdfViewer
    });
  }

  _setToken = token => {
    const cookies = new Cookies();
    cookies.set("token", token, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
  }

  setLoginId = (loginId, token) => {
    this._setToken(token);
    this.setState({ loginId: loginId });
  }

  showHeader = show => {
    this.setState({ showHeader: show });
  }

  resizePDF = (deltaX) => {
    this.setState({pdfWidth: this.state.pdfWidth + deltaX});
  }

  render() {
    const { api, token, theme, showPdfViewer, loginId, showHeader, stickyHeader, pdfWidth, pdfHeight } = this.state;
    return (
      <div 
        data-theme={theme === 'light' ? "light" : "dark"}
        style={showPdfViewer ? {} : {overflowY: "auto"} }
      >
        <Router>
          <Header
            loginId={loginId}
            setLoginId={this.setLoginId}
            visible={showHeader}
            sticky={stickyHeader}
            setHeaderHeight={this.setHeaderHeight}
            api={api}
            theme={theme}
            toggleTheme={this.toggleTheme}
          />
          <Switch>
            <Route 
              exact path="/"
              render = { props => (
                <Home
                  token={token}
                  api={api}
                />
              )}
            />
            <Route
              path="/search"
              render={props => (
                <Search
                  api={api}
                  token={token}
                  showPdfViewer={showPdfViewer}
                  pdfWidth={pdfWidth}
                  pdfHeight={pdfHeight}
                  theme={theme}
                  resizePDF={this.resizePDF}
                />
              )}
            />
            <Route
              path="/favorites"
              render={props => (
                <Favorites 
                  loginId={loginId} 
                  api={api}
                  token={token}
                  contendHeight={pdfHeight}
                />
              )}
            />
            <Route 
              path="/viewer"
              render={props => (
                <Viewer 
                  pdfHeight={pdfHeight}
                />
              )}
            />
            <Route path="/about" component={About} />
            <Route
              path="/login"
              render={props => (
                <Login
                  api={api}
                  token={token}
                  setLoginId={this.setLoginId}
                  loginId={loginId}
                />
              )}
            />
            <Route
              path="/register"
              render={props => (
                <Register
                  api={api}
                  token={token}
                  setLoginId={this.setLoginId}
                  loginId={loginId}
                />
              )}
            />
          </Switch>
        </Router>
      </div>
    );
  }
}

export default App;
