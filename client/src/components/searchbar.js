import React, { useState, useEffect, useCallback, useRef } from "react";
// import { withRouter } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Search } from "react-feather";
import styles from "../styles/searchbar.module.css";
import Axios from "axios";
import { useGlobal } from "../context";

const stateUpdaters = {
  setSearchText: (searchText) => (prevState) => ({
    ...prevState,
    searchText,
    activeSuggestion: null,
  }),
  setSuggestions: (suggestions, renderSuggestions) => (prevState) => ({
    ...prevState,
    suggestions,
    renderSuggestions,
  }),
  setActiveSuggestion: (activeSuggestion) => (prevState) => {
    var words = prevState.searchText.split(" ");
    words.pop();
    words.push(prevState.suggestions[activeSuggestion]);
    return {
      ...prevState,
      searchText: words.join(" "),
      activeSuggestion,
      activeSuggestionMarker: activeSuggestion,
    };
  },
  setActiveSuggestionMarker: (activeSuggestionMarker) => (prevState) => {
    return {
      ...prevState,
      activeSuggestionMarker
    }
  },
  setHasFocus: (hasFocus) => (prevState) => {
    return {
      ...prevState,
      hasFocus
    }
  },
  resetState: (searchText) => () => ({
    searchText: searchText,
    suggestions: [],
    renderSuggestions: [],
    activeSuggestion: null,
    activeSuggestionMarker: null,
    hasFocus: true
  }),
};

const Searchbar = (props) => {
  const { autofocus, q } = props;
  const { api, token } = useGlobal();
  const mountedRef = useRef(true)
  const navigate = useNavigate();

  const [state, setState] = useState({
    searchText: q || "",
    suggestions: [],
    renderSuggestions: [],
    activeSuggestion: null,
    activeSuggestionMarker: null,
    hasFocus: true
  });

  const [mouseOverSuggestions, setMouseOverSuggestions] = useState(false);

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    setState(stateUpdaters.resetState(q));
  }, [q]);

  const _search = useCallback(
    (searchText) => {
      navigate("/search?q=" + searchText);
    },
    [navigate]
  );

  const _submitForm = (e) => {
    e.preventDefault();
    if (state.searchText) {
      e.target.q.blur();
      _search(state.searchText);
    }
  };

  const _suggestionClick = useCallback((s) => {
    _search(s);
  }, [_search])

  const _mouseEnterHandler = useCallback((i) => {
    // setState(stateUpdaters.setActiveSuggestion(i));
    setMouseOverSuggestions(true);
    setState(stateUpdaters.setActiveSuggestionMarker(i));
  }, []);

  const _changeHandler = useCallback(
    (e) => {
      const searchText = e.target.value;
      if (!searchText) setState(stateUpdaters.resetState(""));
      else {
        setState(stateUpdaters.setSearchText(searchText));
        var words = searchText.split(" ");
        var word = words[words.length - 1];
        if (word) {
          Axios.get(api + "/search/suggest", {
            params: { q: word },
            headers: { "x-access-token": token },
          }).then((res) => {
            const suggestions = res.data;
            if (mountedRef.current && suggestions && state.searchText) {
              setState(
                stateUpdaters.setSuggestions(
                  suggestions,
                  suggestions.map((s, i) => {
                    var words = searchText.split(" ");
                    words.pop();
                    words.push(s);
                    var suggestion = words.join(" ").replace(searchText, "");
                    return (
                      <div
                        key={i}
                        onMouseEnter={_mouseEnterHandler.bind(null, i)}
                        onClick={() => _suggestionClick(words.join(" "))}
                      >
                        {searchText}
                        <b>{suggestion}</b>
                      </div>
                    );
                  })
                )
              );
            }
          });
        }
      }
    },
    [_mouseEnterHandler, api, token, state.searchText, _suggestionClick]
  );

  const _keyPressHandler = useCallback(
    (e) => {
      const maxKey = state.suggestions.length - 1;
      if (
        state.searchText &&
        (e.keyCode === 38 || e.keyCode === 40) &&
        maxKey >= 0
      ) {
        var newActiveSuggestion = state.activeSuggestionMarker;
        e.preventDefault();
        switch (e.keyCode) {
          case 38:
            newActiveSuggestion =
              newActiveSuggestion === null
                ? maxKey
                : (newActiveSuggestion -= 1);
            newActiveSuggestion =
              newActiveSuggestion < 0 ? maxKey : newActiveSuggestion;
            break;
          case 40:
            newActiveSuggestion =
              newActiveSuggestion === null ? 0 : (newActiveSuggestion += 1);
            newActiveSuggestion =
              newActiveSuggestion > maxKey ? 0 : newActiveSuggestion;
            break;
          default:
        }
        setState(stateUpdaters.setActiveSuggestion(newActiveSuggestion));
      }
    },
    [state.activeSuggestionMarker, state.searchText, state.suggestions.length]
  );

  return (
    <form
      className={styles.searchbar}
      onSubmit={_submitForm}
      data-suggest={state.renderSuggestions.length > 0 && state.hasFocus ? "on" : "off"}
    >
      <input
        type="text"
        value={state.searchText ? state.searchText : ""}
        placeholder="suchen"
        name="q"
        autoFocus={autofocus ? true : false}
        onChange={_changeHandler}
        autoComplete="off"
        onKeyDown={_keyPressHandler}
        onFocus={() => setState(stateUpdaters.setHasFocus(true))}
        onBlur={() => { if (!mouseOverSuggestions) setState(stateUpdaters.setHasFocus(false)) }}
      />
      <div className={styles.suggestions}>
        {state.renderSuggestions && state.hasFocus
          ? state.renderSuggestions.map((s, i) => {
            return (
              <div
                key={i}
                className={
                  i === state.activeSuggestionMarker ? styles.activeSugg : ""
                }
              >
                {s}
              </div>
            );
          })
          : ""}
      </div>
      <button type="submit">
        <Search color="lightskyblue" size="36" />
      </button>
    </form>
  );
};

export default Searchbar;
