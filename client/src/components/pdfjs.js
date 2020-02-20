import React, { Component } from 'react';
import styles from '../styles/pdfjs.module.css';

export default class PDFJs extends Component {
  constructor(props) {
      super(props);
      this.state = {
        url: props.url,
        searchText: props.searchText || '',
        page: props.page || 1
      }
  }

  componentDidUpdate(prevProps) {
    if (prevProps !== this.props) this.setState(this.props);
  }

  render() {
    const { searchText, page, url } = this.state;
    return (
      <div>
        <iframe src={'pdfjs/web/viewer.html?file=' + encodeURIComponent(url) + '#page=' + page} className={styles.wrapper}/>
      </div>
    );
  }
}