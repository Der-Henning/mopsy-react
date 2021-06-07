import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import pdfjsWorker from 'pdfjs-dist/es5/build/pdf.worker.entry';
import * as pdfjsViewer from 'pdfjs-dist/es5/web/pdf_viewer';
import * as pdfjs from "pdfjs-dist/es5/build/pdf";
import 'pdfjs-dist/es5/web/pdf_viewer.css';
// import { CircularProgress } from '@material-ui/core';
import { LinearProgress, Slider } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
// import { useGesture } from 'react-use-gesture';
// import { useSpring, animated } from 'react-spring'
import { useSearchData } from "../context";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
// pdfjs.disableAutoFetch = true;
// pdfjs.disableStream = true;
const CMAP_URL = "../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;
const DEFAULT_SCALE = 1.0;
const CSS_UNITS = 96 / 72;
const eventBus = new pdfjsViewer.EventBus();
const pdfLinkService = new pdfjsViewer.PDFLinkService({
    eventBus: eventBus,
});
const pdfAnnotationLayer = new pdfjsViewer.DefaultAnnotationLayerFactory();

var pdfViewer = null;
var loadingTask = null;

// document.addEventListener('gesturestart', (e) => e.preventDefault())
// document.addEventListener('gesturechange', (e) => e.preventDefault())

const styles = {
    height: "100%",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
};

const StyledSlider = withStyles({
    mark: {
        backgroundColor: '#FFD333',
        height: 2,
        width: 8,
        marginLeft: -3,
    },
})(Slider);

