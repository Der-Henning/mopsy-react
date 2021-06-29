import React, { useState, useCallback, useEffect } from "react";
import { withRouter } from "react-router-dom";
import { Table, Spinner } from "react-bootstrap";
import { useGlobal } from "../context";
import { OpenExternalLinkButton, FavoriteButton } from "../components";

const Changes = (props) => {
    const { userAPI } = useGlobal();
    const { user, getChanges, toggleFavorites } = userAPI;

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
        getChanges()
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
    }, [getChanges]);

    useEffect(() => {
        _fetchData();
    }, [_fetchData]);

    const _starKlickHandler = useCallback(
        (DocId) => {
            if (user.loggedIn)
                toggleFavorites(DocId)
                    .then(() => {
                        _fetchData(false);
                    });
        },
        [user, toggleFavorites, _fetchData]
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
                                        <OpenExternalLinkButton link={doc.externallink || doc.link} />
                                    }
                                </td>
                                <td>
                                    <span>{doc.document ? `${doc.document} - ` : ''}{doc.title}</span>
                                    <br />
                                    <small>{doc.subtitle}</small>
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>{doc.date}</td>
                                <td>
                                    <FavoriteButton isFavorite={doc.isFavorite} onClick={_starKlickHandler.bind(null, doc.DocId)} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        );
    }, [_starKlickHandler, state]);

    return (
        <div
            // style={{
            //     height: dimensions.pdfHeight,
            //     overflowY: "auto",
            // }}
        >
            {_body()}
        </div>
    );
};

export default withRouter(Changes);
