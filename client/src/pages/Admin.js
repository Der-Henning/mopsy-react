import React, { useState, useCallback, useEffect } from "react";
import { withRouter } from "react-router-dom";
import { Button } from "react-bootstrap";
import Axios from "axios";
import { Spinner } from "react-bootstrap";
import { useGlobal } from "../context";

const styles = {
  border: "solid 1px grey",
  maxWidth: "500px",
  borderRadius: "10px",
  margin: "20px",
  padding: "10px",
};

const Admin = (props) => {
  const { api, token, admin, dimensions } = useGlobal();

  const [crawlers, setCrawlers] = useState({});
  const [state, setState] = useState({ loading: true });

  const _fetchCrawlers = useCallback(() => {
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
      Axios.get(`${api}/crawler/${i}/start`, {
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
      Axios.get(`${api}/crawler/${i}/stop`, {
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
      if (crawlers[i].startable) {
        return <Button onClick={() => start(i)}>start</Button>;
      } else {
        return <Button onClick={() => stop(i)}>stop</Button>;
      }
    },
    [start, stop, crawlers]
  );

  const progress = useCallback((p) => {
    const chars = 40;
    if (!p) p = 0;
    const left = Math.floor(p / 100 * chars);
    var str = "#".repeat(left) + "-".repeat(chars - left);
    str = `[${str}] ${p} %`;
    return str;
  }, []);

  useEffect(() => {
    var interval = null;
    _fetchCrawlers();
    if (admin)
      interval = setInterval(() => {
        _fetchCrawlers();
      }, 2000);
    return () => clearInterval(interval);
  }, [admin, _fetchCrawlers]);

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
      <div
        style={{
          height: dimensions.pdfHeight,
          overflowY: "auto",
        }}
      >
        {Object.keys(crawlers).map((key) => (
          <div key={key} style={styles}>
            <p>{crawlers[key].name}</p>
            <p>Status: {crawlers[key].status}</p>
            <p>{progress(crawlers[key].progress)}</p>
            <p>{crawlers[key].message || ""}</p>
            <p>{crawlers[key].text || ""}</p>
            <p>{startStopBtn(key)}</p>
          </div>
        ))}
      </div>
    );
  } else {
    return <div>Error</div>;
  }
};

export default withRouter(Admin);
