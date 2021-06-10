import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import Cookies from "universal-cookie";
import {useAPI} from "../hooks";

const Context = React.createContext(undefined);

const GlobalProvider = ({ children, props }) => {
  const { api } = props;

  const userAPI = useAPI(api)

  const [theme, setTheme] = useState("light");
  const [dimensions, setDimensions] = useState({
    windowWidth: 0,
    windowHeight: 0,
    pdfHeight: 0,
    pdfWidth: 0,
    showPdfViewer: false,
  });
  const [headerHeight, setHeaderHeight] = useState(0);
  const [displayFooter, setDisplayFooter] = useState(true);

  const _updateDimensions = useCallback(() => {
    const windowWidth = typeof window !== "undefined" ? window.innerWidth : 0;
    const windowHeight = typeof window !== "undefined" ? window.innerHeight : 0;
    const pdfHeight = windowHeight - headerHeight;
    const pdfWidth = Math.ceil(pdfHeight / 1.4) - 25;
    const showPdfViewer = pdfWidth / windowWidth < 0.6 ? true : false;
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
    setTheme(cookies.get("theme") || "light");
  }, []);

  const toggleTheme = useCallback(() => {
    const cookies = new Cookies();
    var newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    cookies.set("theme", newTheme, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }, [theme]);

  useEffect(() => {
    _updateDimensions();
  }, [_updateDimensions]);

  const data = useMemo(
    () => ({
      api,
      userAPI,
      theme,
      toggleTheme,
      dimensions,
      setHeaderHeight,
      displayFooter,
      setDisplayFooter
    }),
    [api, theme, toggleTheme, dimensions, setHeaderHeight, displayFooter, setDisplayFooter, userAPI]
  );

  return <Context.Provider value={data}>{children}</Context.Provider>;
};

const useGlobal = () => {
  return useContext(Context);
};

export { GlobalProvider, useGlobal };
