import React, { useState, useCallback, useEffect } from "react";
import { withRouter } from "react-router-dom";
import { Button } from "react-bootstrap";
import Axios from "axios";
import { Spinner } from "react-bootstrap";
import { useGlobal } from "../context";

const styles = {
  border: "solid 1px grey",
  borderRadius: "10px",
  margin: "20px",
  padding: "10px",
};

const Admin = (props) => {
  const { api, token, admin } = useGlobal();

  const [crawlers, setCrawlers] = useState([]);
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    if (!admin) props.history.push("/");
  }, [admin, props.history]);

  const _fetchData = useCallback(() => {
    // setState((prevState) => ({ ...prevState, loading: true }));
    Axios.get(api + "/crawler", {
      headers: { "x-access-token": token },
    })
      .then((res) => {
        setCrawlers(() => res.data);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setState((prevState) => ({ ...prevState, loading: false }));
      });
  }, [api, token]);

  const start = useCallback(
    (i) => {
      Axios.get(`${api}/crawler/${crawlers[i].name}/start`, {
        headers: { "x-access-token": token },
      })
        .then((res) => {
          console.log(`started ${crawlers[i].name}`);
        })
        .catch((err) => {
          console.log(err);
        });
    },
    [api, token, crawlers]
  );

  const stop = useCallback(
    (i) => {
      Axios.get(`${api}/crawler/${crawlers[i].name}/stop`, {
        headers: { "x-access-token": token },
      })
        .then((res) => {
          console.log(`stopped ${crawlers[i].name}`);
        })
        .catch((err) => {
          console.log(err);
        });
    },
    [api, token, crawlers]
  );

  const startStopBtn = useCallback(
    (i) => {
      if (crawlers[i].status === "running") {
        return <Button onClick={() => stop(i)}>stop</Button>;
      } else {
        return (
          <Button onClick={() => start(i)}>
            {crawlers[i].status === "stopped" ? "restart" : "start"}
          </Button>
        );
      }
    },
    [start, stop, crawlers]
  );

  const progress = useCallback((p) => {
    const chars = 40;
    if (!p) p = 0;
    const left = Math.floor(p * chars);
    var str = "#".repeat(left) + "-".repeat(chars - left);
    str = `[${str}] ${p * 100} %`;
    return str;
  }, []);

  useEffect(() => {
    var interval = null;
    if (admin)
      interval = setInterval(() => {
        _fetchData();
      }, 2000);
    return () => clearInterval(interval);
  }, [admin, _fetchData]);

  if (state.loading)
    return (
      <div
        style={{
          display: "flex",
          height: "100%",
          justifyContent: "center",
          paddingTop: "50px",
        }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
  if (crawlers) {
    return (
      <div>
        {crawlers.map((c, i) => (
          <div key={i} style={styles}>
            <p>{c.name}</p>
            <p>Status: {c.status}</p>
            <p>{progress(c.progress)}</p>
            <p>{c.message || ""}</p>
            <p>{startStopBtn(i)}</p>
          </div>
        ))}
      </div>
    );
  } else {
    return <div>Error</div>;
  }
};

export default withRouter(Admin);
