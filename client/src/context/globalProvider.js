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
    admin: false,
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

  const setUser = useCallback((user) => {
    const cookies = new Cookies();
    _setUser(() => user);
    cookies.set("token", user.token, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }, []);

  useEffect(() => {
    const cookies = new Cookies();
    setTheme(cookies.get("theme") || "light");
  }, []);

  useEffect(() => {
    const cookies = new Cookies();
    const cookieToken = cookies.get("token");
    var user = {
      token: null,
      loginId: null,
      admin: false,
    };
    if (!cookieToken) {
      Axios.get(api + "/user/newtoken")
        .then((res) => {
          user.token = res.headers["x-auth-token"];
        })
        .finally(() => {
          setUser(user);
        });
    } else {
      user.token = cookieToken;
      Axios.get(api + "/user/loginid", {
        headers: { "x-access-token": cookieToken },
      })
        .then((res) => {
          // if (res?.data?.loginId) {
          user.loginId = res?.data?.loginId || null;
          user.admin = res?.data?.admin || false;
          // }
        })
        .catch(async () => {
          await Axios.get(api + "/user/newtoken").then((res) => {
            user.token = res.headers["x-auth-token"];
          });
        })
        .finally(() => {
          setUser(user);
        });
    }
  }, [api, setUser]);

  const toggleTheme = useCallback(() => {
    const cookies = new Cookies();
    var newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    cookies.set("theme", theme, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }, [theme]);

  useEffect(() => {
    _updateDimensions();
  }, [headerHeight, _updateDimensions]);

  const data = useMemo(
    () => ({
      api,
      token: user.token,
      loginId: user.loginId,
      admin: user.admin,
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
