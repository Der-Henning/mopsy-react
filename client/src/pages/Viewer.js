import React from "react";
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

  return (
    <PDFViewer
      url={url}
      page={page}
      width={"100%"}
      height={dimensions.pdfHeight}
    />
  );
};

export default Viewer;
