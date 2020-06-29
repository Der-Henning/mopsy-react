import React from "react";
import { Searchbar } from "../components";

const Home = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        paddingTop: "100px",
        margin: "10px",
      }}
    >
      <Searchbar autofocus={true} />
    </div>
  );
};

export default Home;
