import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, ToggleButton } from "react-bootstrap";
import { Spinner } from "react-bootstrap";
import { useGlobal } from "../context";
import { useCrawlers } from "../hooks";

const styles = {
  border: "solid 1px grey",
  maxWidth: "500px",
  borderRadius: "10px",
  margin: "20px",
  padding: "10px",
};

const Admin = (props) => {
  const { api, userAPI } = useGlobal();
  const { user } = userAPI;
  const { fetchCrawlers,
    startCrawler,
    stopCrawler,
    toggleAutorestart,
    resetIndex } = useCrawlers(api);
  const navigate = useNavigate();

  const [crawlers, setCrawlers] = useState({});
  const [state, setState] = useState({ loading: true });

  const _fetchCrawlers = useCallback(() => {
    // setState((prevState) => ({ ...prevState, loading: true }));
    fetchCrawlers()
      .then((res) => {
        setCrawlers(res);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setState((prevState) => ({ ...prevState, loading: false }));
      });
  }, [fetchCrawlers]);

  const _start = useCallback(
    (i) => {
      startCrawler(i)
        .then((res) => {
          console.log(`started ${crawlers[i].name}`);
        })
        .catch((err) => {
          console.log(err);
        });
    },
    [startCrawler, crawlers]
  );

  const _stop = useCallback(
    (i) => {
      stopCrawler(i)
        .then((res) => {
          console.log(`stopped ${crawlers[i].name}`);
        })
        .catch((err) => {
          console.log(err);
        });
    },
    [stopCrawler, crawlers]
  );

  const _toggleAutorestart = useCallback(
    (i) => {
      toggleAutorestart(i)
        .then((res) => {
          console.log(`toggled autorestart for ${crawlers[i].name}`);
        })
        .catch((err) => {
          console.log(err);
        })
    },
    [toggleAutorestart, crawlers]
  )

  const _resetIndex = useCallback(
    (i) => {
      resetIndex(i)
        .then((res) => {
          console.log(`deleted index of ${crawlers[i].name}`);
          _start(i);
        })
        .catch((err) => {
          console.log(err);
        })
    },
    [resetIndex, _start, crawlers]
  )

  const startStopBtn = useCallback(
    (i) => {
      if (crawlers[i].startable) {
        return <Button onClick={() => _start(i)}>start</Button>;
      } else {
        return <Button onClick={() => _stop(i)}>stop</Button>;
      }
    },
    [_start, _stop, crawlers]
  );

  const toggleAutostartBtn = useCallback(
    (i) => {
      return <ToggleButton
        type="checkbox"
        checked={crawlers[i].autorestart}
        onChange={() => _toggleAutorestart(i)}>
        Autorestart
      </ToggleButton>
    },
    [_toggleAutorestart, crawlers]
  );

  const resetButton = useCallback(
    (i) => {
      return <Button onClick={() => _resetIndex(i)}>reset Index</Button>
    },
    [_resetIndex]
  )

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
    if (user.admin)
      interval = setInterval(() => {
        _fetchCrawlers();
      }, 2000);
    else navigate("/");
    return () => clearInterval(interval);
  }, [user, _fetchCrawlers, navigate]);

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
      // style={{
      //   height: dimensions.pdfHeight,
      //   overflowY: "auto",
      // }}
      >
        {Object.keys(crawlers).map((key) => (
          <div key={key} style={styles}>
            <p>{crawlers[key].name}</p>
            <p>Status: {crawlers[key].status}</p>
            <p>{progress(crawlers[key].progress)}</p>
            <p>{crawlers[key].message || ""}</p>
            <p>{crawlers[key].text || ""}</p>
            <p>{startStopBtn(key)} {toggleAutostartBtn(key)} {resetButton(key)}</p>
          </div>
        ))}
      </div>
    );
  } else {
    return <div>Error</div>;
  }
};

export default Admin;
