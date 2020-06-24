import React, { Component } from "react";
import { Accordion, Card } from "react-bootstrap";
import Parser from "html-react-parser";
import styles from "../styles/results.module.css";
import { Star, ExternalLink } from "react-feather";
import Axios from "axios";

class Results extends Component {

  componentDidMount() {
    const { data, activeDoc } = this.props;
    if (data && data.response.docs.length > 0)
      this.props.setActiveDoc(activeDoc ? activeDoc : data.response.docs[0].id);
    if (activeDoc) {
      const activeCard = document.querySelector(".restore-" + activeDoc);
      if (activeCard) {
        // console.log(activeCard.offsetTop);
        activeCard.scrollIntoView();
        window.scrollBy(0, -700);
        // var top = activeCard.offsetTop - 100;
        // if(top){
        //   window.scrollTo(0, top);
        // }
      }
    }
  }

  _cardBody = docId => {
    const { data } = this.props;
    const highlights = data.highlighting[docId];
    var pages = [];
    if (!highlights.fetched) {
      return <div>Loading ...</div>
    }
    for (let key in highlights) {
      if (key.split("_")[0] === "page") {
        pages.push(
          <tr
            key={key}
            className={styles.cardTr}
            style={{ textAlign: "left", cursor: "pointer"}}
            onClick={this._setPage.bind(null, key.split("_")[1])}
          >
            <td style={{ padding: "3px 5px 3px 1px", textAlign: "center"}}>
              {key.split("_")[1]}
            </td>
            <td style={{ padding: "3px 1px"}}>
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
  }

  _setPage = page => {
    this.props.setActivePage(parseInt(page));
  }

  _getVal = (doc, field) => {
    const hl = this.props.data.highlighting;
    if (hl && hl[doc.id] && hl[doc.id][field]) {
      return Parser(hl[doc.id][field][0]);
    }
    return doc[field];
  }

  _handleClick = docId => {
    this.props.setActiveDoc(docId === this.props.activeDoc ? null : docId);
  }

  _getStar = docId => {
    const { api, token } = this.props;
    Axios.get(
      api + "/favorite/" + docId,
      {
        headers: { "x-access-token": token }
      }
    ).then(res => {
      return res.data;
    })
  }

  _starKlickHandler = index => {
    const { api, token, data } = this.props;
    Axios.put(
      api + "/favorite/" + data.response.docs[index].id, {},
      {
        headers: { "x-access-token": token }
      }
    ).then(res => {
      this.props.setFavorite(index, res.data);
    })
  }

  render() {
    var { data, activeDoc } = this.props;
    var docs = [];
    if (data) docs = data.response.docs;
    if (docs.length > 0) {
      const Cards = docs.map((doc, i) => (
        <Card key={doc.id}>
          <Card.Header style={{cursor: "pointer"}} className={"restore-" + doc.id} >
            <div style={{display: "flex", width: "100%"}}>
            <Accordion.Toggle
              as={Card.Header}
              block={"true"}
              eventKey={doc.id}
              onClick={this._handleClick.bind(null, doc.id)}
              style={{
                textAlign: "left", 
                paddingRight: "5px", 
                width: "100%", 
                paddingBottom: "0", 
                border: "0", 
                backgroundColor: "transparent"
              }}
            >
              <i>{this._getVal(doc, "document")}</i>
              <span> - {this._getVal(doc, "title")}</span>
            </Accordion.Toggle>
            <ExternalLink 
              size="30"
              style={{cursor: "pointer", margin: "3px"}}
              onClick={()=> window.open(doc.link, "_blank")}
            />
            <Star 
              size="30"
              style={{ fill: doc.isFavorite ? "yellow" : "none", cursor: "pointer", margin: "3px" }}
              onClick={this._starKlickHandler.bind(null, i)}
            /></div>
            <Accordion.Toggle
              as={Card.Header}
              block={"true"}
              eventKey={doc.id}
              onClick={this._handleClick.bind(null, doc.id)}
              style={{
                textAlign: "left", 
                border: "0", 
                paddingTop: "0", 
                backgroundColor: "transparent" 
              }}
            >
              <small>{this._getVal(doc, "zusatz")}</small>
            </Accordion.Toggle>
          </Card.Header>
          <Accordion.Collapse eventKey={doc.id}>
            <Card.Body>{this._cardBody(doc.id)}</Card.Body>
          </Accordion.Collapse>
        </Card>
      ));
      return (
        <React.Fragment>
          <Accordion activeKey={activeDoc} >{Cards}</Accordion>
        </React.Fragment>
      );
    } else return <React.Fragment></React.Fragment>;
  }
}

export default Results;
