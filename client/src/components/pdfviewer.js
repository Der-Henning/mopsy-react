import React, { Component } from "react";
import styles from "../styles/pdfviewer.module.css";
import { DraggableCore } from "react-draggable";

export default class PDFViewer extends Component {
  _isMounted = false;

  constructor(props) {
    super(props);
    this.state = {
      url: props.url,
      page: props.page || 1
    };
  }

  componentDidMount() {
    console.log("mount");
    this._isMounted=true;
  }

  componentWillUnmount() {
    console.log("unmount");
    this._isMounted = false;
  }

  componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
      this.setState({ url: null }, () => {
        this.setState(this.props);
        if (prevProps.url !== this.props.url) this.setState({ page: 1 });
      });
    }
  }

  resize = (e, data) => {
    
      if (this._isMounted) this.props.resizePDF(data.deltaX);
     // console.log(data.deltaX);
  };

  render() {
    const { page, url } = this.state;
    if (url)
      return (
        <React.Fragment>
          <DraggableCore onDrag={this.resize}>
            <div className={styles.resizer} />
          </DraggableCore>
          <iframe
            title="PDFViewer"
            src={url + "?#page=" + page}
            className={styles.wrapper}
          />
        </React.Fragment>
      );
    return <React.Fragment></React.Fragment>;
  }
}
