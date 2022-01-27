import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Spinner } from "react-bootstrap";
import { useGlobal } from "../context";
import { OpenExternalLinkButton, DeleteButton } from "../components";

const Favorites = (props) => {
  const { userAPI } = useGlobal();
  const { user, getFavorites, toggleFavorites } = userAPI;
  const navigate = useNavigate();

  const [state, setState] = useState({
    isFetching: true,
    data: null,
    error: null,
  });

  const _fetchData = useCallback((setIsFetching = true) => {
    if (setIsFetching) setState({
      isFetching: true,
      data: null,
      error: null,
    });
    getFavorites()
      .then((res) => {
        setState({
          isFetching: false,
          data: res,
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
  }, [getFavorites]);

  useEffect(() => {
    if (!user.loggedIn) navigate("/");
    else _fetchData();
  }, [user, navigate, _fetchData]);

  const _removeFavorite = useCallback(
    (DocId) => {
      toggleFavorites(DocId)
        .then(() => {
          _fetchData(false);
        });
    },
    [toggleFavorites, _fetchData]
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
              <tr key={doc.id}>
                <td>
                  {doc.deleted ?
                    "gelöscht" :
                    <OpenExternalLinkButton link={doc.cache} />
                  }
                </td>
                <td>
                  <span>{doc.document ? `${doc.document} - ` : ''}{doc.title}</span>
                  <br />
                  <small>{doc.subtitle}</small>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{doc.scanDate?.split("T")[0]}</td>
                <td>
                  <DeleteButton
                    onClick={() => {
                      _removeFavorite(doc.id);
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  }, [_removeFavorite, state]);

  return (
    <div
    // style={{
    //   height: dimensions.pdfHeight,
    //   overflowY: "auto",
    // }}
    >
      {_body()}
    </div>
  );
};

export default Favorites;
