import React, { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { PDFViewer } from "../components";
import { useGlobal } from "../context";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Viewer = () => {
  const url = useQuery().get("url");
  const page = useQuery().get("page");
  const { dimensions } = useGlobal();

  const render = useCallback(() => {
    return (
      <div style={{ width: dimensions.windowWidth, height: dimensions.pdfHeight }}>
        <PDFViewer
          url={url}
          page={page}
          format={"pdf"}
          fullscreen={true}
        />
      </div>
    );
  }, [dimensions, url, page])

  return render();
};

export default Viewer;
