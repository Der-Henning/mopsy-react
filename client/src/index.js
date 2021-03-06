import "core-js/stable";
import "react-app-polyfill/ie11";
import "url-search-params-polyfill";

import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-darkmode/dist/darktheme.css";
import "./styles/index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { GlobalProvider } from "./context";

ReactDOM.render(
  <BrowserRouter>
    <GlobalProvider props={{ api: "/api/v1" }}>
      <App />
    </GlobalProvider>
  </BrowserRouter>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
