function SearchBar({ placeholder, searchQuery, onSearchChange }) {
  return (
    <div className="admin-search">
      <span className="admin-search-icon">Search</span>
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </div>
  );
}

export default SearchBar;
