import React, { useState, useEffect } from "react";
import { withRouter } from "react-router-dom";
import { Search } from "react-feather";
import styles from "../styles/searchbar.module.css";
import Axios from "axios";
import { useData } from "../context";

const Searchbar = withRouter((props) => {
  const [searchText, setSearchText] = useState(props.searchText || "");
  const [suggestions, setSuggestions] = useState([]);
  const [renderSuggestions, setRenderSuggestions] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState(null);

  const { autofocus } = props;

  const [api, token] = useData();

  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     searchText: props.searchText || "",
  //     suggestions: [],
  //     renderSuggestions: [],
  //     activeSugg: null,
  //     // preSugg: props.searchText || ""
  //   };
  // }

  // componentDidUpdate(prevProps) {
  //   const { searchText } = this.props;
  //   if (searchText !== prevProps.searchText) this.setState({searchText});
  // }

  const _submitForm = e => {
    e.preventDefault();
    if (searchText) {
      e.target.q.blur();
      props.history.push("/search?q=" + searchText);
      setSuggestions([]);
      setRenderSuggestions([]);
      setActiveSuggestion(null);
      
      
    }
  }

  const _changeHandler = e => {
    const searchText = e.target.value;
    setSearchText(searchText);
    setActiveSuggestion(null);
    var words = searchText.split(" ");
    var word = words[words.length - 1];
    if (word) {
      Axios.get(
        api + "/search/suggest",
        {
          params: { q: word },
          headers: { "x-access-token": token}
        }
      ).then(res => {
        const suggestions = res.data;
        if (suggestions) {
          setSuggestions(suggestions);
          setRenderSuggestions(suggestions.map((s, i) => {
            words.pop();
            words.push(s);
            var suggestion = words.join(" ").replace(searchText, "");
            return (
             <div 
                key={i} 
                onMouseEnter={() => _mouseEnterHandler(i)}
                onClick={() => _klickHandler(i)}
              >{searchText}<b>{suggestion}</b></div>
            )
          }))
        }
      })
    }
  }

  // const _changeHandler = e => {
  //   const searchText = e.target.value;
    
  //   setSearchText(searchText);
  //   setActiveSuggestion(null);
  //   var words = searchText.split(" ");
  //   var word = words[words.length - 1];
  //   if ( word ) {
  //     Axios.get(
  //       api + "/search/suggest",
  //       {
  //         params: { q: word },
  //         headers: { "x-access-token": token }
  //       }
  //     ).then(res => {
  //       const suggestions = res.data;
  //       this.setState({ 
  //         suggestions: suggestions,
  //         renderSuggestions: suggestions.map((s, i) => {
  //           var words = searchText.split(" ");
  //           words.pop();
  //           words.push(s);
  //           var suggestion = words.join(" ").replace(searchText, "");
  //           return(
  //             <div 
  //               key={i} 
  //               onMouseEnter={() => this._mouseEnterHandler(i)}
  //               onClick={() => this._klickHandler(i)}
  //             >{searchText}<b>{suggestion}</b></div>
  //           )
  //         })
  //       });
  //     });
  //   } else this.setState({ suggestions: [], renderSuggestions: [] });
  // };

  const _keyPressHandler = e => {
    // const { suggestions, searchText } = this.state;
    // var { activeSugg } = this.state;
    if (searchText) {
    var newActiveSuggestion = activeSuggestion;
    const maxKey = suggestions.length - 1;
    var words = searchText.split(" ");
    words.pop();
    
    if (maxKey >= 0) {
      if (e.keyCode === 38) {
        // Arrow to the Top
        e.preventDefault();
        if (newActiveSuggestion === null) newActiveSuggestion = maxKey;
        else newActiveSuggestion -= 1;
        if (newActiveSuggestion < 0) newActiveSuggestion = maxKey;
        words.push(suggestions[newActiveSuggestion]);
        console.log(newActiveSuggestion);
        setActiveSuggestion(newActiveSuggestion);
        setSearchText(words.join(" "));
        // this.setState({activeSugg, searchText: words.join(" ")});
      }
      else if (e.keyCode === 40) {
        // Arrow to the Bottom
        e.preventDefault();
        if (newActiveSuggestion === null) newActiveSuggestion = 0;
        else newActiveSuggestion += 1;
        if (newActiveSuggestion > maxKey) newActiveSuggestion = 0;
        words.push(suggestions[newActiveSuggestion]);
        setActiveSuggestion(newActiveSuggestion);
        setSearchText(words.join(" "));
        // this.setState({activeSugg, searchText: words.join(" ")});
      }
      else if (!(e.keyCode === 39 || e.keyCode === 37)) {
        // On any Key despite Arrow Left/Right reset Suggestions
        // this.setState({activeSugg: null});
      }
    }
  }
  }

  const _mouseEnterHandler = i => {
    setActiveSuggestion(i);
    // this.setState({ activeSugg: i });
  }

  const _klickHandler = i => {
    // const { searchText, suggestions } = this.state;
    var words = searchText.split(" ");
    words.pop();
    words.push(suggestions[i]);
    setSuggestions([]);
    setActiveSuggestion(null);
    // this.setState({ suggestions: [], activeSugg: null });
    this.props.history.push("/search?q=" + words.join(" "));
  }

  // render() {
  //   const { searchText, suggestions, renderSuggestions, activeSugg } = this.state;
  //   const { autofocus } = this.props;
    return (
      <form
        className={styles.searchbar}
        onSubmit={() => _submitForm}
        data-suggest={searchText && suggestions.length > 0 ? "on" : "off"}
      >
        <input
          type="text"
          value={searchText ? searchText : ""}
          placeholder="suchen"
          name="q"
          autoFocus={autofocus ? true : false}
          onChange={_changeHandler}
          autoComplete="off"
          onKeyDown={_keyPressHandler}
        />
        <div className={styles.suggestions}>
          {searchText ? renderSuggestions.map((s, i) => {
            return(
              <div key={i} className={(i === activeSuggestion) ? styles.activeSugg : ""}>{s}</div>
            )
          }) : ""}
        </div>
        <button type="submit" >
          <Search color="lightskyblue" size="36" />
        </button>
      </form>
    );
  // }
})

export default Searchbar;
