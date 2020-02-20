import React, { Component } from 'react';
import Searchbar from '../components/searchbar';
import styles from '../styles/home.module.css';

export default class Home extends Component {
  render() {
    return (
      <div className={styles.main}>
        <Searchbar />
      </div>
    );
  }

}