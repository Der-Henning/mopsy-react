import React, { Component } from "react";
import { Searchbar } from "../components";

export default class Home extends Component {
  render() {
    const { api, token } = this.props;
    return (
      <div 
        style={{
          display: "flex",
          justifyContent: 'center',
          paddingTop: "100px",
          margin: "10px"
        }}>
        <Searchbar 
          token={token}
          api={api}
          autofocus={true}
        />
      </div>
    );
  }
}
