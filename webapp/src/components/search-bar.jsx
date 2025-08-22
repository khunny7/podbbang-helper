import PropTypes from 'prop-types';
import { useState, useCallback, React } from 'react';
import './search-bar.css';

const SearchBar = (props) => {
  const { onSearch } = props;
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const onInputChange = useCallback((event) => {
    setInputValue(event.target.value);
  }, [setInputValue]);

  const submitSearch = () => {
    onSearch(inputValue);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') submitSearch();
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const clearSearch = () => {
    setInputValue('');
    onSearch('');
  };

  return (
    <div className={`search-container ${isFocused ? 'focused' : ''}`}>
      <div className="search-input-wrapper">
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search episodes..."
          aria-label="Search episodes"
          value={inputValue}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {inputValue && (
          <button
            className="clear-button"
            onClick={clearSearch}
            aria-label="Clear search"
            type="button"
          >
            ✕
          </button>
        )}
      </div>
      <button 
        className="search-button"
        onClick={submitSearch}
        aria-label="Search"
        type="button"
      >
        Search
      </button>
    </div>
  );
};

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
};

export default SearchBar;
