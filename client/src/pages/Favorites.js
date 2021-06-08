import React, { useState, useCallback, useEffect } from "react";
import { withRouter } from "react-router-dom";
import { Table, Spinner, Button } from "react-bootstrap";
import Axios from "axios";
import { Trash2, ExternalLink } from "react-feather";
import { useGlobal } from "../context";

const Favorites = (props) => {
  const { api, token, loginId, dimensions } = useGlobal();

  const [state, setState] = useState({
    isFetching: true,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!loginId) props.history.push("/");
  });

  const _fetchData = useCallback(() => {
    setState({
      isFetching: true,
      data: null,
      error: null,
    });
    Axios.get(api + "/favorite", {
      headers: { "x-access-token": token },
    })
      .then((res) => {
        setState({
          isFetching: false,
          data: res.data,
          error: null,
        });
      })
      .catch((err) => {
        setState({
          isFetching: false,
          data: null,
          error: err.response ? err.response.data?.status?.message : err,
        });
      });
  }, [api, token]);

  useEffect(() => {
    if (loginId) _fetchData();
  }, [loginId, _fetchData]);

  const _removeFavorite = useCallback(
    (DocId) => {
      Axios.put(
        api + "/favorite/" + DocId,
        {},
        {
          headers: { "x-access-token": token },
        }
      ).then(() => {
        _fetchData();
      });
    },
    [api, token, _fetchData]
  );

  const _body = useCallback(() => {
    if (state.isFetching)
      return (
        <div
          style={{
            width: "50px",
            margin: "0 auto",
            marginTop: "50px",
          }}
        >
          <Spinner animation="border" variant="primary" />
        </div>
      );
    if (state.error) return <div>{state.error}</div>;
    return (
      <Table striped hover style={{ margin: "0" }}>
        <thead>
          <tr>
            <th></th>
            <th>Dokument</th>
            <th>Stand</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {state.data.map((doc) => {
            return (
              <tr key={doc.DocId}>
                <td>
                  {doc.deleted ?
                    "gelöscht" :
                    <Button
                      variant="link"
                      onClick={() =>
                        props.history.push(
                          `/viewer?url=${doc.link}`
                        )
                      }
                    >
                      <ExternalLink />
                    </Button>
                  }
                </td>
                <td>
                  <span>{doc.document ? `${doc.document} - ` : ''}{doc.title}</span>
                  <br />
                  <small>{doc.subtitle}</small>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{doc.date}</td>
                <td>
                  <Button
                    variant="link"
                    onClick={() => {
                      _removeFavorite(doc.DocId);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  }, [_removeFavorite, state, props.history]);

  return (
    <div
      style={{
        height: dimensions.pdfHeight,
        overflowY: "auto",
      }}
    >
      {_body()}
    </div>
  );
};

export default withRouter(Favorites);
