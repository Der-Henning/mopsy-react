import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { Table, Spinner, Button } from "react-bootstrap";
import Axios from "axios";
import { Trash2, ExternalLink } from "react-feather";

class Favorites extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFetching: true,
      data: null,
      error: null
    };
    if (!this.props.loginId) this.props.history.push("/");
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate() {
    if (!this.props.loginId) this.props.history.push("/");
  }

  fetchData() {
    const { token, api } = this.props;
    this.setState({
      isFetching: true,
      data: null
    });
    Axios.get(api + "/favorite", {
      headers: { "x-access-token": token }
    }).then(res => {
      this.setState({
        isFetching: false,
        data: res.data,
        error: null
      });
    }).catch(err => {
      if (err.response)
        this.setState({error: err.response.data, isFetching: false});
    });
  }

  _removeFavorite = DocId => {
    const { token, api } = this.props;
    Axios.put(api + "/favorite/" + DocId, {}, {
      headers: { "x-access-token": token}
    }).then(() => {
      this.fetchData();
    })
  }

  body() {
    const { isFetching, data, error } = this.state;
    if (isFetching)
      return (
        <div style={{
          width: "50px",
          margin: "0 auto",
          marginTop: "50px"
        }}>
          <Spinner
            animation="border" 
            variant="primary" 
          />
        </div>
      );
    if (error)
      return (
        <div>{error.status.message}</div>
      );
    return (
      <Table striped hover style={{margin: "0"}}>
        <thead>
          <tr>
            <th></th>
            <th>Regelung</th>
            <th>Stand</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.map(doc => {return (
            <tr key={doc.DocId}>
              <td>
                <Button
                  variant="link"
                  onClick={()=> window.open(doc.link, "_blank")}
                >
                  <ExternalLink />
                </Button>
              </td>
              <td>
                <i>{doc.document}</i>
                <span> - {doc.title}</span>
                <br/>
                <small>{doc.zusatz}</small>
              </td>
              <td style={{whiteSpace: "nowrap"}}>{doc.ScanDate}</td>
              <td>
                <Button
                  variant="link" 
                  onClick={() => {this._removeFavorite(doc.DocId)}}
                >
                  <Trash2 />
                </Button>
              </td>
            </tr>
          )})}
        </tbody>
      </Table>
    );
  }

  render() {
    const { contendHeight } = this.props;
    return (
      <div style={{
        height: contendHeight,
        overflowY: "auto"
      }}>
        {this.body()}
      </div>)
  }
}

export default withRouter(Favorites);
