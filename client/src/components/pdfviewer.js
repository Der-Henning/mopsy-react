import React, { useState, useEffect, useCallback } from "react";
import Axios from "axios";
import { useGlobal } from "../context";

const styles = {
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const PDFViewer = (props) => {
  const { token } = useGlobal();
  const { url, format, width, height, page } = props;

  const [state, setState] = useState({
    pdfExists: false,
    loading: true,
    document: null,
  });

  const _loadDocument = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      pdfExists: false,
      loading: true,
      document: null,
    }));
    if (url) {
      Axios.get(url, {
        params: {
          format: format,
        },
        responseType: "arraybuffer",
        headers: { "x-access-token": token },
      })
        .then((res) => {
          setState((prevState) => ({
            ...prevState,
            pdfExists: true,
            loading: false,
            document: URL.createObjectURL(
              new Blob([res.data], {
                type: res.headers["content-type"],
              })
            ),
          }));
        })
        .catch((err) => {
          setState((prevState) => ({
            ...prevState,
            pdfExists: false,
            loading: false,
            document: null,
          }));
        });
    }
  }, [format, token, url]);

  const _getPdfFrame = useCallback(() => {
    const { pdfExists, loading, document } = state;
    if (loading) return <div style={styles}>Loading ...</div>;
    if (!pdfExists) return <div style={styles}>PDF missing!</div>;

    return (
      <iframe
        title="PDFViewer"
        src={`${document}${
          format === "txt"
            ? `#${page}`
            : `#toolbar=0&navpanes=0&view=Fit&page=${page}`
        }`}
        style={{ width: "100%", height: "100%", border: "0" }}
      />
    );
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
