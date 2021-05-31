import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import pdfjsWorker from 'pdfjs-dist/es5/build/pdf.worker.entry';
import * as pdfjsViewer from 'pdfjs-dist/es5/web/pdf_viewer';
import * as pdfjs from "pdfjs-dist/es5/build/pdf";
import 'pdfjs-dist/es5/web/pdf_viewer.css';
import { LinearProgress } from '@material-ui/core';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const CMAP_URL = "../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;
const DEFAULT_SCALE = 1.0;
const CSS_UNITS = 96 / 72;
// const eventBus = new pdfjsViewer.EventBus();
// const pdfLinkService = new pdfjsViewer.PDFLinkService({
//     eventBus: eventBus,
// });
// const pdfFindController = new pdfjsViewer.PDFFindController({
//     eventBus: eventBus,
//     linkService: pdfLinkService,
// });
var pdfViewer = null;
var loadingTask = null;


const PDFViewer = (props) => {
    const { url, page } = props;
    const containerRef = useRef(null);
    const viewerRef = useRef(null);

    const [progress, setProgress] = useState(0);
    const [pageNum, setPageNum] = useState(parseInt(page) || 1);
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setPageNum(parseInt(page) || 1);
    }, [page]);

    // const _renderPage = useCallback(() => {
    //     if (document && !loading) {
    //         document.getPage(pageNum).then((page) => {
    //             const viewport = page.getViewport({ scale: DEFAULT_SCALE });
    //             let scale = containerRef.current.clientWidth / (viewport.width * CSS_UNITS);
    //             if (scale * viewport.height * CSS_UNITS > containerRef.current.clientHeight) {
    //                 scale = containerRef.current.clientHeight / (viewport.height * CSS_UNITS);
    //                 viewerRef.current.style.width = `${scale * viewport.width * CSS_UNITS}px`;
    //             } else {
    //                 viewerRef.current.style.height = `${scale * viewport.height * CSS_UNITS}px`;
    //             }
    //             pdfViewer.currentScale = scale;
    //             pdfViewer.currentPageNumber = pageNum;
    //         })
    //     }
    // }, [document, loading, pageNum])

    const _loadDocument = useCallback(() => {
        if (loadingTask) loadingTask.destroy();
        // setLoading(true);
        loadingTask = pdfjs.getDocument({
            url: url,
            cMapUrl: CMAP_URL,
            cMapPacked: CMAP_PACKED,
        });
        loadingTask.onProgress = (data) => {
            setProgress(data.loaded / data.total * 100);
        };
        loadingTask.promise.then(function (doc) {
            const eventBus = new pdfjsViewer.EventBus();
            const pdfLinkService = new pdfjsViewer.PDFLinkService({
                eventBus: eventBus,
            });
            const pdfFindController = new pdfjsViewer.PDFFindController({
                eventBus: eventBus,
                linkService: pdfLinkService,
            });

            // pdfLinkService.setDocument(doc,null);
            var promise = Promise.resolve();
            for (var i = 1; i <= doc.numPages; i++) {
                promise = promise.then(function (pageNum) {
                    return doc.getPage(pageNum).then(function (pdfPage) {

                        var viewport = pdfPage.getViewport(DEFAULT_SCALE);
                        var scale = containerRef.current.clientWidth / (viewport.width * CSS_UNITS);

                        // Create the page view.
                        var pdfPageView = new pdfjsViewer.PDFPageView({
                            container: containerRef.current,
                            id: pageNum,
                            scale: scale,
                            defaultViewport: pdfPage.getViewport(scale),
                            // annotationLayerFactory: new pdfjsViewer.DefaultAnnotationLayerFactory(),
                            renderInteractiveForms: true,
                            eventBus: eventBus,
                            linkService: pdfLinkService,
                            findController: pdfFindController,
                        });

                        // Associate the actual page with the view and draw it.
                        pdfPageView.setPdfPage(pdfPage);
                        return pdfPageView.draw();
                    });
                }.bind(null, i));
            }
            // setDocument(doc);
            // setLoading(false);
        })
    }, [url]);

    useLayoutEffect(() => {
        _loadDocument();
    }, [_loadDocument])

    // useLayoutEffect(() => {
    //     pdfViewer = new pdfjsViewer.PDFSinglePageViewer({
    //         container: containerRef.current,
    //         viewer: viewerRef.current,
    //         eventBus: eventBus,
    //         linkService: pdfLinkService,
    //         findController: pdfFindController,
    //     });
    //     pdfLinkService.setViewer(pdfViewer);
    // }, [])

    return (
        <div style={{ width: "100%", height: "100%", position: "relative", backgroundColor: "lightgrey" }}>
            <div style={{
                display: progress < 100 && progress > 0 ? "block" : "none",
                position: "absolute",
                width: "100%",
                top: "0",
                zIndex: "999"
            }}>
                <LinearProgress variant="determinate" value={progress} />
            </div>
            <div ref={containerRef} style={{ width: "100%", height: "100%", overflow: "auto" }}>
                <div ref={viewerRef}>
                    
                </div>
            </div>
        </div>
    )
}

export default PDFViewer;