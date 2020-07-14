import React, { Component } from "react";

export default class About extends Component {
  render() {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "700px",
            padding: "20px",
          }}
        >
          MOPS-Y <i>Search</i> 
          <br/>
          <br/>
          <a href="https://github.com/Der-Henning/mopsy-react">https://github.com/Der-Henning/mopsy-react</a>
        </div>
      </div>
    );
  }
}
