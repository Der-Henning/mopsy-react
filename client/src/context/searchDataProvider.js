import React, { useState, useContext, useCallback, useEffect } from "react";
import Axios from "axios";
import { useGlobal } from "../context";

const Context = React.createContext(undefined);

const SearchDataProvider = ({ children }) => {
  const { api, token } = useGlobal();

  const [documents, setDocuments] = useState([]);
  const [highlighting, setHighlighting] = useState({});
  const [info, setInfo] = useState({ QTime: null, numFound: null });
  const [isFetchingDocs, setIsFetchingDocs] = useState(false);
  const [isFetchingHighs, setIsFetchingHighs] = useState(false);
  const [activeDocument, setActiveDocument] = useState(null);
  const [activeDocumentPage, setActiveDocumentPage] = useState(1);
  const [params, setParams] = useState({
    searchText: null,
    page: 1,
    dpp: 10,
  });

  const setData = useCallback(
    (data) => {
      const docs = data?.response?.docs || [];
      const highs = data?.highlighting || {};
      const info = {
        QTime: data?.responseHeader?.QTime,
        numFound: data?.response?.numFound,
      };
      setDocuments(() => [...docs]);
      setHighlighting(() => ({ ...highs }));
      setInfo(info);
      setActiveDocumentPage(1);
      if (docs.length > 0) setActiveDocument(docs[0].id);
      if (docs && params.page === 1)
        setParams((prevParams) => ({
          ...prevParams,
          dpp: docs.length,
        }));
    },
    [params.page]
  );

  const fetchDocuments = useCallback(() => {
    if (params.searchText && token) {
      setIsFetchingDocs(true);
      Axios.get(api + "/search", {
        params: { q: params.searchText, page: params.page },
        headers: { "x-access-token": token },
      })
        .then((res) => {
          setData(res.data);
        })
        .catch((err) => {
          setData(null);
          console.log(err);
        })
        .finally(() => {
          setIsFetchingDocs(false);
        });
    } else setData(null);
  }, [params.searchText, params.page, token, api, setData]);

  const fetchHighlights = useCallback(() => {
    if (
      params.searchText &&
      activeDocument &&
      token &&
      !highlighting[activeDocument]?.fetched
    ) {
      setIsFetchingHighs(true);
      Axios.get(api + "/search/" + activeDocument, {
        params: { q: params.searchText },
        headers: { "x-access-token": token },
      })
        .then((res) => {
          const highs = res?.data?.highlighting;
          setHighlighting((prevHighlighting) => ({
            ...prevHighlighting,
            [activeDocument]: {
              ...prevHighlighting[activeDocument],
              ...highs[activeDocument],
              fetched: true,
            },
          }));
        })
        .finally(() => {
          setIsFetchingHighs(false);
        });
    }
  }, [api, token, params.searchText, activeDocument, highlighting]);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const setPage = useCallback((page) => {
    setParams((prevParams) => ({ ...prevParams, page }));
  }, []);

  const setSearchText = useCallback(
    (searchText) => {
      if (searchText !== params.searchText)
        setParams((prevParams) => ({ ...prevParams, searchText, page: 1 }));
    },
    [params.searchText]
  );

  const getDocumentData = useCallback(
    (docId) => {
      let doc = documents.filter((doc) => {
        return doc.id === docId;
      });
      return doc.length > 0 ? doc[0] : null;
    },
    [documents]
  );

  const activeDocumentData = useCallback(() => {
    console.log(activeDocument);
    if (activeDocument) {
      let doc = documents.filter((doc) => {
        return doc.id === activeDocument;
      });
      return doc.length > 0 ? doc[0] : null;
    }
    return null;
  }, [activeDocument, documents]);

  const setFavorite = useCallback((index, value) => {
    setDocuments((prevDocuments) =>
      prevDocuments.map((doc, i) => {
        if (i !== index) {
          return doc;
        }
        return {
          ...doc,
          isFavorite: value,
        };
      })
    );
  }, []);

  return (
    <Context.Provider
      value={{
        documents,
        highlighting,
        activeDocument,
        activeDocumentPage,
        info,
        params,
        isFetchingDocs,
        isFetchingHighs,
        activeDocumentData,
        getDocumentData,
        setActiveDocument,
        setActiveDocumentPage,
        setSearchText,
        setPage,
        setFavorite,
      }}
    >
      {children}
    </Context.Provider>
  );
};

const useSearchData = () => {
  return useContext(Context);
};

export { SearchDataProvider, useSearchData };
