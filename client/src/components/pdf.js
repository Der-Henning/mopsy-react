import React, { Component } from 'react';
import { Document, Page, AllPages } from 'react-pdf/dist/entry.webpack';
import styles from '../styles/pdf.module.css';

// https://gist.github.com/wojtekmaj/f265f55e89ccb4ce70fbd2f8c7b1d95d
function highlightPattern(text, pattern) {
  if (!pattern) return text;
  const splitText = text.split(pattern);
  if (splitText.length <= 1) {
    return text;
  }
  const matches = text.match(RegExp(pattern, 'g'));
  return splitText.reduce((arr, element, index) => (matches[index] ? [
    ...arr,
    element,
    <mark key={index}>
      {matches[index]}
    </mark>,
  ] : [...arr, element]), []);
}

export default class PDF extends Component {
  constructor(props) {
      super(props);
      this.state = {
        url: props.url,
        searchText: props.searchText || '',
        page: props.page || 1,
        numPages: null
      }
  }

  onDocumentLoadSuccess = ({ numPages }) => {
    this.setState({ numPages });
  }

  componentDidUpdate(prevProps) {
    if (prevProps !== this.props) this.setState(this.props);
  }

  makeTextRenderer = searchText => textItem => {
    return highlightPattern(textItem.str, searchText);
  }

  render() {
    const { searchText, page, url, numPages } = this.state;
    return (
      <div>
        <Document
          file={url}
          onLoadSuccess={this.onDocumentLoadSuccess}
          className={styles.wrapper}
        >
          <div className={styles.page}>
          <Page
            pageNumber={page}
            customTextRenderer={this.makeTextRenderer(searchText)}
            wrap={false}
          />
          </div>
          <div className={styles.page}>
          <Page
            pageNumber={page + 1}
            customTextRenderer={this.makeTextRenderer(searchText)}
            wrap={false}
          />
          </div>
          
        </Document>
        <p className={styles.pageNumber}>Page {page} of {numPages}</p>
      </div>
    );
  }
}