import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Table, Spinner } from 'react-bootstrap';
import styles from '../styles/favorites.module.css';
import Axios from 'axios';
import Cookies from 'universal-cookie';
import qs from 'qs';

class Favorites extends Component {
  constructor(props) {
    super(props);
    this.state={
      isFetching: true,
      data: null
    };
    if (!this.props.loginId) this.props.history.push('/');
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate() {
    if (!this.props.loginId) this.props.history.push('/');
  }

  fetchData() {
    const cookies = new Cookies();
    const token = cookies.get('token');
    this.setState({
      isFetching: true,
      data: null
    })
    Axios.post('/api/getfavorites',
    qs.stringify({}),
    {
      headers: {'x-access-token': token}
    })
    .then(res => {
      this.setState({
        isFetching: false,
        data: res.data
      })
      console.log(res);
    })
  }

  body() {
    const { isFetching } = this.state;
    if (isFetching) return(
      <div className={styles.spinner}>
        <Spinner animation="border"  variant="primary"/>
      </div>
    )
    return (
      <Table striped hover>
        <thead>
          <tr>
            <th></th>
            <th>Document</th>
            <th>last change</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Jacob</td>
            <td>Thornton</td>
            <td>@fat</td>
          </tr>
        </tbody>
      </Table>
    );
  }

  render() {
    return(
      <div className={styles.main}>
        {this.body()}
      </div>
    )
  }
}

export default withRouter(Favorites);