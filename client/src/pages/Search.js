import React, { useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Pagination, Spinner } from "react-bootstrap";
import { Results, PDFViewer, Searchbar } from "../components";
import { withRouter } from "react-router-dom";
import { useGlobal, useSearchData } from "../context";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Search = (props) => {
  const q = useQuery().get("q");
  const page = parseInt(useQuery().get("page")) || 1;

  const { dimensions } = useGlobal();
  const {
    activeDocument,
    info,
    params,
    isFetchingDocs,
    getDocumentData,
    activeDocumentData,
    activeDocumentPage,
    setSearchText,
    setPage,
    setActiveDocumentPage,
  } = useSearchData();

  useEffect(() => {
    setSearchText(q);
  }, [q, setSearchText]);

  useEffect(() => {
    setPage(page);
  }, [page, setPage]);

  const _setPage = useCallback(
    (page) => {
      props.history.push("/search?q=" + params.searchText + "&page=" + page);
    },
    [props.history, params.searchText]
  );

  const setPdfPage = useCallback(
    (page) => {
      setActiveDocumentPage(page);
      if (!dimensions.showPdfViewer)
        props.history.push(
          "/viewer?url=" +
            getDocumentData(activeDocument).link +
            "&page=" +
            page
        );
    },
    [
      activeDocument,
      setActiveDocumentPage,
      dimensions.showPdfViewer,
      props.history,
      getDocumentData,
    ]
  );

  const _status = useCallback(() => {
    return (
      <small style={{ padding: "5px" }}>
        Seite {params.page} von {info.numFound} Treffern in {info.QTime} ms
      </small>
    );
  }, [info, params.page]);

  const _pagination = useCallback(() => {
    const pages = Math.ceil(info.numFound / params.dpp);
    if (pages <= 1) return;
    const max = 8;
    const start = params.page - 4 < 1 ? 1 : params.page - 4;
    const end = start + max > pages ? pages : start + max;
    let items = [];
    for (let number = start; number <= end; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === params.page}
          onClick={() => _setPage(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    return (
      <Pagination
        size="sm"
        className="justify-content-center"
        style={{ padding: "10px", margin: "0" }}
      >
        <Pagination.First onClick={() => _setPage(1)} />
        <Pagination.Prev
          onClick={() => _setPage(params.page - 1 > 0 ? params.page - 1 : 1)}
        />
        {items}
        <Pagination.Next
          onClick={() =>
            _setPage(params.page + 1 > pages ? pages : params.page + 1)
          }
        />
        <Pagination.Last onClick={() => _setPage(pages)} />
      </Pagination>
    );
  }, [info, params.dpp, params.page, _setPage]);

  const _body = useCallback(() => {
    if (isFetchingDocs)
      return (
        <div
          style={{
            display: "flex",
            height: "100%",
            justifyContent: "center",
            paddingTop: "50px",
          }}
        >
          <Spinner animation="border" variant="primary" />
        </div>
      );
    return (
      <React.Fragment>
        {_status()}
        <Results
          setPdfPage={setPdfPage}
          // setFavorite={this.setFavorite}
        />
        {_pagination()}
      </React.Fragment>
    );
  }, [_pagination, _status, isFetchingDocs, setPdfPage]);

  if (!dimensions.showPdfViewer)
    return (
      <div>
        <div style={{ padding: "10px" }}>
          <Searchbar q={params.searchText} />
        </div>
        {_body()}
      </div>
    );
  return (
    <div
      style={{
        display: "flex",
        height: dimensions.pdfHeight,
        width: "100%",
      }}
    >
      <div style={{ overflowY: "auto", height: "100%", width: "100%" }}>
        <div style={{ padding: "10px" }}>
          <Searchbar q={params.searchText} />
        </div>
        {_body()}
      </div>
      <div style={{ minWidth: dimensions.pdfWidth }}>
        {!isFetchingDocs ? (
          <PDFViewer
            url={activeDocument ? activeDocumentData().link : null}
            page={activeDocumentPage}
            width={dimensions.pdfWidth}
            height={dimensions.pdfHeight}
            format={"pdf"}
          />
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default withRouter(Search);
