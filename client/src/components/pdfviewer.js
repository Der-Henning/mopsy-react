import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from "react";
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry';
import * as pdfjsViewer from 'pdfjs-dist/legacy/web/pdf_viewer';
import * as pdfjs from "pdfjs-dist/legacy/build/pdf";
import 'pdfjs-dist/legacy/web/pdf_viewer.css';
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

const PDFViewer = (props) => {
    const viewerContainer = useRef(null);
    const viewer = useRef(null);

    const {
        activeDocument,
        highlighting
    } = useSearchData();

    const [document, _setDocument] = useState({
        loading: true,
        content: null,
    });
    const [pdfViewerLoaded, _setPdfViewerLoaded] = useState(false);
    const [progress, _setProgress] = useState(0);
    const [swipeStart, _setSwipeStart] = useState(0);
    const [swipeStop, _setSwipeStop] = useState(0);
    const [marks, _setMarks] = useState([]);
    const [currentDoc, _setCurrentDoc] = useState(0);
    const [currentPage, _setCurrentPage] = useState(parseInt(props.page));

    useEffect(() => {
        if (highlighting?.[activeDocument]?.pages) {
            // _setMarks(() => Object.keys(highlighting[activeDocument]["pages"]).map(p => ({ value: p })))
            _setMarks(() => highlighting[activeDocument]["pages"].map(p => ({ value: p[0] })))
        }
    }, [activeDocument, highlighting])

    useEffect(() => {
        _setCurrentPage(parseInt(props.page));
    }, [props.page])

    const getPageCount = useMemo(() => {
        if (!document.content) return 0
        return document.content.reduce((total, doc) => (total + doc.numPages), 0)
    }, [document])

    const _initPdfViewer = useCallback(() => {
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
            _setPdfViewerLoaded(true);
        }
    }, [])

    const _highlightMatches = useCallback((document, page) => {
        const textLayer = pdfViewer._pages[page - 1]?.textLayer?.textLayerDiv;
        // const highlights = highlighting?.[document]?.pages?.[page];
        const highlights = highlighting?.[document]?.pages?.find(p => p[0] === page);
        if (textLayer && highlights && highlights[1] && !textLayer.highlighted) {
            textLayer.highlighted = true
            let phrases = highlights[1].map(h => (
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
        if (content && pdfViewerLoaded && currentPage <= getPageCount) {
            try {
                const docID = activeDocument;
                const [docNum, pageNum] = (() => {
                    var pageSum = content[0].numPages
                    var docNum = 0
                    var pageSums = 0
                    while (pageSum < currentPage) {
                        pageSums += content[docNum].numPages
                        docNum += 1
                        pageSum += content[docNum].numPages
                    }
                    return [docNum, currentPage - pageSums]
                })()
                if (currentDoc !== docNum) {
                    _setCurrentDoc(docNum)
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
                            _highlightMatches(docID, pageNum);
                        })
                    }
                }
            } catch (e) { }
        }
    }, [document, activeDocument, pdfViewerLoaded, _highlightMatches, getPageCount, currentDoc, currentPage])

    const _loadDocument = useCallback(async () => {
        _setDocument(() => ({
            loading: true,
            content: null
        }));
        if (props.url) {
            try {
                if (loadingTask) loadingTask.destroy();
                loadingTask = pdfjs.getDocument({
                    url: props.url,
                    cMapUrl: CMAP_URL,
                    cMapPacked: CMAP_PACKED,
                });
                loadingTask.onProgress = (data) => {
                    _setProgress(data.loaded / data.total * 100);
                }
                var docs = [await loadingTask.promise]
                try {
                    const attachements = await docs[0].getAttachments()
                    if (attachements) {
                        for (var attachement in attachements) {
                            try {
                                docs = [...docs, await pdfjs.getDocument({
                                    data: attachements[attachement].content,
                                    cMapUrl: CMAP_URL,
                                    cMapPacked: CMAP_PACKED
                                }).promise]
                            } catch (e) { console.log(e) }
                        }
                    }
                } catch (e) { console.log(e) }
                _setProgress(100)
                _setDocument(() => ({
                    loading: false,
                    content: docs
                }));
                _setProgress(0);
            } catch (e) {
                console.log(e)
                _setDocument(() => ({
                    loading: false,
                    content: null
                }));
            }
        }
    }, [props.url]);

    const _goUp = useCallback(() => {
        _setCurrentPage((() => {
            if (currentPage - 1 > 0) return currentPage - 1
            return currentPage
        })());
    }, [currentPage])

    const _goDown = useCallback(() => {
        _setCurrentPage((() => {
            if (currentPage + 1 <= getPageCount) return currentPage + 1
            return currentPage
        })());
    }, [currentPage, getPageCount])

    const _wheelEvent = useCallback((e) => {
        if (e.deltaY < 0) _goUp()
        if (e.deltaY > 0) _goDown()
    }, [_goUp, _goDown])

    const _startSwipe = useCallback((e) => {
        const { clientY } = e.targetTouches[0];
        _setSwipeStart(clientY);
        _setSwipeStop(clientY);
    }, [])

    const _moveSwipe = useCallback((e) => {
        const { clientY } = e.targetTouches[0];
        _setSwipeStop(clientY);
    }, [])

    const _stopSwipe = useCallback(() => {
        if (swipeStop - swipeStart > 150) _goUp()
        if (swipeStop - swipeStart < -150) _goDown()
    }, [swipeStart, swipeStop, _goUp, _goDown])

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
        _initPdfViewer();
    }, [_initPdfViewer])

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
                onWheel={(e) => _wheelEvent(e)}
                onTouchStart={e => _startSwipe(e)}
                onTouchMove={e => _moveSwipe(e)}
                onTouchEnd={() => _stopSwipe()}
                style={{
                    ...styles,
                    backgroundColor: "lightgrey",
                    overflow: "hidden",
                    position: "absolute",
                    display: document.content && !document.loading ? "flex" : "none"
                }}>
                <div ref={viewer}
                    style={{
                        position: "relative", width: "100%", height: "100%",
                    }}
                />
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
                        value={getPageCount - currentPage + 1}
                        track="inverted"
                        marks={marks.map(m => ({ value: getPageCount - m.value + 1 }))}
                        // aria-labelledby="vertical-slider"
                        onChange={(e, v) => _setCurrentPage(getPageCount - v + 1)}
                    />
                    : ""}
            </div>
        </div>
    );
};

export default PDFViewer;
