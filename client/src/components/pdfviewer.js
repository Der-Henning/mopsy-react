import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from "react";
import pdfjsWorker from 'pdfjs-dist/es5/build/pdf.worker.entry';
import * as pdfjsViewer from 'pdfjs-dist/es5/web/pdf_viewer';
import * as pdfjs from "pdfjs-dist/es5/build/pdf";
import 'pdfjs-dist/es5/web/pdf_viewer.css';
import { LinearProgress, Slider } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { useSearchData } from "../context";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
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
    const [currentDoc, setCurrentDoc] = useState(0);

    useEffect(() => {
        if (highlighting?.[activeDocument]?.pages) {
            setMarks(() => Object.keys(highlighting[activeDocument]["pages"]).map(p => ({ value: p })))
        }
    }, [activeDocument, highlighting])

    const getPageCount = useMemo(() => {
        if (!document.content) return 0
        return document.content.reduce((total, doc) => (total + doc.numPages), 0)
    }, [document])

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
        if (content && pdfViewerLoaded && activeDocumentPage <= getPageCount) {
            try {
                const docID = activeDocument;
                const [docNum, pageNum] = (() => {
                    var pageSum = content[0].numPages
                    var docNum = 0
                    var pageSums = 0
                    while (pageSum < activeDocumentPage) {
                        pageSums += content[docNum].numPages
                        docNum += 1
                        pageSum += content[docNum].numPages
                    }
                    return [docNum, activeDocumentPage - pageSums]
                })()
                if (currentDoc !== docNum) {
                    setCurrentDoc(docNum)
                } else {
                    const pdfPage = await content[docNum].getPage(pageNum);
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
                }
            } catch (e) { console.log(e) }
        }
    }, [document, activeDocument, activeDocumentPage, pdfViewerLoaded, highlightMatches, getPageCount, currentDoc])

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
                var docs = [await loadingTask.promise]

                const attachements = await docs[0].getAttachments()
                if (attachements) {
                    docs = [...docs, ...(await Promise.all(Object.keys(attachements).map(
                        async attachment => {
                            try {
                                return await pdfjs.getDocument({
                                    data: attachements[attachment].content,
                                    cMapUrl: CMAP_URL,
                                    cMapPacked: CMAP_PACKED
                                }).promise
                            } catch (e) { console.log(e) }
                        }
                    )))]
                }
                setProgress(100)
                setDocument(() => ({
                    loading: false,
                    content: docs
                }));
                setProgress(0);
            } catch (e) {
                console.log(e)
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
                if (activeDocumentPage + 1 <= getPageCount) return activeDocumentPage + 1
                return activeDocumentPage
            })());
        }
    }, [setActiveDocumentPage, activeDocumentPage, getPageCount])

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

    useEffect(() => {
        _loadDocument();
        return () => {
            if (loadingTask) loadingTask.destroy();
        }
    }, [_loadDocument]);

    useEffect(() => {
        if (document.content && pdfViewerLoaded) {
            pdfViewer.setDocument(document.content[currentDoc]);
            pdfLinkService.setDocument(document.content[currentDoc], null);
        }
    }, [document, pdfViewerLoaded, currentDoc])

    useLayoutEffect(() => {
        initPdfViewer();
    }, [initPdfViewer])

    useEffect(() => {
        _setPage();
    }, [_setPage])

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <div style={{ ...styles, display: document.loading ? "flex" : "none" }}>
                <span>Loading ...</span>
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
                {pdfViewer ?
                    <StyledSlider
                        orientation="vertical"
                        min={1}
                        max={getPageCount}
                        // getAriaValueText={valuetext}
                        value={getPageCount - activeDocumentPage + 1}
                        track="inverted"
                        marks={marks.map(m => ({ value: getPageCount - m.value + 1 }))}
                        // aria-labelledby="vertical-slider"
                        onChange={(e, v) => setActiveDocumentPage(getPageCount - v + 1)}
                    />
                    : ""}
            </div>
        </div>
    );
};

export default PDFViewer;
