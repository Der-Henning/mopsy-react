import React, { Component } from 'react';
import PDF from '../components/pdf';
import { Carousel } from 'react-bootstrap';
import styles from '../styles/pdfoverlay.module.css';

export default class PDFOverlay extends Component {
    constructor(props) {
        super(props);
        this.state = {
            docId: null,
            page: null
        }
    }

    render() {
        return(
            /* <Carousel className={styles.overlay} interval={0}>
                <Carousel.Item> */
                    <PDF 
                        url={"https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}
                        page={1}
                        searchText={"text"}
                    />
                /* </Carousel.Item>

            </Carousel> */
        )
    }
}