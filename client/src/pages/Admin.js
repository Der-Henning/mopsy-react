import React, { useState, useCallback, useEffect } from "react";
import { withRouter } from "react-router-dom";
import { Form, Button, NavbarBrand } from "react-bootstrap";
import Axios from "axios";
import qs from "qs";
import { Spinner } from "react-bootstrap";
import { useGlobal } from "../context";

const Admin = (props) => {
  const { api, token, loginId, admin } = useGlobal();

  const [crawlers, setCrawlers] = useState([]);

  useEffect(() => {
    if (!admin) props.history.push("/");
  }, [admin, props.history]);

  const _fetchData = useCallback(() => {
    // setState((prevState) => ({ ...prevState, isFetching: true }));
    Axios.get(api + "/crawler", {
      headers: { "x-access-token": token },
    })
      .then((res) => {
        setCrawlers((prevState) => res.data);
      })
      .catch((err) => {
        console.log(err);
        // setState((prevState) => ({
        //   ...prevState,
        //   isFetching: false,
        //   error: err.response ? err.response.data : err,
        // }));
      });
  }, [api, token]);

  const refresh = useCallback(
    (i, f) => {
      if (crawlers[i].status == "running" || f) {
        _fetchData();
        console.log("refresh");
        setTimeout(refresh(i, false), 500);
      }
    },
    [crawlers]
  );

  const start = useCallback(
    (i) => {
      Axios.get(api + "/crawler/" + crawlers[i].name + "/start", {
        headers: { "x-access-token": token },
      })
        .then((res) => {
          console.log("started");
          refresh(i, true);
        })
        .catch((err) => {
          console.log(err);
        });
    },
    [api, token, crawlers]
  );

  useEffect(() => {
    if (admin) _fetchData();
  }, [admin, _fetchData]);

  if (crawlers) {
    return (
      <div>
        {crawlers.map((c, i) => (
          <div key={i}>
            <p>{c.name}</p>
            <p>{c.status}</p>
            <p>{c.progress}</p>
            <p>{c.message || ""}</p>
            <p>
              <Button onClick={() => start(i)}>start</Button>
            </p>
          </div>
        ))}
      </div>
    );
  } else {
    return <div></div>;
  }
};

export default withRouter(Admin);
