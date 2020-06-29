import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Header } from "./components";
import {
  Home,
  Search,
  Favorites,
  Login,
  Register,
  Viewer,
  About,
  Account,
} from "./pages";
import { useGlobal, SearchDataProvider } from "./context";

const App = (props) => {
  const { theme, dimensions } = useGlobal();

  // const [savedDoc, setSavedDoc] = useState(null);

  // const saveActiveDoc = (docId) => {
  //   setSavedDoc(docId);
  // };

  return (
    <div
      data-theme={theme === "light" ? "light" : "dark"}
      style={dimensions.showPdfViewer ? {} : { overflowY: "auto" }}
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
          <SearchDataProvider>
            <Route path="/search" component={Search} />
            <Route path="/viewer" component={Viewer} />
          </SearchDataProvider>
        </Switch>
      </Router>
    </div>
  );
};

export default App;
