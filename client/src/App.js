import React, { Component } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Axios from "axios";
import Cookies from "universal-cookie";
import styles from "./styles/App.module.css";
import qs from "qs";
import { Header } from "./components";
import { Home, Search, Favorites, Login, Register } from "./pages";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loginId: null,
      showHeader: true,
      stickyHeader: true,
      showPdfViewer: true,
      windowHeight: 0,
      windowWidth: 0,
      pdfHeight: 0,
      pdfWidth: 0,
      headerHeight: 0
    };
    this.setLoginId = this.setLoginId.bind(this);
    this.showHeader = this.showHeader.bind(this);
    this.updateDimensions = this.updateDimensions.bind(this);
    this.setHeaderHeight = this.setHeaderHeight.bind(this);
  }

  componentDidMount() {
    this.updateDimensions();
    window.addEventListener("resize", this.updateDimensions);

    const cookies = new Cookies();
    const token = cookies.get("token");
    if (!token) {
      Axios.post("/api/newtoken").then(res => {
        this.setCookie(res.headers["x-auth-token"]);
      });
    } else {
      Axios.post("/api/getlogin", qs.stringify({}), {
        headers: { "x-access-token": token }
      }).then(res => {
        if (res.data.loginId) this.setState({ loginId: res.data.loginId });
      });
    }
  }

  setHeaderHeight(headerHeight) {
    this.setState({ headerHeight }, () => {
      this.updateDimensions();
    });
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }

  updateDimensions() {
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

  setCookie(token) {
    const cookies = new Cookies();
    cookies.set("token", token, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
  }

  setLoginId(loginId, token) {
    this.setCookie(token);
    this.setState({ loginId: loginId });
  }

  showHeader(show) {
    this.setState({ showHeader: show });
  }

  resizePDF = (deltaX) => {
    this.setState({pdfWidth: this.state.pdfWidth + deltaX});
  }

  render() {
    return (
      <div className={styles.App}>
        <Router>
          <Header
            loginId={this.state.loginId}
            setLoginId={this.setLoginId}
            visible={this.state.showHeader}
            sticky={this.state.stickyHeader}
            setHeaderHeight={this.setHeaderHeight}
          />
          <Switch>
            <Route exact path="/" component={Home} />
            <Route
              path="/search"
              render={props => (
                <Search
                  showPdfViewer={this.state.showPdfViewer}
                  pdfWidth={this.state.pdfWidth}
                  pdfHeight={this.state.pdfHeight}
                  resizePDF={this.resizePDF}
                />
              )}
            />
            <Route
              path="/favorites"
              render={props => <Favorites loginId={this.state.loginId} />}
            />
            <Route path="/about" component={Home} />
            <Route
              path="/login"
              render={props => (
                <Login
                  setLoginId={this.setLoginId}
                  loginId={this.state.loginId}
                />
              )}
            />
            <Route
              path="/register"
              render={props => (
                <Register
                  setLoginId={this.setLoginId}
                  loginId={this.state.loginId}
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
