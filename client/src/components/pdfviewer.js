import React, { Component } from "react";
import Axios from "axios";

const styles = {
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}

export default class PDFViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pdfExists: false,
      loading: true
    }
    this._checkURL(props.url);
  }

  componentDidUpdate(prevProps) {
    const { url, page } = this.props;
    if (url !== prevProps.url) this._checkURL(url);
    if (page !== prevProps.page) this.setState(
      {loading: true},
      () => this.setState({loading: false})
    );
  }

  _checkURL = url => {
    if (url) {
      Axios.head(url).then(() => {
        this.setState({pdfExists: true, loading: false})
      }).catch(() => {
        this.setState({pdfExists: false, loading: false})
      })
    }
  }

  _getPdfFrame = () => {
    const { url, page } = this.props;
    const { pdfExists, loading } = this.state;
    if (loading) return (<div style={styles}>Loading ...</div>)
    if (!pdfExists) return (<div style={styles}>PDF missing!</div>)
    return (
      <iframe
        title="PDFViewer"
        src={url + "#toolbar=0&navpanes=0&view=Fit&page=" + page}
        style={{width: "100%", height: "100%", border: "0"}}
      />
    );
  }

  render() {
    const { url, width, height } = this.props;
    return (
      <div style={{width: width, height: height}}>
        {url ? this._getPdfFrame() : ''}
      </div>
    );
  }
}
