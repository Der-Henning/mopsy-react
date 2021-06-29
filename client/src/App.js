import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Header, Footer } from "./components";
import {
  Home,
  Search,
  Favorites,
  Login,
  Register,
  Viewer,
  About,
  Account,
  Admin,
  Changes
} from "./pages";
import { useGlobal, SearchDataProvider } from "./context";

const App = (props) => {
  const { theme, displayFooter } = useGlobal();

  return (
    <div
      data-theme={theme === "light" ? "light" : "dark"}
      style={{
        overflowY: displayFooter ? "auto" : "" ,
        display: "flex",
        flexDirection: "column",
        height: `calc(100vh)`
      }}
    >
      <Router>
        <Header visible={true} />
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/about" component={About} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/account" component={Account} />
          <Route path="/admin" component={Admin} />
          <Route path="/changes" component={Changes} />
          <SearchDataProvider>
            <Route path="/search" component={Search} />
            <Route path="/viewer" component={Viewer} />
          </SearchDataProvider>
        </Switch>
      </Router>
      <Footer style={{ marginTop: "auto" }} visible={displayFooter} />
    </div>
  );
};

export default App;
