import React, { useState, useCallback, useEffect } from "react";
import { withRouter } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import Axios from "axios";
import { Spinner } from "react-bootstrap";
import { useGlobal } from "../context";
import qs from "qs";

const styles = {
  border: "solid 1px grey",
  maxWidth: "500px",
  borderRadius: "10px",
  margin: "20px",
  padding: "10px",
};

const Admin = (props) => {
  const { api, token, admin, dimensions } = useGlobal();

  const [crawlers, setCrawlers] = useState([]);
  const [modules, setModules] = useState([]);
  const [state, setState] = useState({ loading: true });
  const [form, setForm] = useState({ active: false, crawler: null });

  const _fetchCrawlers = useCallback(() => {
    // setState((prevState) => ({ ...prevState, loading: true }));
    Axios.get(api + "/crawler", {
      headers: { "x-access-token": token },
    })
      .then((res) => {
        setCrawlers(() => res.data);
        console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setState((prevState) => ({ ...prevState, loading: false }));
      });
  }, [api, token]);

  const _fetchModules = useCallback(() => {
    Axios.get(api + "/crawler/modules", {
      headers: { "x-access-token": token },
    })
      .then((res) => {
        setModules(() => res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [api, token]);

  useEffect(() => {
    if (!admin) props.history.push("/");
    _fetchModules();
  }, [admin, props.history, _fetchModules]);

  const _addCrawler = useCallback(
    (e) => {
      e.preventDefault();
      const data = {
        name: e.target.name.value,
        module: e.target.module.value,
        cron: e.target.cron.value,
        args: e.target.args.value,
        compareMethod: e.target.compareMethod.value,
      };

      Axios.post(api + "/crawler", qs.stringify({ data }), {
        headers: { "x-access-token": token },
      })
        .then((res) => {
          _fetchCrawlers();
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          setForm({ ...form, active: false, crawler: null });
        });
    },
    [api, token, _fetchCrawlers, form]
  );

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

  const crawlerForm = useCallback(
    (crawler) => {
      return (
        <Form onSubmit={_addCrawler}>
          <Form.Group>
            <Form.Label>Crawler Name</Form.Label>
            <Form.Control type="text" name="name" />
          </Form.Group>
          <Form.Group>
            <Form.Label>Modul</Form.Label>
            <Form.Control as="select" name="module">
              {modules.map((m) => (
                <option key={m.file} value={m.file}>
                  {m.name} - Version {m.version}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Argumente</Form.Label>
            <Form.Control type="text" name="args" />
          </Form.Group>
          <Form.Group>
            <Form.Label>Vergleichsmethode</Form.Label>
            <Form.Control as="select" name="compareMethod">
              <option value="md5">md5</option>
              <option value="lcd">last change date</option>
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Cron</Form.Label>
            <Form.Control type="text" name="cron" />
          </Form.Group>
          <Button variant="outline-success" type="submit">
            Speichern
          </Button>
        </Form>
      );
    },
    [_addCrawler, modules]
  );

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
  if (form.active) {
    return crawlerForm(form.crawler);
  }
  if (crawlers) {
    return (
      <div
        style={{
          height: dimensions.pdfHeight,
          overflowY: "auto",
        }}
      >
        <Button onClick={() => setForm({ ...form, active: true, crawler: null })}>
          new Crawler
        </Button>
        {Object.keys(crawlers).map((key) => (
          <div key={key} style={styles}>
            <p>{crawlers[key].name}</p>
            <p>Status: {crawlers[key].status}</p>
            <p>{progress(crawlers[key].progress)}</p>
            <p>{crawlers[key].message || ""}</p>
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
