import React from "react";
import { Routes, Route } from "react-router-dom";
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
import { useGlobal } from "./context";

const App = (props) => {
  const { theme, displayFooter } = useGlobal();

  return (
    <div
      data-theme={theme === "light" ? "light" : "dark"}
      style={{
        overflowY: displayFooter ? "auto" : "",
        display: "flex",
        flexDirection: "column",
        height: `calc(100vh)`
      }}
    >
      <Header visible={true} />
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/changes" element={<Changes />} />
        <Route path="/search" element={<Search />} />
        <Route path="/viewer" element={<Viewer />} />
      </Routes>
      <Footer style={{ marginTop: "auto" }} visible={displayFooter} />
    </div>
  );
};

export default App;
