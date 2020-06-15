import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { Search } from "react-feather";
import styles from "../styles/searchbar.module.css";
import Axios from "axios";

class Searchbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: props.searchText || "",
      suggestions: [],
      renderSuggestions: [],
      activeSugg: null,
      // preSugg: props.searchText || ""
    };
  }

  componentDidUpdate(prevProps) {
    const { searchText } = this.props;
    if (searchText !== prevProps.searchText) this.setState({searchText});
  }

  _submitForm = e => {
    e.preventDefault();
    const { searchText } = this.state;
    if (searchText) {
      e.target.q.blur();
      this.setState({suggestions: [], renderSuggestions: [], activeSugg: null});
      this.props.history.push("/search?q=" + searchText);
    }
  }

  _changeHandler = e => {
    const searchText = e.target.value;
    const { api, token } = this.props;
    this.setState({ searchText, preSugg: searchText, activeSugg: null });
    var words = searchText.split(" ");
    var word = words[words.length - 1];
    if ( word ) {
      Axios.get(
        api + "/search/suggest",
        {
          params: { q: word },
          headers: { "x-access-token": token }
        }
      ).then(res => {
        const suggestions = res.data;
        this.setState({ 
          suggestions: suggestions,
          renderSuggestions: suggestions.map((s, i) => {
            var words = searchText.split(" ");
            words.pop();
            words.push(s);
            var suggestion = words.join(" ").replace(searchText, "");
            return(
              <div 
                key={i} 
                onMouseEnter={() => this._mouseEnterHandler(i)}
                onClick={() => this._klickHandler(i)}
              >{searchText}<b>{suggestion}</b></div>
            )
          })
        });
      });
    } else this.setState({ suggestions: [], renderSuggestions: [] });
  };

  _keyPressHandler = e => {
    const { suggestions, searchText } = this.state;
    var { activeSugg } = this.state;
    const maxKey = suggestions.length - 1;
    var words = searchText.split(" ");
    words.pop();
    if (maxKey >= 0) {
      if (e.keyCode === 38) {
        // Arrow to the Top
        e.preventDefault();
        if (activeSugg === null) activeSugg = maxKey;
        else activeSugg -= 1;
        if (activeSugg < 0) activeSugg = maxKey;
        words.push(suggestions[activeSugg]);
        this.setState({activeSugg, searchText: words.join(" ")});
      }
      else if (e.keyCode === 40) {
        // Arrow to the Bottom
        e.preventDefault();
        if (activeSugg === null) activeSugg = 0;
        else activeSugg += 1;
        if (activeSugg > maxKey) activeSugg = 0;
        words.push(suggestions[activeSugg]);
        this.setState({activeSugg, searchText: words.join(" ")});
      }
      else if (!(e.keyCode === 39 || e.keyCode === 37)) {
        // On any Key despite Arrow Left/Right reset Suggestions
        // this.setState({activeSugg: null});
      }
    }
  }

  _mouseEnterHandler = i => {
    this.setState({ activeSugg: i });
  }

  _klickHandler = i => {
    const { searchText, suggestions } = this.state;
    var words = searchText.split(" ");
    words.pop();
    words.push(suggestions[i]);
    this.setState({ suggestions: [], activeSugg: null });
    this.props.history.push("/search?q=" + words.join(" "));
  }

  render() {
    const { searchText, suggestions, renderSuggestions, activeSugg } = this.state;
    const { autofocus } = this.props;
    return (
      <form
        className={styles.searchbar}
        onSubmit={this._submitForm}
        data-suggest={searchText && suggestions.length > 0 ? "on" : "off"}
      >
        <input
          type="text"
          value={searchText ? searchText : ""}
          placeholder="suchen"
          name="q"
          autoFocus={autofocus ? true : false}
          onChange={this._changeHandler}
          autoComplete="off"
          onKeyDown={this._keyPressHandler}
        />
        <div className={styles.suggestions}>
          {searchText ? renderSuggestions.map((s, i) => {
            return(
              <div className={(i === activeSugg) ? styles.activeSugg : ""}>{s}</div>
            )
          }) : ""}
        </div>
        <button type="submit" >
          <Search color="lightskyblue" size="36" />
        </button>
      </form>
    );
  }
}

export default withRouter(Searchbar);
