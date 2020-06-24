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

const ContextProvider = ({ children, props }) => {
  const [token, setToken] = useState(null);
  const [loginId, setLoginId] = useState(null);
  const [api, setApi] = useState(props.api);

  useEffect(() => {
    const cookies = new Cookies();
    const cookieToken = cookies.get("token");
    if (!cookieToken) {
      Axios.get(api + "/user/newtoken").then((res) => {
        setToken(res.headers["x-auth-token"]);
      });
    } else {
      setToken(cookieToken);
      Axios.get(api + "/user/loginid", {
        headers: { "x-access-token": cookieToken },
      }).then((res) => {
        if (res.data.loginId) setLoginId(res.data.loginId);
      });
    }
  }, []);

  const data = useMemo(() => [api, token, loginId], [api, token, loginId]);

  return <Context.Provider value={data}>{children}</Context.Provider>;
};

const useData = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useUser can only be used inside UserProvider");
  }
  return context;
};

export { ContextProvider, useData };
