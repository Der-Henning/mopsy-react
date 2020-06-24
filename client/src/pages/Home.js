import React, { Component } from "react";
import { Searchbar } from "../components";
import { useData } from "../context";

const Home = (props) => {
    return (
      <div 
        style={{
          display: "flex",
          justifyContent: 'center',
          paddingTop: "100px",
          margin: "10px"
        }}>
        <Searchbar
          autofocus={true}
        />
      </div>
    );
  
}

export default Home;