const PDFViewer = () => {
    const viewerContainer = useRef(null);
    const viewer = useRef(null);

    const {
        activeDocument,
        activeDocumentPage,
        setActiveDocumentPage,
        activeDocumentData,
        highlighting
    } = useSearchData();

    const [document, setDocument] = useState({
        loading: true,
        content: null,
    });
    const [pdfViewerLoaded, setPdfViewerLoaded] = useState(false);
    const [progress, setProgress] = useState(0);
    const [swipeStart, setSwipeStart] = useState(0);
    const [swipeStop, setSwipeStop] = useState(0);
    const [marks, setMarks] = useState([]);
    // const [error, setError] = useState(null);

    // const [zoom, setZoom] = useState(1);
    // const [spring, setSpring] = useSpring(() => ({
    //     rotateX: 0,
    //     rotateY: 0,
    //     rotateZ: 0,
    //     scale: 1,
    //     zoom: 0,
    //     x: 0,
    //     y: 0,
    //     config: { mass: 5, tension: 350, friction: 40 }
    //   }))

    useEffect(() => {
        if (highlighting?.[activeDocument]?.pages) {
            setMarks(() => Object.keys(highlighting[activeDocument]["pages"]).map(p => ({ value: p })))
        }
    }, [activeDocument, highlighting])

    const initPdfViewer = useCallback(() => {
        if (viewerContainer.current) {
            pdfViewer = new pdfjsViewer.PDFSinglePageViewer({
                container: viewerContainer.current,
                viewer: viewer.current,
                eventBus: eventBus,
                linkService: pdfLinkService,
                // findController: pdfFindController,
                annotationLayerFactory: pdfAnnotationLayer,
                renderInteractiveForms: true,
            });
            pdfLinkService.setViewer(pdfViewer);
            setPdfViewerLoaded(true);
        }
    }, [])

    const highlightMatches = useCallback((document, page) => {
        const textLayer = pdfViewer._pages[page - 1]?.textLayer?.textLayerDiv;
        const highlights = highlighting?.[document]?.pages?.[page];
        if (textLayer && highlights && !textLayer.highlighted) {
            textLayer.highlighted = true
            let phrases = highlights.map(h => (
                h.split("<b>")[1].split("</b>")[0]
            ));
            phrases = [...new Set(phrases)];
            for (let phrase in phrases) {
                phrases[phrase] = phrases[phrase].split('').join('(<[^>]+>)*');
            }
            const pattern = new RegExp("(" + phrases.join("|") + ")", "g");
            textLayer.innerHTML = textLayer.innerHTML.replace(pattern, (match) => {
                const pattern = new RegExp("(<[^>]+>)+");
                var splits = match.split(pattern);
                for (let s in splits) {
                    if (!pattern.test(splits[s])) {
                        splits[s] = "<span style='background-color:yellow'>" + splits[s] + "</span>"
                    }
                }
                return splits.join('');
            });
        }
    }, [highlighting])

    const _setPage = useCallback(async () => {
        const { content } = document;
        if (content && pdfViewerLoaded) {
            try {
                const pageNum = activeDocumentPage;
                const docID = activeDocument;
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
                    pdfViewer.eventBus.on("textlayerrendered", () => {
                        highlightMatches(docID, pageNum);
                    })
                }
            } catch { }
        }
    }, [document, activeDocument, activeDocumentPage, pdfViewerLoaded, highlightMatches])

    const _loadDocument = useCallback(async () => {
        setDocument(() => ({
            loading: true,
            content: null
        }));
        if (activeDocumentData()?.link) {
            try {
                if (loadingTask) loadingTask.destroy();
                loadingTask = pdfjs.getDocument({
                    url: activeDocumentData().link,
                    cMapUrl: CMAP_URL,
                    cMapPacked: CMAP_PACKED,
                });
                loadingTask.onProgress = (data) => {
                    setProgress(data.loaded / data.total * 100);
                }
                const doc = await loadingTask.promise
                setProgress(100)
                setDocument(() => ({
                    loading: false,
                    content: doc
                }));
                setProgress(0);
            } catch {
                setDocument(() => ({
                    loading: false,
                    content: null
                }));
            }
        }
    }, [activeDocumentData]);

    const wheelEvent = useCallback((e) => {
        if (e.deltaY < 0) {
            setActiveDocumentPage((() => {
                if (activeDocumentPage - 1 > 0) return activeDocumentPage - 1
                return activeDocumentPage
            })());
        }
        if (e.deltaY > 0) {
            setActiveDocumentPage((() => {
                if (activeDocumentPage + 1 <= pdfViewer.pagesCount) return activeDocumentPage + 1
                return activeDocumentPage
            })());
        }
    }, [setActiveDocumentPage, activeDocumentPage])

    const startSwipe = useCallback((e) => {
        const { clientY } = e.targetTouches[0];
        setSwipeStart(clientY);
        setSwipeStop(clientY);
    }, [])

    const moveSwipe = useCallback((e) => {
        const { clientY } = e.targetTouches[0];
        setSwipeStop(clientY);
    }, [])

    const stopSwipe = useCallback(() => {
        if (swipeStop - swipeStart > 150) {
            setActiveDocumentPage((() => {
                if (activeDocumentPage - 1 > 0) return activeDocumentPage - 1
                return activeDocumentPage
            })());
        }
        if (swipeStop - swipeStart < -150) {
            setActiveDocumentPage((() => {
                if (activeDocumentPage + 1 < pdfViewer.pagesCount) return activeDocumentPage + 1
                return activeDocumentPage
            })());
        }
    }, [swipeStart, swipeStop, setActiveDocumentPage, activeDocumentPage])

    // useGesture({
    //     onPinch: ({ offset: [d, a], event}) => {
    //         event.preventDefault();
    //         const zoom = d / 200;
    //         console.log(zoom);
    //         setSpring({ zoom: d / 200});
    //     },
    // }, {
    //     domTarget: viewer,
    //     eventOptions: { passive: false },
    // })

    useEffect(() => {
        _loadDocument();
        return () => {
            if (loadingTask) loadingTask.destroy();
        }
    }, [_loadDocument]);

    useEffect(() => {
        if (document.content && pdfViewerLoaded) {
            pdfViewer.setDocument(document.content);
            pdfLinkService.setDocument(document.content, null);
        }
    }, [document, pdfViewerLoaded])

    useLayoutEffect(() => {
        initPdfViewer();
    }, [initPdfViewer])

    useEffect(() => {
        _setPage();
    }, [_setPage])

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            {/* {url ? _getPdfFrame() : ""} */}
            <div style={{ ...styles, display: document.loading ? "flex" : "none" }}>
                <span>Loading ...</span>
                {/* <CircularProgress variant="determinate" value={progress} /> */}
            </div>
            <div style={{ ...styles, display: !document.content && !document.loading ? "flex" : "none" }}>PDF missing!</div>
            <div
                ref={viewerContainer}
                onWheel={(e) => wheelEvent(e)}
                onTouchStart={e => startSwipe(e)}
                onTouchMove={e => moveSwipe(e)}
                onTouchEnd={() => stopSwipe()}
                style={{
                    ...styles,
                    backgroundColor: "lightgrey",
                    overflow: "hidden",
                    position: "absolute",
                    display: document.content && !document.loading ? "flex" : "none"
                }}>
                <div ref={viewer} style={{
                    position: "relative", width: "100%", height: "100%",
                    // transform: 'perspective(600px)',
                    // x: spring.x, y: spring.y, scale: spring.scale + spring.zoom,
                    // rotateX: spring.rotateX, rotateY: spring.rotateY, rotateZ: spring.rotateZ,
                }} />
            </div>
            <div style={{
                display: progress < 100 ? "block" : "none",
                position: "absolute",
                width: "100%",
                top: "0",
                left: "0",
                right: "0"
            }}>
                <LinearProgress variant="determinate" value={progress} />
            </div>
            <div style={{
                position: "absolute", right: 0, top: 0,
                height: "100%", paddingTop: "13px", paddingBottom: "13px"
            }}>
                {pdfViewer?.pagesCount ?
                    <StyledSlider
                        orientation="vertical"
                        min={1}
                        max={pdfViewer.pagesCount}
                        // getAriaValueText={valuetext}
                        value={pdfViewer.pagesCount - activeDocumentPage + 1}
                        track="inverted"
                        marks={marks.map(m => ({ value: pdfViewer.pagesCount - m.value + 1 }))}
                        // aria-labelledby="vertical-slider"
                        onChange={(e, v) => setActiveDocumentPage(pdfViewer.pagesCount - v + 1)}
                    />
                    : ""}
            </div>
        </div>
    );
};

export default PDFViewer;
