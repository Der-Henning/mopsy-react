import React, { useEffect, useCallback } from "react";
import { Accordion, Card } from "react-bootstrap";
import Parser from "html-react-parser";
import styles from "../styles/results.module.css";
import { Star, ExternalLink } from "react-feather";
import Axios from "axios";
import { useGlobal, useSearchData } from "../context";
import { withRouter } from "react-router-dom";

const Results = (props) => {
  const { api, token } = useGlobal();
  const {
    documents,
    highlighting,
    activeDocument,
    setActiveDocument,
    setFavorite,
  } = useSearchData();
  const { setPdfPage } = props;

  useEffect(() => {
    if (documents.length > 0)
      setActiveDocument(activeDocument ? activeDocument : documents[0].id);
    if (activeDocument) {
      const activeCard = document.querySelector(".restore-" + activeDocument);
      if (activeCard) {
        activeCard.scrollIntoView();
        window.scrollBy(0, -700);
      }
    }
    // eslint-disable-next-line
  }, []);

  const _cardBody = useCallback(
    (docId) => {
      const highlights = highlighting[docId];
      var pages = [];
      if (!highlights?.fetched) {
        return <div>Loading ...</div>;
      }
      for (let key in highlights) {
        if (key.split("_")[0] === "page") {
          pages.push(
            <tr
              key={key}
              className={styles.cardTr}
              style={{ textAlign: "left", cursor: "pointer" }}
              onClick={() => setPdfPage(key.split("_")[1])}
            >
              <td style={{ padding: "3px 5px 3px 1px", textAlign: "center" }}>
                {key.split("_")[1]}
              </td>
              <td style={{ padding: "3px 1px" }}>
                {Parser(highlights[key].join(" ... "))}
              </td>
            </tr>
          );
        }
      }
      return (
        <table>
          <tbody>{pages}</tbody>
        </table>
      );
    },
    [highlighting, setPdfPage]
  );

  const _getVal = useCallback(
    (doc, field) => {
      const hl = highlighting;
      if (hl && hl[doc.id] && hl[doc.id][field]) {
        return Parser(hl[doc.id][field][0]);
      }
      return doc[field];
    },
    [highlighting]
  );

  const _toggleActiveDocument = useCallback(
    (docId) => {
      setActiveDocument(docId === activeDocument ? null : docId);
    },
    [setActiveDocument, activeDocument]
  );

  const _starKlickHandler = useCallback(
    (index) => {
      Axios.put(
        api + "/favorite/" + documents[index].id,
        {},
        {
          headers: { "x-access-token": token },
        }
      ).then((res) => {
        setFavorite(index, res.data);
      });
    },
    [documents, api, token, setFavorite]
  );

  const _cards = useCallback(() => {
    return documents.map((doc, i) => (
      <Card key={doc.id}>
        <Card.Header
          style={{ cursor: "pointer" }}
          className={"restore-" + doc.id}
        >
          <div style={{ display: "flex", width: "100%" }}>
            <Accordion.Toggle
              as={Card.Header}
              block={"true"}
              eventKey={doc.id}
              onClick={_toggleActiveDocument.bind(null, doc.id)}
              style={{
                textAlign: "left",
                paddingRight: "5px",
                width: "100%",
                paddingBottom: "0",
                border: "0",
                backgroundColor: "transparent",
              }}
            >
              <span>{_getVal(doc, "title")}</span>
            </Accordion.Toggle>
            <ExternalLink
              size="30"
              style={{ cursor: "pointer", margin: "3px" }}
              onClick={() => window.open(doc.link, "_blank")}
            // onClick={() =>
            //   props.history.push(
            //     `/viewer?url=${doc.link}`
            //   )
            // }
            />
            <Star
              size="30"
              style={{
                fill: doc.isFavorite ? "yellow" : "none",
                cursor: "pointer",
                margin: "3px",
              }}
              onClick={_starKlickHandler.bind(null, i)}
            />
          </div>
          <Accordion.Toggle
            as={Card.Header}
            block={"true"}
            eventKey={doc.id}
            onClick={_toggleActiveDocument.bind(null, doc.id)}
            style={{
              textAlign: "left",
              border: "0",
              paddingTop: "0",
              backgroundColor: "transparent",
            }}
          >
            <small>{_getVal(doc, "zusatz")}</small>
          </Accordion.Toggle>
        </Card.Header>
        <Accordion.Collapse eventKey={doc.id}>
          <Card.Body>{_cardBody(doc.id)}</Card.Body>
        </Accordion.Collapse>
      </Card>
    ));
  }, [documents, _cardBody, _getVal, _starKlickHandler, _toggleActiveDocument]);

  if (documents.length > 0) {
    return (
      <React.Fragment>
        <Accordion activeKey={activeDocument}>{_cards()}</Accordion>
      </React.Fragment>
    );
  } else return <React.Fragment></React.Fragment>;
};

export default withRouter(Results);
