import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import Axios from "axios";
import Cookies from "universal-cookie";

const Context = React.createContext(undefined);

const GlobalProvider = ({ children, props }) => {
  const [user, _setUser] = useState({
    token: null,
    loginId: null,
  });
  const [theme, setTheme] = useState("light");
  const [dimensions, setDimensions] = useState({
    windowWidth: 0,
    windowHeight: 0,
    pdfHeight: 0,
    pdfWidth: 0,
    showPdfViewer: false,
  });
  const [headerHeight, setHeaderHeight] = useState(0);
  const { api } = props;

  const _updateDimensions = useCallback(() => {
    let windowWidth = typeof window !== "undefined" ? window.innerWidth : 0;
    let windowHeight = typeof window !== "undefined" ? window.innerHeight : 0;
    let pdfHeight = windowHeight - headerHeight;
    let pdfWidth = Math.ceil(pdfHeight / 1.4);
    let showPdfViewer = pdfWidth / windowWidth < 0.6 ? true : false;
    setDimensions({
      windowWidth,
      windowHeight,
      pdfHeight,
      pdfWidth,
      showPdfViewer,
    });
  }, [headerHeight]);

  useEffect(() => {
    window.addEventListener("resize", _updateDimensions);
    return () => window.removeEventListener("resize", _updateDimensions);
  }, [_updateDimensions]);

  useEffect(() => {
    const cookies = new Cookies();
    const cookieToken = cookies.get("token");
    var user = {
      token: null,
      loginId: null,
    };
    if (!cookieToken) {
      Axios.get(api + "/user/newtoken").then((res) => {
        user.token = res.headers["x-auth-token"];
      });
    } else {
      user.token = cookieToken;
      Axios.get(api + "/user/loginid", {
        headers: { "x-access-token": cookieToken },
      })
        .then((res) => {
          if (res?.data?.loginId) user.loginId = res.data.loginId;
        })
        .catch(() => {
          Axios.get(api + "/user/newtoken").then((res) => {
            user.token = res.headers["x-auth-token"];
          });
        })
        .finally(() => {
          _setUser(user);
        });
    }
    setTheme(cookies.get("theme") || "light");
  }, [api]);

  const toggleTheme = useCallback(() => {
    const cookies = new Cookies();
    var newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    cookies.set("theme", theme, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }, [theme]);

  const setUser = useCallback((token = null, loginId = null) => {
    const cookies = new Cookies();
    _setUser({ token, loginId });
    cookies.set("token", token, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }, []);

  useEffect(() => {
    _updateDimensions();
  }, [headerHeight, _updateDimensions]);

  const data = useMemo(
    () => ({
      api,
      token: user.token,
      loginId: user.loginId,
      setUser,
      theme,
      toggleTheme,
      dimensions,
      setHeaderHeight,
    }),
    [api, user, theme, toggleTheme, setUser, dimensions, setHeaderHeight]
  );

  return <Context.Provider value={data}>{children}</Context.Provider>;
};

const useGlobal = () => {
  return useContext(Context);
};

export { GlobalProvider, useGlobal };
