import React, { Component } from "react";
import { useLocation } from "react-router-dom";
import Axios from "axios";
import { Pagination, Spinner } from "react-bootstrap";
import { Results, PDFViewer, Searchbar } from "../components";
import { withRouter } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Search = withRouter((props) => {
  const searchText = useQuery().get("q");
  return (
    <Main
      searchText={searchText}
      {...props}
    />
  );
});

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFetching: false,
      data: null,
      page: 1,
      dpp: 10,
      activeDoc: null,
      pdfPage: 1,
      overlay: true,
    };
  }

  fetchData = () => {
    const { page } = this.state;
    const { token, api, searchText } = this.props;

    if (searchText) {
      this.setState({ isFetching: true });
      Axios.get(
        api + "/search",
        {
          params: { q: searchText, page: page },
          headers: { "x-access-token": token }
        }
      ).then(res => {
        this.setState({ data: res.data, isFetching: false });
      });
    } else this.setState({ data: null });
  };

  fetchHighlights = docId => {
    const { data } = this.state;
    const { api, token, searchText } = this.props;

    Axios.get(
      api + "/search/" + docId,
      {
        params: { q: searchText },
        headers: { "x-access-token": token }
      }
    ).then(res => {
      data.highlighting[docId] = {
        ...data.highlighting[docId],
        ...res.data.highlighting[docId],
        fetched: true
      }
      this.setState({
        data: data
      })
    })
  }

  setActiveDoc = docId => {
    this.setState({
      activeDoc: docId,
      pdfPage: 1
    });
    if (docId) this.fetchHighlights(docId);
  };

  setActivePage = page => {
    const { showPdfViewer } = this.props;
    const { activeDoc } = this.state;
    this.setState({ pdfPage: page });
    if (!showPdfViewer) 
      this.props.history.push("/viewer?url=" + this.activeDocURL(activeDoc) + "&page=" + page);
  };

  setFavorite = (index, state) => {
    var { data } = this.state;
    data.response.docs[index].isFavorite = state;
    this.setState({data});
  }

  componentDidUpdate(prevProps) {
    if (prevProps.searchText !== this.props.searchText) {
      this.setState({ page: 1}, () => {
        this.fetchData();
      })
    }
  }

  componentDidMount() {
    this.fetchData();
  }

  navTo = e => {
    const newPage = Number(e.target.id);
    if (newPage > 0 && newPage !== this.state.page) {
      this.setState({ page: newPage }, () => {
        this.fetchData();
      });
    }
  };

  pagination = () => {
    const { data, page, dpp } = this.state;
    if (data) {
      const pages = Math.ceil(data.response.numFound / dpp);
      if (pages <= 1) return;
      const max = 8;
      const start = page - 4 < 1 ? 1 : page - 4;
      const end = start + max > pages ? pages : start + max;
      let items = [];
      for (let number = start; number <= end; number++) {
        items.push(
          <Pagination.Item
            key={number}
            id={number}
            active={number === page}
            onClick={this.navTo}
          >
            {number}
          </Pagination.Item>
        );
      }

      return (
        <Pagination 
          size="sm" 
          className="justify-content-center" 
          style={{padding: "10px", margin: "0"}}
        >
          <Pagination.First id={1} onClick={this.navTo}/>
          <Pagination.Prev
            id={page - 1 > 0 ? page - 1 : 1}
            onClick={this.navTo}
          />
          {items}
          <Pagination.Next
            id={page + 1 > pages ? pages : page + 1}
            onClick={this.navTo}
          />
          <Pagination.Last id={pages} onClick={this.navTo} />
        </Pagination>
      );
    } else return;
  };

  status = () => {
    var { data, page } = this.state;
    if (data) {
      return (
        <small style={{padding: "5px"}}>
          Seite {page} von {data.response.numFound} Treffern in{" "}
          {data.responseHeader.QTime} ms
        </small>
      );
    }
  };

  body = () => {
    const { data, isFetching } = this.state;
    const { api, token } = this.props;
    if (isFetching)
      return (
        <div style={{
          display: "flex", 
          height: "100%",
          justifyContent: "center",
          paddingTop: "50px"
        }}
        >
          <Spinner animation="border" variant="primary" />
        </div>
      );
    return (
      <React.Fragment>
        {this.status()}
        <Results
          api={api}
          token={token}
          data={data}
          setActiveDoc={this.setActiveDoc}
          activeDoc={this.state.activeDoc}
          setActivePage={this.setActivePage}
          setFavorite={this.setFavorite}
        />
        {this.pagination()}
      </React.Fragment>
    );
  };

  activeDocURL = () => {
    const { activeDoc, data } = this.state;
    if (activeDoc && data) {
      let doc = data.response.docs.filter(doc => {
        return doc.id === activeDoc;
      });
      return doc.length > 0 ? doc[0].link : null;
    }
    return null;
  };

  render() {
    const { isFetching } = this.state;
    const { pdfWidth, pdfHeight, api, token, searchText, showPdfViewer } = this.props;
    if (!showPdfViewer) return (
      <div>
        <div style={{padding: "10px"}}>
          <Searchbar 
            searchText={searchText} 
            api={api}
            token={token}
          />
        </div>
        {this.body()}
      </div>
    )
    return (
      <div style={{
        display: "flex",
        height: pdfHeight, 
        width: "100%"
      }}>
        <div style={{overflowY: "auto", height: "100%", width: "100%"}}>
          <div style={{padding: "10px"}}>
            <Searchbar 
              searchText={searchText} 
              api={api}
              token={token}
            />
          </div>
          {this.body()}
        </div>
        <div style={{minWidth: pdfWidth}}>
         {!isFetching ? 
          <PDFViewer 
            url={this.state.activeDoc ? this.activeDocURL() : null}
            page={this.state.pdfPage}
            width={pdfWidth}
            height={pdfHeight}
          /> : ""}
        </div>
      </div>
    );
  }
}

export default Search;