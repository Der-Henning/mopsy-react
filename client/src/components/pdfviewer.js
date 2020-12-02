import React, { useState, useEffect, useCallback } from "react";
import Axios from "axios";
import { useGlobal } from "../context";
// import pdfjs from "pdfjs-dist";


const styles = {
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const PDFViewer = (props) => {
  const { token } = useGlobal();
  const { url, format, width, height, page, fullscreen } = props;

  const [state, setState] = useState({
    pdfExists: false,
    loading: true,
    document: null,
  });


  const _loadDocument = useCallback(async () => {
    
    const pdfjs = await import('pdfjs-dist/build/pdf');
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
    
    pdfjs.workerSrc = pdfjsWorker;
    setState((prevState) => ({
      ...prevState,
      pdfExists: false,
      loading: true,
      document: null,
    }));
    if (url) {
      console.log(url);
      pdfjs.getDocument(url).promise
        .then(doc => {
          setState((prevState) => ({
            ...prevState,
            pdfExists: true,
            loading: false,
            document: doc
          }));
        });
      // Axios.get(url, {
      //   params: {
      //     format: format,
      //   },
      //   responseType: "arraybuffer",
      //   headers: { "x-access-token": token },
      // })
      //   .then((res) => {
      //     setState((prevState) => ({
      //       ...prevState,
      //       pdfExists: true,
      //       loading: false,
      //       document: window.URL.createObjectURL(
      //         new Blob([res.data], {
      //           type: res.headers["content-type"],
      //         })
      //       ),
      //     }));
      //   })
      //   .catch((err) => {
      //     setState((prevState) => ({
      //       ...prevState,
      //       pdfExists: false,
      //       loading: false,
      //       document: null,
      //     }));
      //   });
    }
  }, [format, token, url]);

  const _getPdfFrame = useCallback(() => {
    const { pdfExists, loading, document } = state;
    if (loading) return <div style={styles}>Loading ...</div>;
    if (!pdfExists) return <div style={styles}>PDF missing!</div>;
    //if (!window.Blob) return <div style={styles}>Blob not supported!</div>

    return (
      <canvas id="pdf">
        {document.getPage(page)}
      </canvas>
    )

    //if (fullscreen) window.open(document, "_self");
    // return (
    //   <iframe
    //     title="PDFViewer"
    //     src={`${url}${
    //       format === "txt"
    //         ? `#${page}`
    //         : `#toolbar=0&navpanes=0&view=Fit&page=${page}`
    //     }`}
    //     style={{ width: "100%", height: "100%", border: "0" }}
    //   />
    // );
  }, [state, format, page]);

  useEffect(() => {
    _loadDocument();
  }, [_loadDocument, page]);

  return (
    <div style={{ width: width, height: height }}>
      {url ? _getPdfFrame() : ""}
    </div>
  );
};

export default PDFViewer;
