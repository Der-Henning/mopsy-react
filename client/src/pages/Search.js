import React, { Component } from 'react';
import { useLocation } from 'react-router-dom';
import Searchbar from '../components/searchbar';
import Cookies from 'universal-cookie';
import Axios from 'axios';
import qs from 'qs';
import Results from '../components/results';
import { Pagination, Spinner } from 'react-bootstrap';
import styles from '../styles/search.module.css';
import PDFOverlay from '../components/pdfoverlay';
import PDFJs from '../components/pdfjs';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Search(props) {
  const searchText = useQuery().get('q');
  return (
    <Main searchText={searchText}/>
  );
}

class Main extends Component {
  constructor(props) {
    super(props);
    const cookies = new Cookies();
    this.state = {
      isFetching: false,
      token: cookies.get('token'),
      data: null,
      page: 1,
      dpp: 10,
      activeDoc: null,
      overlay: true
    };
    this.navTo = this.navTo.bind(this);
    this.setActiveDoc = this.setActiveDoc.bind(this);
  }

  fetchData() {
    const { token, page, dpp } = this.state;
    const { searchText } = this.props;
    if (searchText) {
      this.setState({isFetching: true});
      Axios.post('/api/search', 
        qs.stringify({q: searchText, start: (page - 1) * dpp, rows: dpp})
      ,{
        headers: {'x-access-token': token}
      }).then(res => {
        this.setState({data: res.data, isFetching: false});
      })
    } else this.setState({data: null});
  }

  setActiveDoc(docId) {
    this.setState({activeDoc: docId});
  }

  componentDidUpdate(prevProps) {
    if (this.props.searchText !== prevProps.searchText) {
      this.setState({page: 1}, () => {
        this.fetchData();
      });
    }
  }

  componentDidMount() {
    this.fetchData();
  }

  navTo(e) {
    const newPage = Number(e.target.id);
    if (newPage > 0 && newPage !== this.state.page) {
      this.setState({page: newPage}, () => {
        this.fetchData();
      });
    }
  }

  pagination() {
    const { data, page, dpp } = this.state;
    if (data) {
      const pages = Math.ceil(data.response.numFound / dpp);
      if (pages <= 1) return;
      const max = 8;
      const start = (page - 4 < 1) ? 1 : page - 4;
      const end = (start + max > pages) ? pages : start + max;
      let items = [];
      for (let number = start; number <= end; number++) {
        items.push(
          <Pagination.Item key={number} id={number} active={number === page} onClick={this.navTo}>
            {number}
          </Pagination.Item>
        );
      }
  
      return(
        <Pagination className={styles.posright} size='sm'>
          <Pagination.First id={1} onClick={this.navTo}/>
          <Pagination.Prev id={(page - 1 > 0) ? page - 1 : 1} onClick={this.navTo}/>
          {items}
          <Pagination.Next id={(page + 1 > pages) ? pages : page + 1} onClick={this.navTo}/>
          <Pagination.Last id={pages} onClick={this.navTo}/>
        </Pagination>
      )
    } else return;
  }

  status() {
    var {data, page} = this.state;
    if (data) {
      return(
        <div className={styles.status}>Seite {page} von {data.response.numFound} Treffern in {data.responseHeader.QTime} ms</div>
      )
    }
  }

  body(){
    const { data, isFetching } = this.state;
    if (isFetching) return(
      <div className={styles.spinner}>
        <Spinner animation="border"  variant="primary"/>
      </div>
    );
    return(
      <React.Fragment>
        {this.pagination()}
        {this.status()}
        <Results data={data} setActiveDoc={this.setActiveDoc} activeDoc={this.state.activeDoc} />
      </React.Fragment>
    )
  }

  render() {
    const { searchText } = this.props;
    if (this.state.overlay) return(<PDFJs url={"/proxy?url=http://localhost/dvtest/A1_275_3_8901.pdf"} />);
    return (
      <div className={styles.main}>
        <Searchbar 
          searchText={searchText}
        />
        {this.body()}
      </div>
    )
  }
}