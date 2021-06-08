import React from "react";
import { Searchbar, Footer } from "../components";
import { useGlobal } from "../context";

const Home = () => {
  const { headerHeight } = useGlobal();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: `calc(100vh - ${headerHeight}px)` }}>
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
      <Footer style={{ marginTop: "auto" }} />
    </div>
  );
};

export default Home;
