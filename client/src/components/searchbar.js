import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import styles from '../styles/searchbar.module.css';

class Searchbar extends Component {
  constructor(props) {
      super(props);
      this.state = { 
        searchText: props.searchText || ''
      }
  }

  submitForm (e) {
    e.preventDefault();
    let q = e.target.q.value;
		(q === '') ? this.props.history.push('/') : this.props.history.push('/search?q=' + e.target.q.value);
  }
  
  render() {
    const { searchText } = this.state;
    return (
      <form className={styles.sbform} onSubmit={this.submitForm.bind(this)}>
        <input type="text" defaultValue={searchText} placeholder="search" name="q" autoFocus/>
        <button type="submit" />
      </form>
    );
  }
}

export default withRouter(Searchbar);