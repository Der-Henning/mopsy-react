import React from "react";
import { useLocation } from "react-router-dom";
import { PDFViewer } from "../components";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Viewer(props) {
  const { pdfHeight } = props;
  const url = useQuery().get("url");
  const page = useQuery().get("page");
  return (
    <PDFViewer 
        url={url}
        page={page}
        width={"100%"}
        height={pdfHeight}
    />
  );
}