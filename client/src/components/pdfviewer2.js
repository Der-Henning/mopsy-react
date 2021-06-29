import React, { useEffect, useState, useCallback } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { useSearchData, useGlobal } from "../context";
import pdfjsWorker from 'react-pdf/node_modules/pdfjs-dist/build/pdf.worker.entry';
import { LinearProgress, Slider } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

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

const PDFViewer = props => {
    const [numPages, setNumPages] = useState(1);
    const [numsPages, setNumsPages] = useState({});
    const [progress, setProgress] = useState(0);
    const [marks, setMarks] = useState([]);
    const [pageNum, setPageNum] = useState(1);
    const [attachements, setAttachements] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [docID, setDocID] = useState(null);
    const [currentDoc, setCurrentDoc] = useState(0);

    const { dimensions } = useGlobal();

    const {
        activeDocument,
        activeDocumentPage,
        setActiveDocumentPage,
        activeDocumentData,
        highlighting
    } = useSearchData();

    useEffect(() => {
        if (activeDocument) {
            setDocuments([activeDocumentData().link])
            setCurrentDoc(0)
        }
    }, [activeDocument])

    useEffect(() => {
        if (activeDocumentPage > numPages) {
            setCurrentDoc(currentDoc + 1)
        } else {
            var docId = 0
            var pageNum = activeDocumentPage
            while (docId < currentDoc) {
                pageNum -= numsPages[docId]
                docId++
            }
            setPageNum(pageNum)
        }
    }, [numsPages, currentDoc, activeDocumentPage])

    useEffect(() => {
        if (highlighting?.[activeDocument]?.pages) {
            setMarks(() => Object.keys(highlighting[activeDocument]["pages"]).map(p => ({ value: p })))
        }
    }, [activeDocument, highlighting])

    const onAttachementLoad = useCallback((pdf, id) => {
        console.log(id)
        setNumsPages(prevNums => prevNums[id] = pdf.numPages);
    }, [])

    const onDocumentLoadSuccess = useCallback(async pdf => {
        if (currentDoc === 0) {
            setNumsPages({ 0: pdf.numPages });
            var docs = [];
            const attachements = await pdf.getAttachments();
            if (attachements) {
                var attachementId = 1;
                for (const attachement in attachements) {
                    // docs = [...docs, attachements[attachement]]
                    console.log(attachement)
                    docs = [
                        ...docs,
                        attachements[attachement].content
                    ]
                    attachementId++
                }
            }
            // setAttachements(docs);
            setDocuments(prevDocs => [...prevDocs, ...docs])
            setNumPages(prevNum => (prevNum + pdf.numPages))
            setProgress(100);
        } else {
            setNumsPages(prevNums => ({...prevNums, [currentDoc]: pdf.numPages}));
        }
    }, [currentDoc])

    const onDocumentLoadProgress = useCallback(({ loaded, total }) => {
        setProgress(100 * loaded / total);
    }, [])

    const onDocumentItemClick = useCallback(({ pageNumber }) => {
        setActiveDocumentPage(pageNumber)
    }, [setActiveDocumentPage])

    // useEffect(() => {
    //     if (activeDocument) {
    //         setDocuments([
    //             props => <Document
    //                 file={activeDocumentData().link}
    //                 // onLoadSuccess={onDocumentLoadSuccess}
    //                 onLoadProgress={onDocumentLoadProgress}
    //                 onItemClick={onDocumentItemClick}
    //             >{props.children}</Document>
    //         ])
    //         setCurrentDoc(0)
    //     }
    // }, [activeDocument, activeDocumentData, onDocumentLoadSuccess, onDocumentLoadProgress, onDocumentItemClick])

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
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
            <div style={styles}>
                <div>
                    {/* {
                        documents ? React.createElement(documents[currentDoc], {}, <Page pageNumber={activeDocumentPage} width={dimensions.pdfWidth} />) : null
                    } */}
                    <Document
                        file={documents[currentDoc]}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadProgress={onDocumentLoadProgress}
                        onItemClick={onDocumentItemClick}
                    >
                        <Page pageNumber={pageNum} width={dimensions.pdfWidth} />
                    </Document>
                </div>
                {/* {attachements ? attachements.map((attachement, id) => (
                    <div>
                        <Document 
                            file={{ data: attachement.content }} 
                            onLoadSuccess={(pdf) => onAttachementLoad(pdf, id)}
                            >
                            <Page pageNumber={1} width={dimensions.pdfWidth} />
                        </Document>
                    </div>
                )) : null} */}
            </div>
            <div style={{
                position: "absolute", right: 0, top: 0,
                height: "100%", paddingTop: "13px", paddingBottom: "13px"
            }}>
                <StyledSlider
                    orientation="vertical"
                    min={1}
                    max={numPages}
                    // getAriaValueText={valuetext}
                    value={numPages - activeDocumentPage + 1}
                    track="inverted"
                    marks={marks.map(m => ({ value: numPages - m.value + 1 }))}
                    // aria-labelledby="vertical-slider"
                    onChange={(e, v) => setActiveDocumentPage(numPages - v + 1)}
                />
            </div>
            {/* <p>Page {pageNumber} of {numPages}</p> */}
        </div>
    );
}

export default PDFViewer;