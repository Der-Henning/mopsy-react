import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import pdfjsWorker from 'pdfjs-dist/es5/build/pdf.worker.entry';
import * as pdfjsViewer from 'pdfjs-dist/es5/web/pdf_viewer';
import * as pdfjs from "pdfjs-dist/es5/build/pdf";
import 'pdfjs-dist/es5/web/pdf_viewer.css';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
const CMAP_URL = "../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;
const DEFAULT_SCALE = 1.0;
const CSS_UNITS = 96 / 72;
const eventBus = new pdfjsViewer.EventBus();
const pdfLinkService = new pdfjsViewer.PDFLinkService({
    eventBus: eventBus,
});
const pdfFindController = new pdfjsViewer.PDFFindController({
    eventBus: eventBus,
    linkService: pdfLinkService,
});
var pdfViewer = null;

const styles = {
    height: "100%",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
};

const PDFViewer = (props) => {
    const { url, page } = props;
    const viewerContainer = useRef(null);
    const viewer = useRef(null);

    const [document, setDocument] = useState({
        loading: true,
        content: null,
    });
    const [pageNum, setPageNum] = useState(parseInt(page) || 1);
    const [pdfViewerLoaded, setPdfViewerLoaded] = useState(false);

    useEffect(() => {
        setPageNum(parseInt(page) || 1);
    }, [page]);

    const _setPage = useCallback(async () => {
        const { content } = document;
        if (content && pdfViewerLoaded) {
            const pdfPage = await content.getPage(pageNum);
            if (viewerContainer.current) {
                const viewport = pdfPage.getViewport({ scale: DEFAULT_SCALE });
                let scale = viewerContainer.current.clientWidth / (viewport.width * CSS_UNITS);
                if (scale * viewport.height * CSS_UNITS > viewerContainer.current.clientHeight) {
                    scale = viewerContainer.current.clientHeight / (viewport.height * CSS_UNITS);
                    viewer.current.style.width = `${scale * viewport.width * CSS_UNITS}px`;
                } else {
                    viewer.current.style.height = `${scale * viewport.height * CSS_UNITS}px`;
                }
                pdfViewer.currentScale = scale;
                pdfViewer.currentPageNumber = pageNum;
            }
        }
    }, [document, pageNum, pdfViewerLoaded])

    const _loadDocument = useCallback(async () => {
        setDocument(() => ({
            loading: true,
            content: null
        }));
        if (url) {
            try {
                const doc = await pdfjs.getDocument({
                    url: url,
                    cMapUrl: CMAP_URL,
                    cMapPacked: CMAP_PACKED,
                }).promise
                setDocument(() => ({
                    loading: false,
                    content: doc
                }));
            } catch(e) {
                console.log(e)
                setDocument(() => ({
                    loading: false,
                    content: null
                }));
            }
        }
    }, [url]);

    const wheelEvent = useCallback((e) => {
        if (e.deltaY < 0) {
            setPageNum((old) => {
                if (old - 1 > 0) return old - 1
                return old
            });
        }
        if (e.deltaY > 0) {
            setPageNum((old) => {
                if (old + 1 < pdfViewer.pagesCount) return old + 1
                return old
            });
        }
    }, [])

    const _getPdfFrame = useCallback(() => {
        const { loading, content } = document;
        return (
            <div style={{ height: "100%", width: "100%" }}>
                <div style={{ ...styles, display: loading ? "flex" : "none" }}><span>Loading ...</span></div>
                <div style={{ ...styles, display: !content && !loading ? "flex" : "none" }}>PDF missing!</div>
                <div
                    ref={viewerContainer}
                    onWheel={(e) => wheelEvent(e)}
                    style={{
                        ...styles,
                        backgroundColor: "lightgrey",
                        overflow: "hidden",
                        display: content && !loading ? "flex" : "none"
                    }}>
                    <div ref={viewer} style={{ position: "relative", width: "100%", height: "100%" }}></div>
                </div>
            </div>)
    }, [document, wheelEvent]);

    useEffect(() => {
        _loadDocument();
    }, [_loadDocument]);

    useEffect(() => {
        if (document.content && pdfViewerLoaded) {
            pdfViewer.setDocument(document.content);
            pdfLinkService.setDocument(document.content, null);
        }
    }, [document, pdfViewerLoaded])

    useLayoutEffect(() => {
        if (viewerContainer.current) {
            pdfViewer = new pdfjsViewer.PDFSinglePageViewer({
                container: viewerContainer.current,
                viewer: viewer.current,
                eventBus: eventBus,
                linkService: pdfLinkService,
                findController: pdfFindController,
            });
            pdfLinkService.setViewer(pdfViewer);
            setPdfViewerLoaded(true);
        }
    }, [])

    useEffect(() => {
        _setPage();
    }, [_setPage])

    return (
        <div style={{ width: "100%", height: "100%" }}>
            {url ? _getPdfFrame() : ""}
        </div>
    );
};

export default PDFViewer;
