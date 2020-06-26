import React, { useState } from "react";
import { withRouter, useLocation } from "react-router-dom";
import { Search } from "react-feather";
import styles from "../styles/searchbar.module.css";
import Axios from "axios";
import { useData } from "../context";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default withRouter((props) => {
  const q = useQuery().get("q");
  const { autofocus } = props;

  const [searchText, setSearchText] = useState(q || "");
  const [active, setActive] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [baseValue, setBaseValue] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(null);

  const [api, token] = useData();

  const _search = (searchText) => {
    setActive(false);
    setSuggestions([]);
    setActiveSuggestion(null);
    props.history.push("/search?q=" + searchText);
  };

  const _submitForm = (e) => {
    e.preventDefault();
    if (searchText) {
      e.target.q.blur();
      _search(searchText);
    }
  };

  const _mouseEnterHandler = (i) => {
    setActiveSuggestion(i);
  };

  const _klickHandler = (i) => {
    var words = searchText.split(" ");
    words.pop();
    words.push(suggestions[i]);
    setSearchText(words.join(" "));
    _search(words.join(" "));
  };

  const _changeHandler = (e) => {
    const searchText = e.target.value;
    setSearchText(searchText);
    setBaseValue(searchText);
    setActiveSuggestion(null);
    setActive(true);
    var words = searchText.split(" ");
    var word = words[words.length - 1];
    if (word) {
      Axios.get(api + "/search/suggest", {
        params: { q: word },
        headers: { "x-access-token": token },
      }).then((res) => {
        const suggestions = res.data;
        if (suggestions) {
          setSuggestions(suggestions);
        }
      });
    }
  };

  const _keyPressHandler = (e) => {
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
          setActiveSuggestion(newActiveSuggestion);
          setSearchText(words.join(" "));
        } else if (e.keyCode === 40) {
          // Arrow to the Bottom
          e.preventDefault();
          if (newActiveSuggestion === null) newActiveSuggestion = 0;
          else newActiveSuggestion += 1;
          if (newActiveSuggestion > maxKey) newActiveSuggestion = 0;
          words.push(suggestions[newActiveSuggestion]);
          setActiveSuggestion(newActiveSuggestion);
          setSearchText(words.join(" "));
        }
      }
    }
  };

  const renderSuggestions = () => {
    return suggestions.map((s, i) => {
      var words = searchText.split(" ");
      words.pop();
      words.push(s);
      var suggestion = words.join(" ").replace(baseValue, "");
      return (
        <div
          key={i}
          className={i === activeSuggestion ? styles.activeSugg : ""}
          onMouseEnter={_mouseEnterHandler.bind(null, i)}
          onClick={_klickHandler.bind(null, i)}
        >
          {baseValue}
          <b>{suggestion}</b>
        </div>
      );
    });
  };

  return (
    <form
      className={styles.searchbar}
      onSubmit={_submitForm}
      data-suggest={
        active && searchText && suggestions.length > 0 ? "on" : "off"
      }
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
        {searchText && active ? renderSuggestions() : ""}
      </div>
      <button type="submit">
        <Search color="lightskyblue" size="36" />
      </button>
    </form>
  );
});
