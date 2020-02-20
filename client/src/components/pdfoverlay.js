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
                        url={"/proxy?url=http://localhost/dvtest/A1_275_3_8901.pdf"}
                        page={1}
                        searchText={"text"}
                    />
                /* </Carousel.Item>

            </Carousel> */
        )
    }
}