import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Document, Page } from 'react-pdf';
import { LinearProgress } from '@material-ui/core';
import pdfjsWorker from 'pdfjs-dist/es5/build/pdf.worker.entry';

const PDFViewer = (props) => {
    // const { url, page } = props;

    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [progress, setProgress] = useState(0);
    // const [url, setUrl] = useState(null);

    const url = useMemo(() => (props.url), [props.url]);

    const onDocumentLoadSuccess = useCallback(({ numPages }) => {
        setNumPages(numPages);
    }, []);

    const onDocumentLoading = useCallback(({ loaded, total }) => {
        setProgress(loaded / total * 100);
    }, [])

    useEffect(() => {
        setPageNumber(parseInt(props.page) || 1);
    }, [props.page]);

    // useEffect(() => {
    //     setUrl(props.url);
    // }, [props.url])

    const CurrentPage = useCallback(() => (
        <Page pageNumber={pageNumber} />
    ), [pageNumber])

    const CurrentDocument = useCallback(() => (
        <Document
            file={{ url }}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadProgress={onDocumentLoading}
            options={{ GlobalWorkerOptions: { workerSrc: pdfjsWorker } }}
        >
            <CurrentPage />
        </Document>
    ), [url, onDocumentLoading, onDocumentLoadSuccess]);

    const Progress = useCallback(() => (
        <div style={{
            display: progress < 100 && progress > 0 ? "block" : "none",
            position: "absolute",
            width: "100%",
            top: "0",
            zIndex: "999"
        }}>
            <LinearProgress variant="determinate" value={progress} />
        </div>
    ), [progress])

    return (
        <div style={{
            width: "100%", height: "100%", position: "relative",
            backgroundColor: "lightgrey",
            overflow: "auto"
        }}>
            <Progress />
            <Document
                file={{ url }}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadProgress={onDocumentLoading}
                options={{ GlobalWorkerOptions: { workerSrc: pdfjsWorker } }}
            >
                <Page pageNumber={pageNumber} />
            </Document>
        </div>
    )
}

export default PDFViewer;